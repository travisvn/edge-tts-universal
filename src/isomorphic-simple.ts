import { IsomorphicCommunicate } from './isomorphic-communicate';

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

// Browser-compatible buffer concatenation utility with improved audio handling
function concatUint8Arrays(arrays: Uint8Array[]): Uint8Array {
  if (arrays.length === 0) return new Uint8Array(0);
  if (arrays.length === 1) return arrays[0];

  // For audio data, we want to ensure smooth concatenation
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const arr of arrays) {
    if (arr.length > 0) {
      result.set(arr, offset);
      offset += arr.length;
    }
  }

  return result;
}

/**
 * Isomorphic Edge TTS class that works in both Node.js and browser environments.
 * Uses isomorphic implementations to avoid platform-specific dependencies.
 */
export class IsomorphicEdgeTTS {
  public text: string;
  public voice: string;
  public rate: string;
  public volume: string;
  public pitch: string;

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
   * Initiates the synthesis process using isomorphic implementations.
   * @returns A promise that resolves with the synthesized audio and subtitle data.
   */
  public async synthesize(): Promise<SynthesisResult> {
    const communicate = new IsomorphicCommunicate(this.text, {
      voice: this.voice,
      rate: this.rate,
      volume: this.volume,
      pitch: this.pitch,
    });

    const audioChunks: Uint8Array[] = [];
    const wordBoundaries: WordBoundary[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      } else if (chunk.type === 'WordBoundary' && chunk.offset !== undefined && chunk.duration !== undefined && chunk.text !== undefined) {
        wordBoundaries.push({
          offset: chunk.offset,
          duration: chunk.duration,
          text: chunk.text,
        });
      }
    }

    // Convert Uint8Array chunks to Blob (works in both Node.js and browsers)
    const audioBuffer = concatUint8Arrays(audioChunks);
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

    return {
      audio: audioBlob,
      subtitle: wordBoundaries,
    };
  }
}

// ==================================================================================
// Subtitle Generation Utilities (Isomorphic - works everywhere)
// ==================================================================================

/**
 * Formats a time value from 100-nanosecond units into a VTT or SRT timestamp string.
 * @param timeIn100ns The time value in 100-nanosecond units.
 * @param format The subtitle format, which determines the decimal separator.
 * @returns A formatted timestamp string (e.g., "00:01:23.456").
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
 * @param num The number to pad.
 * @param length The desired length of the string.
 * @returns The padded number as a string.
 */
function padNumber(num: number, length = 2): string {
  return num.toString().padStart(length, '0');
}

/**
 * Creates a subtitle file content in VTT (WebVTT) format.
 * @param wordBoundaries The array of word boundary data.
 * @returns A string containing the VTT formatted subtitles.
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
 * @param wordBoundaries The array of word boundary data.
 * @returns A string containing the SRT formatted subtitles.
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