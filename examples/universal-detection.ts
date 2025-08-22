/**
 * Universal Environment Detection Example
 * This example shows how to detect the environment and use appropriate APIs
 */

// Environment detection function
function detectEnvironment() {
  // Check for Node.js
  const isNode = typeof process !== 'undefined' &&
    process.versions &&
    process.versions.node;

  // Check for browser
  const isBrowser = typeof window !== 'undefined' &&
    typeof window.document !== 'undefined';

  // Check for Web Workers  
  const isWebWorker = typeof importScripts === 'function' &&
    typeof (globalThis as any).WorkerGlobalScope !== 'undefined';

  // Check for Deno
  const isDeno = typeof (globalThis as any).Deno !== 'undefined';

  // Check for Bun
  const isBun = typeof (globalThis as any).Bun !== 'undefined';

  return {
    isNode,
    isBrowser,
    isWebWorker,
    isDeno,
    isBun,
    platform: isNode ? 'node' :
      isBrowser ? 'browser' :
        isWebWorker ? 'webworker' :
          isDeno ? 'deno' :
            isBun ? 'bun' :
              'unknown'
  };
}

// Dynamic import based on environment
async function createTTSInstance(text: string, voice?: string) {
  const env = detectEnvironment();
  console.log('Detected environment:', env.platform);

  switch (env.platform) {
    case 'node':
      // Use full Node.js API with all features
      const { EdgeTTS } = await import('../dist/index.js');
      return new EdgeTTS(text, voice);

    case 'browser':
      // Use browser-specific API for optimal bundle size
      const { EdgeTTS: BrowserEdgeTTS } = await import('../dist/browser.js');
      return new BrowserEdgeTTS(text, voice);

    case 'deno':
    case 'bun':
    default:
      // Use isomorphic API for maximum compatibility
      const { EdgeTTS: IsomorphicTTS } = await import('../dist/isomorphic.js');
      return new IsomorphicTTS(text, voice);
  }
}

// Universal synthesis function
async function universalSynthesis() {
  const text = 'Hello from a universal text-to-speech library!';
  const voice = 'en-US-EmmaMultilingualNeural';

  try {
    const tts = await createTTSInstance(text, voice);
    const result = await tts.synthesize();

    console.log(`✅ Generated audio: ${result.audio.size} bytes`);
    console.log(`📝 Word boundaries: ${result.subtitle.length}`);

    const env = detectEnvironment();

    // Handle result based on environment
    if (env.isNode) {
      // Node.js - save to file
      const fs = await import('fs/promises');
      await fs.writeFile('universal-output.mp3', Buffer.from(await result.audio.arrayBuffer()));
      console.log('💾 Audio saved to universal-output.mp3');
    } else if (env.isBrowser) {
      // Browser - create downloadable link
      const url = URL.createObjectURL(result.audio);
      console.log(`🔗 Audio URL: ${url}`);

      // Create download link
      const a = document.createElement('a');
      a.href = url;
      a.download = 'universal-output.mp3';
      a.textContent = 'Download Audio';
      document.body.appendChild(a);
    } else {
      // Other environments
      console.log('🌐 Audio ready for processing in your environment');
    }

  } catch (error) {
    console.error('❌ Universal synthesis failed:', error);

    if (error instanceof Error && error.message.includes('CORS')) {
      console.log('💡 Tip: Use a proxy server for browser applications');
    }
  }
}

// Export for use in different environments
export { detectEnvironment, createTTSInstance, universalSynthesis };

// Auto-run in appropriate environments
// ESM equivalent check
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  // Node.js
  universalSynthesis().catch(console.error);
} else if (typeof globalThis !== 'undefined') {
  // Global scope - make function available
  (globalThis as any).runUniversalExample = universalSynthesis;
} 