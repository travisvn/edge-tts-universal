import { SEC_MS_GEC_VERSION, VOICE_HEADERS, VOICE_LIST_URL } from './constants';
import { BrowserDRM } from './browser-drm';
import { Voice, VoicesManagerFind, VoicesManagerVoice } from './types';

/**
 * Error class for fetch-related errors (browser-specific)
 */
export class BrowserFetchError extends Error {
  response?: {
    status: number;
    headers: Record<string, string>;
  };

  constructor(message: string, response?: { status: number; headers: Record<string, string> }) {
    super(message);
    this.name = 'BrowserFetchError';
    this.response = response;
  }
}

async function _listVoices(): Promise<Voice[]> {
  const url = `${VOICE_LIST_URL}&Sec-MS-GEC=${await BrowserDRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  try {
    const response = await fetch(url, {
      headers: VOICE_HEADERS,
    });

    if (!response.ok) {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      throw new BrowserFetchError(`HTTP ${response.status}`, {
        status: response.status,
        headers
      });
    }

    const data: Voice[] = await response.json();

    for (const voice of data) {
      voice.VoiceTag.ContentCategories = voice.VoiceTag.ContentCategories.map(c => c.trim() as any);
      voice.VoiceTag.VoicePersonalities = voice.VoiceTag.VoicePersonalities.map(p => p.trim() as any);
    }

    return data;
  } catch (error) {
    if (error instanceof BrowserFetchError) {
      throw error;
    }
    // Convert other fetch errors to our BrowserFetchError format
    throw new BrowserFetchError(error instanceof Error ? error.message : 'Unknown fetch error');
  }
}

/**
 * Fetches all available voices from the Microsoft Edge TTS service (browser version).
 * Uses native browser fetch API and Web Crypto.
 * 
 * @returns Promise resolving to array of available voices
 */
export async function listVoices(): Promise<Voice[]> {
  try {
    return await _listVoices();
  } catch (e) {
    if (e instanceof BrowserFetchError && e.response?.status === 403) {
      BrowserDRM.handleClientResponseError(e.response);
      return await _listVoices();
    }
    throw e;
  }
}

/**
 * Browser-specific utility class for finding and filtering available voices.
 * Uses only browser-native APIs.
 * 
 * @example
 * ```typescript
 * const voicesManager = await BrowserVoicesManager.create();
 * const englishVoices = voicesManager.find({ Language: 'en' });
 * ```
 */
export class BrowserVoicesManager {
  private voices: VoicesManagerVoice[] = [];
  private calledCreate = false;

  /**
   * Creates a new BrowserVoicesManager instance.
   * 
   * @param customVoices - Optional custom voice list instead of fetching from API
   * @returns Promise resolving to BrowserVoicesManager instance
   */
  public static async create(customVoices?: Voice[]): Promise<BrowserVoicesManager> {
    const manager = new BrowserVoicesManager();
    const voices = customVoices ?? await listVoices();
    manager.voices = voices.map(voice => ({
      ...voice,
      Language: voice.Locale.split('-')[0],
    }));
    manager.calledCreate = true;
    return manager;
  }

  /**
   * Finds voices matching the specified criteria.
   * 
   * @param filter - Filter criteria for voice selection
   * @returns Array of voices matching the filter
   * @throws {Error} If called before create()
   */
  public find(filter: VoicesManagerFind): VoicesManagerVoice[] {
    if (!this.calledCreate) {
      throw new Error('BrowserVoicesManager.find() called before BrowserVoicesManager.create()');
    }

    return this.voices.filter(voice => {
      return Object.entries(filter).every(([key, value]) => {
        return voice[key as keyof VoicesManagerFind] === value;
      });
    });
  }
} 