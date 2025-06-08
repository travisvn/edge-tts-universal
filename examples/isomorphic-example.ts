/**
 * Isomorphic Edge TTS Example
 * This example works in both Node.js and browsers (subject to CORS policy)
 */

import {
  IsomorphicCommunicate,
  IsomorphicVoicesManager,
  listVoicesIsomorphic
} from '../src';

const TEXT = 'Hello! This is an isomorphic text-to-speech example that works in both Node.js and browsers.';
const VOICE = 'en-US-EmmaMultilingualNeural';

async function isomorphicExample() {
  console.log('🌐 Running isomorphic Edge TTS example...');

  try {
    // Test voice listing (isomorphic)
    console.log('📋 Fetching available voices...');
    const voices = await listVoicesIsomorphic();
    console.log(`✅ Found ${voices.length} voices`);

    // Test voice manager (isomorphic)
    console.log('🔍 Testing voice manager...');
    const voicesManager = await IsomorphicVoicesManager.create();
    const englishVoices = voicesManager.find({ Language: 'en' });
    console.log(`✅ Found ${englishVoices.length} English voices`);

    // Test TTS synthesis (isomorphic)
    console.log('🎤 Starting TTS synthesis...');
    const communicate = new IsomorphicCommunicate(TEXT, {
      voice: VOICE,
      rate: '+10%',
      volume: '+0%',
      pitch: '+0Hz'
    });

    const audioChunks: Buffer[] = [];
    let wordCount = 0;

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
        console.log(`🔊 Audio chunk: ${chunk.data.length} bytes`);
      } else if (chunk.type === 'WordBoundary') {
        wordCount++;
        console.log(`📝 Word ${wordCount}: "${chunk.text}" at ${chunk.offset}ns`);
      }
    }

    const totalAudioSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log(`✅ Synthesis complete! Audio: ${totalAudioSize} bytes, Words: ${wordCount}`);

    // Environment-specific handling
    const isNode = typeof globalThis !== 'undefined'
      ? globalThis.process?.versions?.node !== undefined
      : typeof process !== 'undefined' && process.versions?.node !== undefined;

    if (isNode) {
      // Node.js - save to file
      const fs = await import('fs/promises');
      const path = await import('path');

      const outputFile = path.join(process.cwd(), 'isomorphic-output.mp3');
      await fs.writeFile(outputFile, Buffer.concat(audioChunks));
      console.log(`💾 Node.js: Audio saved to ${outputFile}`);
    } else {
      // Browser - create audio element
      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log(`🌐 Browser: Audio Blob created (${audioBlob.size} bytes)`);
      console.log(`🔗 Audio URL: ${audioUrl}`);

      // If running in actual browser, you could:
      // const audio = new Audio(audioUrl);
      // audio.play();
    }

  } catch (error) {
    console.error('❌ Error:', error);

    if (error instanceof Error) {
      if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
        console.log(`
🚫 CORS Error Detected!
This is expected when running in a browser due to Microsoft's CORS policy.

Solutions:
1. Use a proxy server on your backend
2. Deploy as a browser extension  
3. Use Microsoft's official Speech SDK instead
4. Run this example in Node.js where CORS doesn't apply
        `);
      }
    }
  }
}

// Universal module pattern - works in both Node.js and browsers
if (typeof module !== 'undefined' && module.exports) {
  // Node.js
  if (require.main === module) {
    isomorphicExample().catch(console.error);
  }
} else {
  // Browser - expose function globally
  (globalThis as any).runIsomorphicExample = isomorphicExample;
}

export { isomorphicExample }; 