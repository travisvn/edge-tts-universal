// Main thread - manages Web Worker for TTS processing
// Run this example in a browser environment

async function runWebWorkerExample() {
  console.log('🔄 Starting Web Worker TTS example...');

  // Check if we're in a browser
  if (typeof Worker === 'undefined') {
    console.error('❌ Web Workers not supported in this environment');
    return;
  }

  try {
    // Create Web Worker (you'll need to build worker.ts to worker.js first)
    const worker = new Worker('./worker.js');

    // Listen for messages from worker
    worker.onmessage = function (e) {
      const { type, audio, subtitle, error, message } = e.data;

      switch (type) {
        case 'ready':
          console.log('✅ Worker ready:', message);

          // Send synthesis request to worker
          worker.postMessage({
            type: 'synthesize',
            text: 'Hello from a Web Worker! This text-to-speech synthesis is happening in the background.',
            voice: 'en-US-EmmaMultilingualNeural',
            options: {
              rate: '+10%',
              volume: '+0%',
              pitch: '+0Hz'
            }
          });
          break;

        case 'tts-result':
          console.log(`🎵 Audio generated in worker: ${audio.size} bytes`);
          console.log(`📝 Subtitle words: ${subtitle.length}`);

          // Create audio element to play the result
          const audioUrl = URL.createObjectURL(audio);
          const audioElement = new Audio(audioUrl);
          audioElement.controls = true;

          // Add to page if in browser
          if (typeof document !== 'undefined') {
            const container = document.getElementById('audio-container') || document.body;
            const label = document.createElement('p');
            label.textContent = 'Generated audio from Web Worker:';
            container.appendChild(label);
            container.appendChild(audioElement);

            // Add download link
            const downloadLink = document.createElement('a');
            downloadLink.href = audioUrl;
            downloadLink.download = 'webworker-tts-output.mp3';
            downloadLink.textContent = 'Download Audio';
            downloadLink.style.display = 'block';
            downloadLink.style.marginTop = '10px';
            container.appendChild(downloadLink);
          }

          // Terminate worker when done
          worker.terminate();
          console.log('✅ Web Worker TTS example completed!');
          break;

        case 'error':
          console.error('❌ Worker error:', error);
          worker.terminate();
          break;
      }
    };

    worker.onerror = function (error) {
      console.error('❌ Worker failed:', error);
    };

  } catch (error) {
    console.error('❌ Failed to create Web Worker:', error);
  }
}

// Export for use in different environments
export { runWebWorkerExample };

// Auto-run in browser if this script is loaded directly
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Make function available globally
  (window as any).runWebWorkerExample = runWebWorkerExample;

  // Auto-run if there's a button or when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('run-webworker-example');
    if (button) {
      button.addEventListener('click', runWebWorkerExample);
    }
  });
} 