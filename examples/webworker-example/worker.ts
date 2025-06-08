// Web Worker for background TTS processing
import { EdgeTTS, postAudioMessage } from '../../src/webworker-entry';

// Listen for messages from main thread
self.onmessage = async function (e) {
  const { type, text, voice, options } = e.data;

  if (type === 'synthesize') {
    try {
      console.log('Worker: Starting TTS synthesis...');

      const tts = new EdgeTTS(text, voice, options);
      const result = await tts.synthesize();

      console.log(`Worker: Generated ${result.audio.size} bytes of audio`);

      // Post result back to main thread
      postAudioMessage(result.audio, result.subtitle);

    } catch (error) {
      console.error('Worker: TTS synthesis failed:', error);

      // Post error back to main thread
      self.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Signal that worker is ready
self.postMessage({
  type: 'ready',
  message: 'TTS Worker ready for synthesis requests'
}); 