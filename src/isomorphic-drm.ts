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

  static handleClientResponseError(response: { status?: number; headers?: Record<string, string> }) {
    if (!response.headers) {
      throw new SkewAdjustmentError("No server date in headers.");
    }
    const serverDate = response.headers["date"];
    if (!serverDate || typeof serverDate !== 'string') {
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

    // Use appropriate crypto API based on environment
    const isNode = typeof globalThis !== 'undefined'
      ? globalThis.process?.versions?.node !== undefined
      : typeof process !== 'undefined' && process.versions?.node !== undefined;

    if (isNode) {
      // Node.js environment - use crypto module
      try {
        const crypto = await import('crypto');
        return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
      } catch (e) {
        throw new Error('Node.js crypto module not available');
      }
    } else {
      // Browser environment - use Web Crypto API
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
} 