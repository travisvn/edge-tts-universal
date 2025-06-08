import { ValueError } from "./exceptions";

export interface ITTSConfig {
  voice: string;
  rate: string;
  volume: string;
  pitch: string;
}

export class TTSConfig implements ITTSConfig {
  public voice: string;
  public rate: string;
  public volume: string;
  public pitch: string;

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
      let [, lang, region, name] = match;
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