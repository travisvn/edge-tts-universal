/**
 * Browser-specific entry point for edge-tts-universal.
 * 
 * This module exports APIs optimized specifically for browser environments, avoiding Node.js
 * dependencies and providing browser-native implementations where possible.
 * 
 * Key features:
 * - Browser-optimized implementations
 * - No Node.js dependencies
 * - Web API compatibility
 * - Smaller bundle size compared to isomorphic entry
 * - Support for Web Workers and main thread
 * 
 * Note: This entry point is subject to browser CORS policies when making requests
 * to the Microsoft Edge TTS service. Consider using a proxy server for production
 * applications if CORS becomes an issue.
 * 
 * @example
 * ```typescript
 * import { EdgeTTS, listVoices } from '@edge-tts/universal/browser';
 * 
 * // Browser-optimized TTS
 * const tts = new EdgeTTS('Hello from the browser!', 'en-US-EmmaMultilingualNeural');
 * const result = await tts.synthesize();
 * 
 * // Play the audio
 * const audio = new Audio(URL.createObjectURL(result.audio));
 * audio.play();
 * ```
 * 
 * @module BrowserEntry
 */

// Browser-only entry point - exports only browser-compatible APIs
// Use this in environments where Node.js dependencies are not available

// Export both the old EdgeTTSBrowser class and the new simplified browser API
export { EdgeTTSBrowser } from './browser';

// Export the new simplified browser-specific API as the main EdgeTTS
export {
  BrowserEdgeTTS as EdgeTTS,
  ProsodyOptions,
  WordBoundary,
  SynthesisResult,
  createVTT,
  createSRT
} from './browser-simple';

// Export browser-specific implementations to avoid Node.js dependencies
export {
  BrowserCommunicate as Communicate,
  BrowserCommunicateOptions as CommunicateOptions
} from './browser-communicate';

export {
  BrowserVoicesManager as VoicesManager,
  listVoices,
  BrowserFetchError as FetchError
} from './browser-voices';

export { BrowserDRM as DRM } from './browser-drm';

// SubMaker works everywhere as it doesn't have environment dependencies
export { SubMaker } from './submaker';

// Common types and exceptions
export * from './exceptions';
export * from './types'; 