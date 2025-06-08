import {
  calcMaxMesgSize,
  connectId,
  dateToString,
  escape,
  getHeadersAndDataFromBinary,
  getHeadersAndDataFromText,
  mkssml,
  removeIncompatibleCharacters,
  splitTextByByteLength,
  ssmlHeadersPlusData,
  unescape
} from './utils';
import {
  NoAudioReceived,
  UnexpectedResponse,
  UnknownResponse,
  WebSocketError
} from "./exceptions";
import { TTSConfig } from './tts_config';
import { CommunicateState, TTSChunk } from './types';
// Use isomorphic WebSocket that works in both Node.js and browsers
import WebSocket from 'isomorphic-ws';
import { DEFAULT_VOICE, WSS_URL, WSS_HEADERS, SEC_MS_GEC_VERSION } from './constants';
import { IsomorphicDRM } from './isomorphic-drm';
import { Buffer } from 'buffer';

/**
 * Configuration options for the isomorphic Communicate class.
 */
export interface IsomorphicCommunicateOptions {
  /** Voice to use for synthesis (e.g., "en-US-EmmaMultilingualNeural") */
  voice?: string;
  /** Speech rate adjustment (e.g., "+20%", "-10%") */
  rate?: string;
  /** Volume level adjustment (e.g., "+50%", "-25%") */
  volume?: string;
  /** Pitch adjustment in Hz (e.g., "+5Hz", "-10Hz") */
  pitch?: string;
  /** Proxy URL for requests (Node.js only) */
  proxy?: string;
  /** WebSocket connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * Isomorphic Communicate class that works in both Node.js and browsers.
 * Uses isomorphic packages to provide consistent functionality across environments.
 * 
 * @example
 * ```typescript
 * // Works in both Node.js and browsers (with CORS considerations)
 * const communicate = new IsomorphicCommunicate('Hello, world!', {
 *   voice: 'en-US-EmmaMultilingualNeural',
 * });
 * 
 * for await (const chunk of communicate.stream()) {
 *   if (chunk.type === 'audio' && chunk.data) {
 *     // Handle audio data
 *   }
 * }
 * ```
 */
export class IsomorphicCommunicate {
  private readonly ttsConfig: TTSConfig;
  private readonly texts: Generator<Buffer>;
  private readonly proxy?: string;
  private readonly connectionTimeout?: number;
  private readonly isNode: boolean;

  private state: CommunicateState = {
    partialText: Buffer.from(''),
    offsetCompensation: 0,
    lastDurationOffset: 0,
    streamWasCalled: false,
  };

  /**
   * Creates a new isomorphic Communicate instance for text-to-speech synthesis.
   * 
   * @param text - The text to synthesize
   * @param options - Configuration options for synthesis
   */
  constructor(text: string, options: IsomorphicCommunicateOptions = {}) {
    this.ttsConfig = new TTSConfig({
      voice: options.voice || DEFAULT_VOICE,
      rate: options.rate,
      volume: options.volume,
      pitch: options.pitch,
    });

    if (typeof text !== 'string') {
      throw new TypeError('text must be a string');
    }

    this.texts = splitTextByByteLength(
      escape(removeIncompatibleCharacters(text)),
      calcMaxMesgSize(this.ttsConfig),
    );

    this.proxy = options.proxy;
    this.connectionTimeout = options.connectionTimeout;

    // Detect environment
    this.isNode = typeof globalThis !== 'undefined'
      ? globalThis.process?.versions?.node !== undefined
      : typeof process !== 'undefined' && process.versions?.node !== undefined;
  }

  private parseMetadata(data: Buffer): TTSChunk {
    const metadata = JSON.parse(data.toString('utf-8'));
    for (const metaObj of metadata['Metadata']) {
      const metaType = metaObj['Type'];
      if (metaType === 'WordBoundary') {
        const currentOffset = metaObj['Data']['Offset'] + this.state.offsetCompensation;
        const currentDuration = metaObj['Data']['Duration'];
        return {
          type: metaType,
          offset: currentOffset,
          duration: currentDuration,
          text: unescape(metaObj['Data']['text']['Text']),
        };
      }
      if (metaType === 'SessionEnd') {
        continue;
      }
      throw new UnknownResponse(`Unknown metadata type: ${metaType}`);
    }
    throw new UnexpectedResponse('No WordBoundary metadata found');
  }

  private async createWebSocket(url: string): Promise<WebSocket> {
    const wsOptions: any = {
      headers: WSS_HEADERS,
    };

    // Add timeout if specified
    if (this.connectionTimeout) {
      wsOptions.timeout = this.connectionTimeout;
    }

    // Add proxy support for Node.js environment only
    if (this.isNode && this.proxy) {
      try {
        // Dynamic import for Node.js only
        const { HttpsProxyAgent } = await import('https-proxy-agent');
        wsOptions.agent = new HttpsProxyAgent(this.proxy);
      } catch (e) {
        console.warn('Proxy not supported in this environment:', e);
      }
    }

    return new WebSocket(url, wsOptions);
  }

  private async * _stream(): AsyncGenerator<TTSChunk, void, unknown> {
    const url = `${WSS_URL}&Sec-MS-GEC=${await IsomorphicDRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectId()}`;

    const websocket = await this.createWebSocket(url);
    const messageQueue: (TTSChunk | Error | 'close')[] = [];
    let resolveMessage: (() => void) | null = null;

    // Handle different message event APIs
    const handleMessage = (message: any, isBinary?: boolean) => {
      // In browsers, message.data contains the data
      const data = message.data || message;
      const binary = isBinary ?? (data instanceof ArrayBuffer || data instanceof Uint8Array);

      if (!binary && typeof data === 'string') {
        // Text message
        const [headers, parsedData] = getHeadersAndDataFromText(Buffer.from(data));

        const path = headers['Path'];
        if (path === 'audio.metadata') {
          try {
            const parsedMetadata = this.parseMetadata(parsedData);
            this.state.lastDurationOffset = parsedMetadata.offset! + parsedMetadata.duration!;
            messageQueue.push(parsedMetadata);
          } catch (e) {
            messageQueue.push(e as Error);
          }
        } else if (path === 'turn.end') {
          this.state.offsetCompensation = this.state.lastDurationOffset;
          this.state.offsetCompensation += 8_750_000;
          websocket.close();
        } else if (path !== 'response' && path !== 'turn.start') {
          messageQueue.push(new UnknownResponse(`Unknown path received: ${path}`));
        }
      } else {
        // Binary message - handle both Node.js Buffer and browser ArrayBuffer/Blob
        let bufferData: Buffer;

        if (data instanceof ArrayBuffer) {
          bufferData = Buffer.from(data);
        } else if (data instanceof Uint8Array) {
          bufferData = Buffer.from(data);
        } else if (Buffer.isBuffer(data)) {
          bufferData = data;
        } else {
          messageQueue.push(new UnexpectedResponse('Unknown binary data type'));
          return;
        }

        if (bufferData.length < 2) {
          messageQueue.push(new UnexpectedResponse('We received a binary message, but it is missing the header length.'));
        } else {
          const headerLength = bufferData.readUInt16BE(0);
          if (headerLength > bufferData.length) {
            messageQueue.push(new UnexpectedResponse('The header length is greater than the length of the data.'));
          } else {
            const [headers, audioData] = getHeadersAndDataFromBinary(bufferData);

            if (headers['Path'] !== 'audio') {
              messageQueue.push(new UnexpectedResponse('Received binary message, but the path is not audio.'));
            } else {
              const contentType = headers['Content-Type'];
              if (contentType !== 'audio/mpeg') {
                if (audioData.length > 0) {
                  messageQueue.push(new UnexpectedResponse('Received binary message, but with an unexpected Content-Type.'));
                }
              } else if (audioData.length === 0) {
                messageQueue.push(new UnexpectedResponse('Received binary message, but it is missing the audio data.'));
              } else {
                messageQueue.push({ type: 'audio', data: audioData });
              }
            }
          }
        }
      }

      if (resolveMessage) resolveMessage();
    };

    // Set up event listeners with environment-specific handling
    if (this.isNode) {
      // Node.js style events
      websocket.on('message', handleMessage);
      websocket.on('error', (error: Error) => {
        messageQueue.push(new WebSocketError(error.message));
        if (resolveMessage) resolveMessage();
      });
      websocket.on('close', () => {
        messageQueue.push('close');
        if (resolveMessage) resolveMessage();
      });
    } else {
      // Browser style events
      websocket.onmessage = handleMessage;
      websocket.onerror = (error: any) => {
        messageQueue.push(new WebSocketError(error.message || 'WebSocket error'));
        if (resolveMessage) resolveMessage();
      };
      websocket.onclose = () => {
        messageQueue.push('close');
        if (resolveMessage) resolveMessage();
      };
    }

    // Wait for connection
    await new Promise<void>((resolve, reject) => {
      const onOpen = () => resolve();
      const onError = (error: any) => reject(error);

      if (this.isNode) {
        websocket.on('open', onOpen);
        websocket.on('error', onError);
      } else {
        websocket.onopen = onOpen;
        websocket.onerror = onError;
      }
    });

    // Send configuration
    websocket.send(
      `X-Timestamp:${dateToString()}\r\n`
      + 'Content-Type:application/json; charset=utf-8\r\n'
      + 'Path:speech.config\r\n\r\n'
      + '{"context":{"synthesis":{"audio":{"metadataoptions":{'
      + '"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},'
      + '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"'
      + '}}}}\r\n'
    );

    // Send SSML
    websocket.send(
      ssmlHeadersPlusData(
        connectId(),
        dateToString(),
        mkssml(this.ttsConfig, this.state.partialText),
      )
    );

    // Process messages
    let audioWasReceived = false;
    while (true) {
      if (messageQueue.length > 0) {
        const message = messageQueue.shift()!;
        if (message === 'close') {
          if (!audioWasReceived) {
            throw new NoAudioReceived('No audio was received.');
          }
          break;
        } else if (message instanceof Error) {
          throw message;
        } else {
          if (message.type === 'audio') audioWasReceived = true;
          yield message;
        }
      } else {
        await new Promise<void>(resolve => { resolveMessage = resolve; });
      }
    }
  }

  /**
   * Streams text-to-speech synthesis results using isomorphic WebSocket.
   * Works in both Node.js and browsers (subject to CORS policy).
   * 
   * @yields TTSChunk - Audio data or word boundary information
   * @throws {Error} If called more than once
   * @throws {NoAudioReceived} If no audio data is received
   * @throws {WebSocketError} If WebSocket connection fails
   */
  async * stream(): AsyncGenerator<TTSChunk, void, unknown> {
    if (this.state.streamWasCalled) {
      throw new Error('stream can only be called once.');
    }
    this.state.streamWasCalled = true;

    for (const partialText of this.texts) {
      this.state.partialText = partialText;
      try {
        for await (const message of this._stream()) {
          yield message;
        }
      } catch (e) {
        // Note: AxiosError handling is specific to the voices.ts functionality
        // For the WebSocket communication, we don't use axios
        throw e;
      }
    }
  }
} 