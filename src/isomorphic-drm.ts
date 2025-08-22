import { TRUSTED_CLIENT_TOKEN } from './constants';
import { SkewAdjustmentError } from "./exceptions";

const WIN_EPOCH = 11644473600;
const S_TO_NS = 1e9;

/**
 * Isomorphic DRM class that works in both Node.js and browsers.
 * Uses appropriate crypto APIs based on the environment.
 */
export class IsomorphicDRM {
  private static clockSkewSeconds = 0.0;

  static adjClockSkewSeconds(skewSeconds: number) {
    IsomorphicDRM.clockSkewSeconds += skewSeconds;
  }

  static getUnixTimestamp(): number {
    return Date.now() / 1000 + IsomorphicDRM.clockSkewSeconds;
  }

  static parseRfc2616Date(date: string): number | null {
    try {
      return new Date(date).getTime() / 1000;
    } catch (e) {
      return null;
    }
  }

  static handleClientResponseError(response: { status: number; headers: any }) {
    let serverDate: string | null = null;

    if ('headers' in response && typeof response.headers === 'object') {
      if ('get' in response.headers && typeof response.headers.get === 'function') {
        // Fetch Response object
        serverDate = response.headers.get("date");
      } else {
        // Plain object with headers
        const headers = response.headers as Record<string, string>;
        serverDate = headers["date"] || headers["Date"];
      }
    }

    if (!serverDate) {
      throw new SkewAdjustmentError("No server date in headers.");
    }
    const serverDateParsed = IsomorphicDRM.parseRfc2616Date(serverDate);
    if (serverDateParsed === null) {
      throw new SkewAdjustmentError(`Failed to parse server date: ${serverDate}`);
    }
    const clientDate = IsomorphicDRM.getUnixTimestamp();
    IsomorphicDRM.adjClockSkewSeconds(serverDateParsed - clientDate);
  }

  static async generateSecMsGec(): Promise<string> {
    let ticks = IsomorphicDRM.getUnixTimestamp();
    ticks += WIN_EPOCH;
    ticks -= ticks % 300;
    ticks *= S_TO_NS / 100;

    const strToHash = `${ticks.toFixed(0)}${TRUSTED_CLIENT_TOKEN}`;

    // Use Web Crypto API directly - available in both Node.js 16+ and browsers
    if (!globalThis.crypto || !globalThis.crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(strToHash);
    const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  }
} 