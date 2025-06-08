import axios, { AxiosError, AxiosProxyConfig } from 'axios';
import { SEC_MS_GEC_VERSION, VOICE_HEADERS, VOICE_LIST_URL } from './constants';
import { DRM } from './drm';
import { Voice, VoicesManagerFind, VoicesManagerVoice } from './types';

function buildProxyConfig(proxy: string): AxiosProxyConfig | false {
  try {
    const proxyUrl = new URL(proxy);
    return {
      host: proxyUrl.hostname,
      port: parseInt(proxyUrl.port),
      protocol: proxyUrl.protocol,
    };
  } catch (e) {
    // if proxy is not a valid URL, just ignore it.
    return false;
  }
}

async function _listVoices(proxy?: string): Promise<Voice[]> {
  const url = `${VOICE_LIST_URL}&Sec-MS-GEC=${DRM.generateSecMsGec()}&Sec-MS-GEC-Version=${SEC_MS_GEC_VERSION}`;
  const response = await axios.get<Voice[]>(url, {
    headers: VOICE_HEADERS,
    proxy: proxy ? buildProxyConfig(proxy) : false,
  });

  const data = response.data;

  for (const voice of data) {
    voice.VoiceTag.ContentCategories = voice.VoiceTag.ContentCategories.map(c => c.trim() as any);
    voice.VoiceTag.VoicePersonalities = voice.VoiceTag.VoicePersonalities.map(p => p.trim() as any);
  }

  return data;
}

/**
 * Fetches all available voices from the Microsoft Edge TTS service.
 * 
 * @param proxy - Optional proxy URL for the request
 * @returns Promise resolving to array of available voices
 */
export async function listVoices(proxy?: string): Promise<Voice[]> {
  try {
    return await _listVoices(proxy);
  } catch (e) {
    if (e instanceof AxiosError && e.response?.status === 403) {
      DRM.handleClientResponseError(e);
      return await _listVoices(proxy);
    }
    throw e;
  }
}

/**
 * Utility class for finding and filtering available voices.
 * 
 * @example
 * ```typescript
 * const voicesManager = await VoicesManager.create();
 * const englishVoices = voicesManager.find({ Language: 'en' });
 * ```
 */
export class VoicesManager {
  private voices: VoicesManagerVoice[] = [];
  private calledCreate = false;

  /**
   * Creates a new VoicesManager instance.
   * 
   * @param customVoices - Optional custom voice list instead of fetching from API
   * @param proxy - Optional proxy URL for API requests
   * @returns Promise resolving to VoicesManager instance
   */
  public static async create(customVoices?: Voice[], proxy?: string): Promise<VoicesManager> {
    const manager = new VoicesManager();
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
      throw new Error('VoicesManager.find() called before VoicesManager.create()');
    }

    return this.voices.filter(voice => {
      return Object.entries(filter).every(([key, value]) => {
        return voice[key as keyof VoicesManagerFind] === value;
      });
    });
  }
} 