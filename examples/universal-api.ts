/**
 * Universal API Example (Preferred Naming Convention)
 * This example demonstrates the preferred "Universal" naming instead of "Isomorphic"
 */

import {
  UniversalCommunicate,
  UniversalVoicesManager,
  listVoicesUniversal,
  UniversalEdgeTTS
} from '../dist/index.js';

const TEXT = 'Hello! This demonstrates the preferred Universal API naming.';
const VOICE = 'en-US-EmmaMultilingualNeural';

async function universalApiExample() {
  console.log('🌍 Running Universal API example (preferred naming)...');

  try {
    // Test voice listing with Universal naming
    console.log('📋 Fetching available voices...');
    const voices = await listVoicesUniversal();
    console.log(`✅ Found ${voices.length} voices`);

    // Test voice manager with Universal naming
    console.log('🔍 Testing Universal voice manager...');
    const voicesManager = await UniversalVoicesManager.create();
    const englishVoices = voicesManager.find({ Language: 'en' });
    console.log(`✅ Found ${englishVoices.length} English voices`);

    // Test simple Universal API
    console.log('🎤 Testing Universal EdgeTTS (simple API)...');
    const tts = new UniversalEdgeTTS(TEXT, VOICE, {
      rate: '+15%',
      volume: '+0%',
      pitch: '+5Hz'
    });

    const result = await tts.synthesize();
    console.log(`✅ Simple synthesis: ${result.audio.size} bytes, ${result.subtitle.length} words`);

    // Test streaming Universal API
    console.log('🎵 Testing Universal streaming API...');
    const communicate = new UniversalCommunicate(TEXT, {
      voice: VOICE,
      rate: '+10%',
      volume: '+0%',
      pitch: '+0Hz'
    });

    const audioChunks: Uint8Array[] = [];
    let wordCount = 0;

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
      } else if (chunk.type === 'WordBoundary') {
        wordCount++;
        console.log(`📝 Word ${wordCount}: "${chunk.text}"`);
      }
    }

    const totalAudioSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log(`✅ Universal streaming complete! Audio: ${totalAudioSize} bytes, Words: ${wordCount}`);

    // Environment-specific handling
    if (typeof process !== 'undefined' && process.versions?.node) {
      // Node.js - save to file
      const fs = await import('fs/promises');
      const path = await import('path');

      const outputFile = path.join(process.cwd(), 'universal-api-output.mp3');
      
      // Concatenate Uint8Arrays
      const totalLength = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const concatenated = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        concatenated.set(chunk, offset);
        offset += chunk.length;
      }
      
      await fs.writeFile(outputFile, concatenated);
      console.log(`💾 Node.js: Audio saved to ${outputFile}`);
    } else {
      // Browser or other environments
      console.log('🌐 Audio data ready for browser processing');
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
3. Use Microsoft's official Speech SDK for browser apps
4. Run this example in Node.js where CORS doesn't apply
        `);
      }
    }
  }
}

// ESM equivalent check
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  // Node.js
  universalApiExample().catch(console.error);
} else if (typeof globalThis !== 'undefined') {
  // Browser - expose function globally
  (globalThis as any).runUniversalApiExample = universalApiExample;
}

export { universalApiExample };