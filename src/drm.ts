import { createHash } from 'crypto';
import { TRUSTED_CLIENT_TOKEN } from './constants';
import { SkewAdjustmentError } from "./exceptions";
import { AxiosError } from "axios";

const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

export class DRM {
  private static clockSkewSeconds = 0.0;

  static adjClockSkewSeconds(skewSeconds: number) {
    DRM.clockSkewSeconds += skewSeconds;
  }

  static getUnixTimestamp(): number {
    return Date.now() / 1000 + DRM.clockSkewSeconds;
  }

  static parseRfc2616Date(date: string): number | null {
    try {
      // The python version uses strptime with %Z, but it mentions it's not quite right.
      // JS's Date parsing is generally good with RFC 2616 dates.
      // And since it's UTC, it should be fine.
      return new Date(date).getTime() / 1000;
    } catch (e) {
      return null;
    }
  }

  static handleClientResponseError(e: AxiosError) {
    if (!e.response || !e.response.headers) {
      throw new SkewAdjustmentError("No server date in headers.");
    }
    const serverDate = e.response.headers["date"];
    if (!serverDate || typeof serverDate !== 'string') {
      throw new SkewAdjustmentError("No server date in headers.");
    }
    const serverDateParsed = DRM.parseRfc2616Date(serverDate);
    if (serverDateParsed === null) {
      throw new SkewAdjustmentError(`Failed to parse server date: ${serverDate}`);
    }
    const clientDate = DRM.getUnixTimestamp();
    DRM.adjClockSkewSeconds(serverDateParsed - clientDate);
  }

  static generateSecMsGec(): string {
    let ticks = DRM.getUnixTimestamp();
    ticks += WIN_EPOCH;
    ticks -= ticks % 300;
    ticks *= S_TO_NS / 100;

    const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
    return createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
  }
} 