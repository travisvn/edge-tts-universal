import fetch from 'cross-fetch';
import { SEC_MS_GEC_VERSION, VOICE_HEADERS, VOICE_LIST_URL } from './constants';
import { IsomorphicDRM } from './isomorphic-drm';
import { Voice, VoicesManagerFind, VoicesManagerVoice } from './types';

/**
 * Error class for fetch-related errors (isomorphic equivalent of AxiosError)
 */
export class FetchError extends Error {
  response?: {
    status: number;
    headers: Record<string, string>;
  };

  constructor(message: string, response?: { status: number; headers: Record<string, string> }) {
    super(message);
    this.name = 'FetchError';
    this.response = response;
  }
}

async function _listVoices(proxy?: string): Promise<Voice[]> {
  const url = `${VOICE_LIST_URL}&Sec-MS-GEC=${await IsomorphicDRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;

  const fetchOptions: RequestInit = {
    headers: VOICE_HEADERS,
  };

  // Note: Proxy support in browsers is limited and handled differently
  // In Node.js, we could potentially use a proxy agent with fetch
  if (proxy) {
    console.warn('Proxy support in isomorphic environment is limited. Consider using a backend proxy.');
  }

  try {
    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      throw new FetchError(`HTTP ${response.status}`, {
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
    if (error instanceof FetchError) {
      throw error;
    }
    // Convert other fetch errors to our FetchError format
    throw new FetchError(error instanceof Error ? error.message : 'Unknown fetch error');
  }
}

/**
 * Fetches all available voices from the Microsoft Edge TTS service (isomorphic version).
 * Works in both Node.js and browsers (subject to CORS policy).
 * 
 * @param proxy - Optional proxy URL for the request (limited browser support)
 * @returns Promise resolving to array of available voices
 */
export async function listVoices(proxy?: string): Promise<Voice[]> {
  try {
    return await _listVoices(proxy);
  } catch (e) {
    if (e instanceof FetchError && e.response?.status === 403) {
      IsomorphicDRM.handleClientResponseError(e.response);
      return await _listVoices(proxy);
    }
    throw e;
  }
}

/**
 * Isomorphic utility class for finding and filtering available voices.
 * Works in both Node.js and browsers (subject to CORS policy).
 * 
 * @example
 * ```typescript
 * const voicesManager = await IsomorphicVoicesManager.create();
 * const englishVoices = voicesManager.find({ Language: 'en' });
 * ```
 */
export class IsomorphicVoicesManager {
  private voices: VoicesManagerVoice[] = [];
  private calledCreate = false;

  /**
   * Creates a new IsomorphicVoicesManager instance.
   * 
   * @param customVoices - Optional custom voice list instead of fetching from API
   * @param proxy - Optional proxy URL for API requests (limited browser support)
   * @returns Promise resolving to IsomorphicVoicesManager instance
   */
  public static async create(customVoices?: Voice[], proxy?: string): Promise<IsomorphicVoicesManager> {
    const manager = new IsomorphicVoicesManager();
    const voices = customVoices ?? await listVoices(proxy);
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
      throw new Error('IsomorphicVoicesManager.find() called before IsomorphicVoicesManager.create()');
    }

    return this.voices.filter(voice => {
      return Object.entries(filter).every(([key, value]) => {
        return voice[key as keyof VoicesManagerFind] === value;
      });
    });
  }
} 