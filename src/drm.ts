import { createHash } from 'crypto';
import { TRUSTED_CLIENT_TOKEN } from './constants';
import { SkewAdjustmentError } from "./exceptions";
import { AxiosError } from "axios";

const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

/**
 * Digital Rights Management (DRM) class for handling authentication with Microsoft Edge TTS service.
 * Manages clock synchronization and security token generation for Node.js environments.
 */
export class DRM {
  private static clockSkewSeconds = 0.0;

  /**
   * Adjusts the clock skew to synchronize with server time.
   * @param skewSeconds - Number of seconds to adjust the clock by
   */
  static adjClockSkewSeconds(skewSeconds: number) {
    DRM.clockSkewSeconds += skewSeconds;
  }

  /**
   * Gets the current Unix timestamp adjusted for clock skew.
   * @returns Unix timestamp in seconds
   */
  static getUnixTimestamp(): number {
    return Date.now() / 1000 + DRM.clockSkewSeconds;
  }

  /**
   * Parses an RFC 2616 date string into a Unix timestamp.
   * @param date - RFC 2616 formatted date string
   * @returns Unix timestamp in seconds, or null if parsing fails
   */
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

  /**
   * Handles client response errors by adjusting clock skew based on server date.
   * @param e - Axios error containing server response headers
   * @throws {SkewAdjustmentError} If server date is missing or invalid
   */
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

  /**
   * Generates the Sec-MS-GEC security token required for API authentication.
   * @returns Uppercase hexadecimal SHA-256 hash string
   */
  static generateSecMsGec(): string {
    let ticks = DRM.getUnixTimestamp();
    ticks += WIN_EPOCH;
    ticks -= ticks % 300;
    ticks *= S_TO_NS / 100;

    const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;
    return createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
  }
} 