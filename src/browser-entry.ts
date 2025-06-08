// Browser-only entry point - exports only browser-compatible APIs
// Use this in environments where Node.js dependencies are not available

export {
  EdgeTTSBrowser as EdgeTTS,
  ProsodyOptions,
  WordBoundary,
  SynthesisResult,
  createVTT,
  createSRT
} from './browser';

// Export isomorphic APIs as they work in browsers too
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

// Common types and exceptions
export * from './exceptions';
export * from './types'; 