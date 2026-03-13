/**
 * Main entry point for edge-tts-universal (Node.js optimized).
 * 
 * This module provides the complete API surface for text-to-speech functionality
 * using Microsoft Edge's TTS service. It includes both Node.js-specific optimized
 * implementations and universal/isomorphic APIs for cross-platform compatibility.
 * 
 * Key features:
 * - Node.js optimized implementations with full feature set
 * - Proxy support for enterprise environments
 * - Comprehensive voice management
 * - Streaming and simple APIs
 * - Subtitle generation utilities
 * - Cross-platform compatibility layers
 * 
 * @example
 * ```typescript
 * import { EdgeTTS, listVoices, Communicate } from 'edge-tts-universal';
 * 
 * // Simple API
 * const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
 * const result = await tts.synthesize();
 * 
 * // Streaming API
 * const communicate = new Communicate('Hello, world!');
 * for await (const chunk of communicate.stream()) {
 *   if (chunk.type === 'audio') {
 *     // Handle audio data
 *   }
 * }
 * 
 * // Voice management
 * const voices = await listVoices();
 * ```
 * 
 * @module MainEntry
 */

// Node.js-specific API (uses axios, Node.js crypto, etc.)
export { Communicate, type CommunicateOptions } from './communicate';
export { SubMaker } from './submaker';
export { VoicesManager, listVoices } from './voices';

// Simple API (works in both Node.js and browsers when using appropriate exports)
export {
  EdgeTTS,
  type ProsodyOptions,
  type WordBoundary,
  type SynthesisResult,
  createVTT,
  createSRT,
  UniversalEdgeTTS
} from './simple';

// Universal/Isomorphic API (works in both Node.js and browsers)
export {
  IsomorphicCommunicate,
  type IsomorphicCommunicateOptions
} from './isomorphic-communicate';
export {
  IsomorphicVoicesManager,
  listVoices as listVoicesIsomorphic,
  FetchError
} from './isomorphic-voices';
export { IsomorphicDRM } from './isomorphic-drm';

// Simple isomorphic API
export {
  IsomorphicEdgeTTS,
  type ProsodyOptions as IsomorphicProsodyOptions,
  type WordBoundary as IsomorphicWordBoundary,
  type SynthesisResult as IsomorphicSynthesisResult,
  createVTT as createVTTIsomorphic,
  createSRT as createSRTIsomorphic
} from './isomorphic-simple';

// Universal aliases (preferred naming)
export {
  IsomorphicCommunicate as UniversalCommunicate,
  type IsomorphicCommunicateOptions as UniversalCommunicateOptions
} from './isomorphic-communicate';
export {
  IsomorphicVoicesManager as UniversalVoicesManager,
  listVoices as listVoicesUniversal,
  FetchError as UniversalFetchError
} from './isomorphic-voices';
export { IsomorphicDRM as UniversalDRM } from './isomorphic-drm';
export {
  IsomorphicEdgeTTS as UniversalEdgeTTS_Isomorphic,
  type ProsodyOptions as UniversalProsodyOptions_Isomorphic,
  type WordBoundary as UniversalWordBoundary_Isomorphic,
  type SynthesisResult as UniversalSynthesisResult_Isomorphic,
  createVTT as createVTTUniversal_Isomorphic,
  createSRT as createSRTUniversal_Isomorphic
} from './isomorphic-simple';

// Browser-specific API (uses native browser APIs only)
export {
  EdgeTTSBrowser,
  type ProsodyOptions as BrowserProsodyOptions,
  type WordBoundary as BrowserWordBoundary,
  type SynthesisResult as BrowserSynthesisResult,
  createVTT as createVTTBrowser,
  createSRT as createSRTBrowser
} from './browser';

// Common types and exceptions
export * from './exceptions';
export * from './types'; 
