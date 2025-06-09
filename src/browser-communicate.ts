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
import { DEFAULT_VOICE, WSS_URL, WSS_HEADERS, SEC_MS_GEC_VERSION } from './constants';
import { BrowserDRM } from './browser-drm';
import { Buffer } from 'buffer';

/**
 * Configuration options for the browser Communicate class.
 */
export interface BrowserCommunicateOptions {
  /** Voice to use for synthesis (e.g., "en-US-EmmaMultilingualNeural") */
  voice?: string;
  /** Speech rate adjustment (e.g., "+20%", "-10%") */
  rate?: string;
  /** Volume level adjustment (e.g., "+50%", "-25%") */
  volume?: string;
  /** Pitch adjustment in Hz (e.g., "+5Hz", "-10Hz") */
  pitch?: string;
  /** WebSocket connection timeout in milliseconds */
  connectionTimeout?: number;
}

/**
 * Browser-specific Communicate class that uses only browser-native APIs.
 * Uses native WebSocket and Web Crypto API, avoiding any Node.js dependencies.
 * 
 * @example
 * ```typescript
 * const communicate = new BrowserCommunicate('Hello, world!', {
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
export class BrowserCommunicate {
  private readonly ttsConfig: TTSConfig;
  private readonly texts: Generator<Buffer>;
  private readonly connectionTimeout?: number;

  private state: CommunicateState = {
    partialText: Buffer.from(''),
    offsetCompensation: 0,
    lastDurationOffset: 0,
    streamWasCalled: false,
  };

  /**
   * Creates a new browser Communicate instance for text-to-speech synthesis.
   * 
   * @param text - The text to synthesize
   * @param options - Configuration options for synthesis
   */
  constructor(text: string, options: BrowserCommunicateOptions = {}) {
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
    const url = `${WSS_URL}&Sec-MS-GEC=${await BrowserDRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}&ConnectionId=${connectId()}`;

    const websocket = new WebSocket(url);
    const messageQueue: (TTSChunk | Error | 'close')[] = [];
    let resolveMessage: (() => void) | null = null;

    // Set connection timeout if specified
    let timeoutId: number | undefined;
    if (this.connectionTimeout) {
      timeoutId = window.setTimeout(() => {
        websocket.close();
        messageQueue.push(new WebSocketError('Connection timeout'));
        if (resolveMessage) resolveMessage();
      }, this.connectionTimeout);
    }

    websocket.onmessage = (event: MessageEvent) => {
      // Clear timeout on first message
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }

      const data = event.data;
      const isBinary = data instanceof ArrayBuffer || data instanceof Blob;

      if (typeof data === 'string') {
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
      } else if (data instanceof ArrayBuffer) {
        // Binary message
        const bufferData = Buffer.from(data);
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
      } else if (data instanceof Blob) {
        // Handle Blob data (convert to ArrayBuffer first)
        data.arrayBuffer().then(arrayBuffer => {
          const bufferData = Buffer.from(arrayBuffer);
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
          if (resolveMessage) resolveMessage();
        });
      }

      if (resolveMessage) resolveMessage();
    };

    websocket.onerror = (error: Event) => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      messageQueue.push(new WebSocketError('WebSocket error occurred'));
      if (resolveMessage) resolveMessage();
    };

    websocket.onclose = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      messageQueue.push('close');
      if (resolveMessage) resolveMessage();
    };

    await new Promise<void>((resolve, reject) => {
      websocket.onopen = () => {
        if (timeoutId) {
          window.clearTimeout(timeoutId);
          timeoutId = undefined;
        }
        resolve();
      };

      // Set up a timeout for connection establishment
      if (this.connectionTimeout) {
        setTimeout(() => {
          if (websocket.readyState === WebSocket.CONNECTING) {
            websocket.close();
            reject(new WebSocketError('Connection timeout'));
          }
        }, this.connectionTimeout);
      }
    });

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
        await new Promise<void>(resolve => { resolveMessage = resolve; });
      }
    }
  }

  /**
   * Streams text-to-speech synthesis results using native browser WebSocket.
   * Uses only browser-native APIs, avoiding Node.js dependencies.
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
      for await (const message of this._stream()) {
        yield message;
      }
    }
  }
} 