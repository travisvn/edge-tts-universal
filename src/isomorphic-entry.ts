/**
 * Isomorphic/Universal entry point for edge-tts-universal.
 * 
 * This module exports APIs that work consistently across both Node.js and browser environments,
 * providing maximum compatibility for text-to-speech functionality using Microsoft Edge's TTS service.
 * 
 * Key features:
 * - Universal compatibility (Node.js, browsers, web workers)
 * - No platform-specific dependencies in the API surface
 * - Consistent behavior across environments
 * - Built-in proxy support for Node.js
 * - CORS-aware browser implementation
 * 
 * @example
 * ```typescript
 * import { EdgeTTS, listVoices } from '@edge-tts/universal';
 * 
 * // Works in both Node.js and browsers
 * const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
 * const result = await tts.synthesize();
 * 
 * // Get available voices
 * const voices = await listVoices();
 * ```
 * 
 * @module IsomorphicEntry
 */

// Isomorphic/Universal entry point - exports only APIs that work in both Node.js and browsers
// Use this for maximum compatibility across environments

export {
  IsomorphicCommunicate as Communicate,
  IsomorphicCommunicateOptions as CommunicateOptions
} from './isomorphic-communicate';

export {
  IsomorphicVoicesManager as VoicesManager,
  listVoices,
  FetchError
} from './isomorphic-voices';

export { IsomorphicDRM as DRM } from './isomorphic-drm';

// Simple API using isomorphic backend (all from isomorphic-simple to avoid Node.js deps)
export {
  IsomorphicEdgeTTS as EdgeTTS,
  ProsodyOptions,
  WordBoundary,
  SynthesisResult,
  createVTT,
  createSRT
} from './isomorphic-simple';

// Utility for creating subtitles (works everywhere)
export { SubMaker } from './submaker';

// Utility functions
export { removeIncompatibleCharacters } from './isomorphic-utils';

// Common types and exceptions
export * from './exceptions';
export * from './types';

// Universal aliases (preferred naming convention)
export {
  IsomorphicCommunicate as UniversalCommunicate,
  IsomorphicCommunicateOptions as UniversalCommunicateOptions
} from './isomorphic-communicate';

export {
  IsomorphicVoicesManager as UniversalVoicesManager,
  listVoices as listVoicesUniversal,
  FetchError as UniversalFetchError
} from './isomorphic-voices';

export { IsomorphicDRM as UniversalDRM } from './isomorphic-drm';

export {
  IsomorphicEdgeTTS as UniversalEdgeTTS
} from './isomorphic-simple'; 