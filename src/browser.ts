/**
 * Browser-compatible version of edge-tts Simple API
 * Uses native browser APIs instead of Node.js dependencies
 */

/**
 * Options for controlling the voice prosody (rate, pitch, volume).
 */
export interface ProsodyOptions {
  /**
   * The speaking rate of the voice.
   * Examples: "+10.00%", "-20.00%"
   */
  rate?: string;
  /**
   * The speaking volume of the voice.
   * Examples: "+15.00%", "-10.00%"
   */
  volume?: string;
  /**
   * The speaking pitch of the voice.
   * Examples: "+20Hz", "-10Hz"
   */
  pitch?: string;
}

/**
 * Represents a single word boundary with its timing and text.
 * The API provides timing in 100-nanosecond units.
 */
export interface WordBoundary {
  /**
   * The offset from the beginning of the audio stream in 100-nanosecond units.
   */
  offset: number;
  /**
   * The duration of the word in 100-nanosecond units.
   */
  duration: number;
  /**
   * The text of the spoken word.
   */
  text: string;
}

/**
 * The final result of the synthesis process.
 */
export interface SynthesisResult {
  /**
   * The generated audio as a Blob, which can be used in an <audio> element.
   */
  audio: Blob;
  /**
   * An array of word boundaries containing timing and text for creating subtitles.
   */
  subtitle: WordBoundary[];
}

/**
 * Browser-compatible Edge TTS class that uses native browser APIs.
 * 
 * @warning This uses an undocumented Microsoft API. CORS policy may prevent
 * direct usage from web apps. Consider using a proxy server.
 */
export class EdgeTTSBrowser {
  public text: string;
  public voice: string;
  public rate: string;
  public volume: string;
  public pitch: string;

  private ws: WebSocket | null = null;
  private readonly WSS_URL = "wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1";
  private readonly TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";

  /**
   * @param text The text to be synthesized.
   * @param voice The voice to use for synthesis.
   * @param options Prosody options (rate, volume, pitch).
   */
  constructor(
    text: string,
    voice = "Microsoft Server Speech Text to Speech Voice (en-US, EmmaMultilingualNeural)",
    options: ProsodyOptions = {}
  ) {
    this.text = text;
    this.voice = voice;
    this.rate = options.rate || "+0%";
    this.volume = options.volume || "+0%";
    this.pitch = options.pitch || "+0Hz";
  }

  /**
   * Initiates the synthesis process.
   * @returns A promise that resolves with the synthesized audio and subtitle data.
   */
  public async synthesize(): Promise<SynthesisResult> {
    await this.connect();

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not connected.");
    }

    this.ws.send(this.createSpeechConfig());
    this.ws.send(this.createSSML());

    return new Promise((resolve, reject) => {
      const audioChunks: Uint8Array[] = [];
      let wordBoundaries: WordBoundary[] = [];

      if (this.ws) {
        this.ws.onmessage = (event: MessageEvent) => {
          if (typeof event.data === "string") {
            // Text message
            const { headers, body } = this.parseMessage(event.data);
            if (headers.Path === "audio.metadata") {
              try {
                const metadata = JSON.parse(body);
                if (metadata.Metadata && Array.isArray(metadata.Metadata)) {
                  const boundaries = metadata.Metadata
                    .filter((item: any) => item.Type === "WordBoundary" && item.Data)
                    .map((item: any) => ({
                      offset: item.Data.Offset,
                      duration: item.Data.Duration,
                      text: item.Data.text.Text,
                    }));
                  wordBoundaries = wordBoundaries.concat(boundaries);
                }
              } catch (e) {
                // Ignore JSON parsing errors for metadata
              }
            } else if (headers.Path === "turn.end") {
              if (this.ws) this.ws.close();
            }
          } else if (event.data instanceof Blob) {
            // Binary audio message
            event.data.arrayBuffer().then(arrayBuffer => {
              const dataView = new DataView(arrayBuffer);
              const headerLength = dataView.getUint16(0);

              if (arrayBuffer.byteLength > headerLength + 2) {
                const audioData = new Uint8Array(arrayBuffer, headerLength + 2);
                audioChunks.push(audioData);
              }
            });
          }
        };

        this.ws.onclose = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/mpeg" });
          resolve({ audio: audioBlob, subtitle: wordBoundaries });
        };

        this.ws.onerror = (error) => {
          reject(error);
        };
      }
    });
  }

  /**
   * Establishes a connection to the WebSocket server.
   */
  private connect(): Promise<void> {
    const connectionId = this.generateConnectionId();
    const secMsGec = this.generateSecMsGec();
    const url = `${this.WSS_URL}?TrustedClientToken=${this.TRUSTED_CLIENT_TOKEN}&ConnectionId=${connectionId}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-130.0.2849.68`;

    this.ws = new WebSocket(url);

    return new Promise((resolve, reject) => {
      if (!this.ws) {
        return reject(new Error("WebSocket not initialized"));
      }
      this.ws.onopen = () => {
        resolve();
      };
      this.ws.onerror = (error) => {
        reject(error);
      };
    });
  }

  /**
   * Parses a string message from the WebSocket into headers and a body.
   */
  private parseMessage(message: string): { headers: Record<string, string>; body: string } {
    const parts = message.split("\r\n\r\n");
    const headerLines = parts[0].split("\r\n");
    const headers: Record<string, string> = {};
    headerLines.forEach(line => {
      const [key, value] = line.split(":", 2);
      if (key && value) {
        headers[key.trim()] = value.trim();
      }
    });
    return { headers, body: parts[1] || '' };
  }

  /**
   * Creates the speech configuration message.
   */
  private createSpeechConfig(): string {
    const config = {
      context: {
        synthesis: {
          audio: {
            metadataoptions: {
              sentenceBoundaryEnabled: false,
              wordBoundaryEnabled: true,
            },
            outputFormat: "audio-24khz-48kbitrate-mono-mp3",
          },
        },
      },
    };
    return `X-Timestamp:${this.getTimestamp()}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n${JSON.stringify(config)}`;
  }

  /**
   * Creates the SSML (Speech Synthesis Markup Language) message.
   */
  private createSSML(): string {
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>
      <voice name='${this.voice}'>
        <prosody pitch='${this.pitch}' rate='${this.rate}' volume='${this.volume}'>
          ${this.escapeXml(this.text)}
        </prosody>
      </voice>
    </speak>`;
    return `X-RequestId:${this.generateConnectionId()}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${this.getTimestamp()}Z\r\nPath:ssml\r\n\r\n${ssml}`;
  }

  private generateConnectionId(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  }

  private escapeXml(text: string): string {
    return text.replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case "<": return "&lt;";
        case ">": return "&gt;";
        case "&": return "&amp;";
        case "'": return "&apos;";
        case '"': return "&quot;";
        default: return char;
      }
    });
  }

  /**
   * Browser-compatible version of DRM security token generation
   * Uses Web Crypto API instead of Node.js crypto
   */
  private async generateSecMsGec(): Promise<string> {
    const WIN_EPOCH = 11644473600;
    const S_TO_NS = 1e9;

    let ticks = Date.now() / 1000;
    ticks += WIN_EPOCH;
    ticks -= ticks % 300;
    ticks *= S_TO_NS / 100;

    const strToHash = `${ticks.toFixed(0)}${this.TRUSTED_CLIENT_TOKEN}`;

    // Use Web Crypto API for hashing
    const encoder = new TextEncoder();
    const data = encoder.encode(strToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
}

// ==================================================================================
// Subtitle Generation Utilities (Browser Compatible)
// ==================================================================================

/**
 * Formats a time value from 100-nanosecond units into a VTT or SRT timestamp string.
 */
function formatTimestamp(timeIn100ns: number, format: 'vtt' | 'srt'): string {
  const totalSeconds = Math.floor(timeIn100ns / 10000000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((timeIn100ns % 10000000) / 10000);
  const separator = format === 'vtt' ? '.' : ',';
  return `${padNumber(hours)}:${padNumber(minutes)}:${padNumber(seconds)}${separator}${padNumber(milliseconds, 3)}`;
}

/**
 * Pads a number with leading zeros to a specified length.
 */
function padNumber(num: number, length = 2): string {
  return num.toString().padStart(length, '0');
}

/**
 * Creates a subtitle file content in VTT (WebVTT) format.
 */
export function createVTT(wordBoundaries: WordBoundary[]): string {
  let vttContent = "WEBVTT\n\n";
  wordBoundaries.forEach((word, index) => {
    const startTime = formatTimestamp(word.offset, 'vtt');
    const endTime = formatTimestamp(word.offset + word.duration, 'vtt');
    vttContent += `${index + 1}\n`;
    vttContent += `${startTime} --> ${endTime}\n`;
    vttContent += `${word.text}\n\n`;
  });
  return vttContent;
}

/**
 * Creates a subtitle file content in SRT (SubRip) format.
 */
export function createSRT(wordBoundaries: WordBoundary[]): string {
  let srtContent = "";
  wordBoundaries.forEach((word, index) => {
    const startTime = formatTimestamp(word.offset, 'srt');
    const endTime = formatTimestamp(word.offset + word.duration, 'srt');
    srtContent += `${index + 1}\n`;
    srtContent += `${startTime} --> ${endTime}\n`;
    srtContent += `${word.text}\n\n`;
  });
  return srtContent;
} 