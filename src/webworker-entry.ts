/**
 * Web Worker entry point for edge-tts-universal.
 * 
 * This module exports APIs specifically designed for Web Worker environments, providing
 * text-to-speech functionality that works in background threads without blocking the main UI.
 * 
 * Key features:
 * - Web Worker compatibility
 * - No DOM dependencies
 * - Background processing capabilities
 * - Message passing utilities for TTS results
 * - Isomorphic APIs that work in worker contexts
 * 
 * Web Workers provide an ideal environment for TTS processing as they:
 * - Don't block the main UI thread
 * - Have access to fetch and WebSocket APIs
 * - Can handle large audio data without freezing the page
 * - Support streaming TTS processing
 * 
 * @example
 * ```typescript
 * // In a Web Worker file
 * import { EdgeTTS, postAudioMessage, isWebWorker } from '@edge-tts/universal/webworker';
 * 
 * if (isWebWorker()) {
 *   self.addEventListener('message', async (event) => {
 *     if (event.data.type === 'synthesize') {
 *       const tts = new EdgeTTS(event.data.text, event.data.voice);
 *       const result = await tts.synthesize();
 *       postAudioMessage(result.audio, result.subtitle);
 *     }
 *   });
 * }
 * ```
 * 
 * @module WebWorkerEntry
 */

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
// Import everything from isomorphic-simple to avoid Node.js dependencies
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

// Common types and exceptions
export * from './exceptions';
export * from './types';

// Web Worker specific utilities
/**
 * Detects if the current environment is a Web Worker.
 * 
 * @returns True if running in a Web Worker context, false otherwise
 */
export function isWebWorker(): boolean {
  return typeof (globalThis as any).importScripts === 'function' &&
    typeof (globalThis as any).WorkerGlobalScope !== 'undefined';
}

/**
 * Posts a TTS result message to the main thread from a Web Worker.
 * This is a convenience function for sending audio and subtitle data
 * back to the main thread after TTS processing is complete.
 * 
 * @param audio - The synthesized audio as a Blob
 * @param subtitle - Array of subtitle/word boundary data
 * @throws {Warning} Logs a warning if called outside Web Worker context
 */
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