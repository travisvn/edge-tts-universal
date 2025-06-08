export { Communicate, CommunicateOptions } from './communicate';
export { SubMaker } from './submaker';
export { VoicesManager, listVoices } from './voices';
export * from './exceptions';
export * from './types';
// Simple API (compatible with code (54).ts)
export { EdgeTTS, ProsodyOptions, WordBoundary, SynthesisResult, createVTT, createSRT } from './simple';

// Isomorphic API (works in both Node.js and browsers)
export {
  IsomorphicCommunicate,
  IsomorphicCommunicateOptions
} from './isomorphic-communicate';
export {
  IsomorphicVoicesManager,
  listVoices as listVoicesIsomorphic,
  FetchError
} from './isomorphic-voices';
export { IsomorphicDRM } from './isomorphic-drm'; 