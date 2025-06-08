import { ValueError } from "./exceptions";

/**
 * Interface defining the configuration options for TTS synthesis.
 */
export interface ITTSConfig {
  /** Voice name to use for synthesis */
  voice: string;
  /** Speech rate adjustment (e.g., "+20%", "-10%") */
  rate: string;
  /** Volume level adjustment (e.g., "+50%", "-25%") */
  volume: string;
  /** Pitch adjustment in Hz (e.g., "+5Hz", "-10Hz") */
  pitch: string;
}

/**
 * Configuration class for TTS synthesis parameters.
 * Handles voice name normalization and parameter validation.
 * 
 * @example
 * ```typescript
 * const config = new TTSConfig({
 *   voice: 'en-US-EmmaMultilingualNeural',
 *   rate: '+20%',
 *   volume: '+10%',
 *   pitch: '+5Hz'
 * });
 * ```
 */
export class TTSConfig implements ITTSConfig {
  public voice: string;
  public rate: string;
  public volume: string;
  public pitch: string;

  /**
   * Creates a new TTSConfig instance with the specified parameters.
   * 
   * @param options - Configuration options
   * @param options.voice - Voice name (supports both short and full formats)
   * @param options.rate - Speech rate adjustment (default: "+0%")
   * @param options.volume - Volume adjustment (default: "+0%") 
   * @param options.pitch - Pitch adjustment (default: "+0Hz")
   * @throws {ValueError} If any parameter has an invalid format
   */
  constructor({
    voice,
    rate = "+0%",
    volume = "+0%",
    pitch = "+0Hz",
  }: {
    voice: string,
    rate?: string,
    volume?: string,
    pitch?: string,
  }) {
    this.voice = voice;
    this.rate = rate;
    this.volume = volume;
    this.pitch = pitch;

    this.validate();
  }

  private validate() {
    // Voice validation and transformation
    const match = /^([a-z]{2,})-([A-Z]{2,})-(.+Neural)$/.exec(this.voice);
    if (match) {
      const [, lang] = match;
      let [, , region, name] = match;
      if (name.includes('-')) {
        const parts = name.split('-');
        region += `-${parts[0]}`;
        name = parts[1];
      }
      this.voice = `Microsoft Server Speech Text to Speech Voice (${lang}-${region}, ${name})`;
    }

    TTSConfig.validateStringParam(
      "voice",
      this.voice,
      /^Microsoft Server Speech Text to Speech Voice \(.+,.+\)$/
    );
    TTSConfig.validateStringParam("rate", this.rate, /^[+-]\d+%$/);
    TTSConfig.validateStringParam("volume", this.volume, /^[+-]\d+%$/);
    TTSConfig.validateStringParam("pitch", this.pitch, /^[+-]\d+Hz$/);
  }

  private static validateStringParam(paramName: string, paramValue: string, pattern: RegExp) {
    if (typeof paramValue !== 'string') {
      throw new TypeError(`${paramName} must be a string`);
    }
    if (!pattern.test(paramValue)) {
      throw new ValueError(`Invalid ${paramName} '${paramValue}'.`);
    }
  }
} 