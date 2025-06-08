// Node.js-specific API (uses axios, Node.js crypto, etc.)
export { Communicate, CommunicateOptions } from './communicate';
export { SubMaker } from './submaker';
export { VoicesManager, listVoices } from './voices';

// Simple API (works in both Node.js and browsers when using appropriate exports)
export { EdgeTTS, ProsodyOptions, WordBoundary, SynthesisResult, createVTT, createSRT } from './simple';

// Universal/Isomorphic API (works in both Node.js and browsers)
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

// Browser-specific API (uses native browser APIs only)
export {
  EdgeTTSBrowser,
  ProsodyOptions as BrowserProsodyOptions,
  WordBoundary as BrowserWordBoundary,
  SynthesisResult as BrowserSynthesisResult,
  createVTT as createVTTBrowser,
  createSRT as createSRTBrowser
} from './browser';

// Common types and exceptions
export * from './exceptions';
export * from './types'; 