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

// Simple API using isomorphic backend
export { EdgeTTS, ProsodyOptions, WordBoundary, SynthesisResult, createVTT, createSRT } from './simple';

// Utility for creating subtitles (works everywhere)
export { SubMaker } from './submaker';

// Common types and exceptions
export * from './exceptions';
export * from './types'; 