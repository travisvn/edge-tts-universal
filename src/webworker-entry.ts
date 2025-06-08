// Web Worker entry point - exports only APIs that work in Web Worker environments
// Web Workers don't have access to DOM but do have Web APIs like fetch and WebSocket

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

// Simple API using isomorphic backend (works in Web Workers)
export { EdgeTTS, ProsodyOptions, WordBoundary, SynthesisResult, createVTT, createSRT } from './simple';

// Utility for creating subtitles (works everywhere)
export { SubMaker } from './submaker';

// Common types and exceptions
export * from './exceptions';
export * from './types';

// Web Worker specific utilities
export function isWebWorker(): boolean {
  return typeof (globalThis as any).importScripts === 'function' &&
    typeof (globalThis as any).WorkerGlobalScope !== 'undefined';
}

export function postAudioMessage(audio: Blob, subtitle: any[]) {
  if (isWebWorker()) {
    // In a Web Worker, post message to main thread
    (globalThis as any).postMessage({
      type: 'tts-result',
      audio: audio,
      subtitle: subtitle
    });
  } else {
    console.warn('postAudioMessage should only be called in Web Worker context');
  }
} 