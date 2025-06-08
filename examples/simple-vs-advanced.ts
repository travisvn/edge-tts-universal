import { EdgeTTS, createVTT, createSRT, Communicate } from '../src';

async function simpleApiExample() {
  console.log('=== Simple API Example (like code 54.ts) ===');

  // Simple one-shot synthesis
  const tts = new EdgeTTS(
    'Hello, this is a simple text-to-speech example!',
    'Microsoft Server Speech Text to Speech Voice (en-US, EmmaMultilingualNeural)',
    {
      rate: '+10%',
      volume: '+0%',
      pitch: '+0Hz'
    }
  );

  try {
    const result = await tts.synthesize();

    console.log('Audio generated:', result.audio.size, 'bytes');
    console.log('Word boundaries:', result.subtitle.length);

    // Generate subtitles
    const vttSubtitles = createVTT(result.subtitle);
    const srtSubtitles = createSRT(result.subtitle);

    console.log('VTT Subtitles:\n', vttSubtitles.substring(0, 200) + '...');
    console.log('SRT Subtitles:\n', srtSubtitles.substring(0, 200) + '...');

  } catch (error) {
    console.error('Simple API Error:', error);
  }
}

async function advancedApiExample() {
  console.log('\n=== Advanced Streaming API Example ===');

  // Advanced streaming synthesis with real-time processing
  const communicate = new Communicate(
    'This is an advanced streaming example with real-time processing capabilities.',
    {
      voice: 'en-US-EmmaMultilingualNeural',
      rate: '+10%',
      volume: '+0%',
      pitch: '+0Hz'
    }
  );

  try {
    const audioChunks: Buffer[] = [];
    let wordCount = 0;

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
        console.log(`Received audio chunk: ${chunk.data.length} bytes`);
      } else if (chunk.type === 'WordBoundary') {
        wordCount++;
        console.log(`Word ${wordCount}: "${chunk.text}" at ${chunk.offset}ns`);
      }
    }

    const totalAudioSize = audioChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    console.log(`Total audio: ${totalAudioSize} bytes, Words: ${wordCount}`);

  } catch (error) {
    console.error('Advanced API Error:', error);
  }
}

// Run both examples
async function main() {
  await simpleApiExample();
  await advancedApiExample();
}

if (require.main === module) {
  main().catch(console.error);
} 