import {
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
import { DRM } from './drm';
import { AxiosError } from 'axios';

// HttpsProxyAgent will be imported dynamically when needed
let HttpsProxyAgent: any;

/**
 * Configuration options for the Communicate class.
 */
export interface CommunicateOptions {
  /** Voice to use for synthesis (e.g., "en-US-EmmaMultilingualNeural") */
  voice?: string;
  /** Speech rate adjustment (e.g., "+20%", "-10%") */
  rate?: string;
  /** Volume level adjustment (e.g., "+50%", "-25%") */
  volume?: string;
  /** Pitch adjustment in Hz (e.g., "+5Hz", "-10Hz") */
  pitch?: string;
  /** Proxy URL for requests */
  proxy?: string;
  /** WebSocket connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * Main class for text-to-speech synthesis using Microsoft Edge's online TTS service.
 * 
 * @example
 * ```typescript
 * const communicate = new Communicate('Hello, world!', {
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
export class Communicate {
  private readonly ttsConfig: TTSConfig;
  private readonly texts: Generator<Buffer>;
  private readonly proxy?: string;
  private readonly connectionTimeout?: number;

  private state: CommunicateState = {
    partialText: Buffer.from(''),
    offsetCompensation: 0,
    lastDurationOffset: 0,
    streamWasCalled: false,
  };

  /**
   * Creates a new Communicate instance for text-to-speech synthesis.
   * 
   * @param text - The text to synthesize
   * @param options - Configuration options for synthesis
   */
  constructor(text: string, options: CommunicateOptions = {}) {
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
      // calcMaxMesgSize(this.ttsConfig),
      4096,
    );

    this.proxy = options.proxy;
    this.connectionTimeout = options.connectionTimeout;
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

  private async * _stream(): AsyncGenerator<TTSChunk, void, unknown> {
    const url = `${WSS_URL}&Sec-MS-GEC=${DRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectId()}`;

    let agent: any;
    if (this.proxy) {
      // Import HttpsProxyAgent dynamically only when needed
      if (!HttpsProxyAgent) {
        try {
          const proxyModule = await import('https-proxy-agent');
          HttpsProxyAgent = proxyModule.HttpsProxyAgent;
        } catch (e) {
          console.warn('https-proxy-agent not available:', e);
        }
      }
      if (HttpsProxyAgent) {
        agent = new HttpsProxyAgent(this.proxy);
      }
    }

    const websocket = new WebSocket(url, {
      headers: WSS_HEADERS,
      timeout: this.connectionTimeout,
      agent: agent,
    });

    const messageQueue: (TTSChunk | Error | 'close')[] = [];
    let resolveMessage: (() => void) | null = null;

    websocket.on('message', (message: Buffer, isBinary: boolean) => {
      if (!isBinary) {
        // text message
        const [headers, data] = getHeadersAndDataFromText(message);

        const path = headers['Path'];
        if (path === 'audio.metadata') {
          try {
            const parsedMetadata = this.parseMetadata(data);
            this.state.lastDurationOffset = parsedMetadata.offset! + parsedMetadata.duration!;
            messageQueue.push(parsedMetadata);
          } catch (e) {
            messageQueue.push(e as Error);
          }
        } else if (path === 'turn.end') {
          this.state.offsetCompensation = this.state.lastDurationOffset;
          websocket.close();
        } else if (path !== 'response' && path !== 'turn.start') {
          messageQueue.push(new UnknownResponse(`Unknown path received: ${path}`));
        }
      } else {
        // binary message
        if (message.length < 2) {
          messageQueue.push(new UnexpectedResponse('We received a binary message, but it is missing the header length.'));
        } else {
          const headerLength = message.readUInt16BE(0);
          if (headerLength > message.length) {
            messageQueue.push(new UnexpectedResponse('The header length is greater than the length of the data.'));
          } else {
            const [headers, data] = getHeadersAndDataFromBinary(message);

            if (headers['Path'] !== 'audio') {
              messageQueue.push(new UnexpectedResponse('Received binary message, but the path is not audio.'));
            } else {
              const contentType = headers['Content-Type'];
              if (contentType !== 'audio/mpeg') {
                if (data.length > 0) {
                  messageQueue.push(new UnexpectedResponse('Received binary message, but with an unexpected Content-Type.'));
                }
              } else if (data.length === 0) {
                messageQueue.push(new UnexpectedResponse('Received binary message, but it is missing the audio data.'));
              } else {
                messageQueue.push({ type: 'audio', data: data });
              }
            }
          }
        }
      }
      if (resolveMessage) resolveMessage();
    });

    websocket.on('error', (error) => {
      messageQueue.push(new WebSocketError(error.message));
      if (resolveMessage) resolveMessage();
    });

    websocket.on('close', () => {
      messageQueue.push('close');
      if (resolveMessage) resolveMessage();
    });

    await new Promise<void>(resolve => websocket.on('open', resolve));

    websocket.send(
      `X-Timestamp:${dateToString()}\r\n`
      + 'Content-Type:application/json; charset=utf-8\r\n'
      + 'Path:speech.config\r\n\r\n'
      + '{"context":{"synthesis":{"audio":{"metadataoptions":{'
      + '"sentenceBoundaryEnabled":"false","wordBoundaryEnabled":"true"},'
      + '"outputFormat":"audio-24khz-48kbitrate-mono-mp3"'
      + '}}}}\r\n'
    );

    websocket.send(
      ssmlHeadersPlusData(
        connectId(),
        dateToString(),
        mkssml(this.ttsConfig, this.state.partialText),
      )
    );

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
        // Use a more responsive wait mechanism
        await new Promise<void>(resolve => {
          resolveMessage = resolve;
          // Add a small timeout to prevent indefinite waiting
          setTimeout(resolve, 50);
        });
      }
    }
  }

  /**
   * Streams text-to-speech synthesis results.
   * 
   * Returns an async generator that yields audio chunks and word boundary events.
   * Can only be called once per Communicate instance.
   * 
   * @yields TTSChunk - Audio data or word boundary information
   * @throws {Error} If called more than once
   * @throws {NoAudioReceived} If no audio data is received
   * @throws {WebSocketError} If WebSocket connection fails
   * 
   * @example
   * ```typescript
   * for await (const chunk of communicate.stream()) {
   *   if (chunk.type === 'audio') {
   *     // Process audio data
   *   } else if (chunk.type === 'WordBoundary') {
   *     // Process subtitle timing
   *   }
   * }
   * ```
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
        if (e instanceof AxiosError && e.response?.status === 403) {
          DRM.handleClientResponseError(e);
          for await (const message of this._stream()) {
            yield message;
          }
        } else {
          throw e;
        }
      }
    }
  }
} 