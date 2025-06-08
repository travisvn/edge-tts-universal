import { EdgeTTS, createVTT, createSRT } from '../src';
import { promises as fs } from 'fs';
import path from 'path';

const TEXT = 'Hello, world! This is a test of the simple edge-tts API.';
const VOICE = 'en-US-EmmaMultilingualNeural';
const OUTPUT_FILE = path.join(__dirname, 'simple-test.mp3');

async function main() {
  // Create TTS instance with prosody options
  const tts = new EdgeTTS(TEXT, VOICE, {
    rate: '+10%',
    volume: '+0%',
    pitch: '+0Hz'
  });

  try {
    // Synthesize speech (one-shot)
    const result = await tts.synthesize();

    // Save audio file
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    await fs.writeFile(OUTPUT_FILE, audioBuffer);

    // Generate subtitle files
    const vttContent = createVTT(result.subtitle);
    const srtContent = createSRT(result.subtitle);

    await fs.writeFile(path.join(__dirname, 'subtitles.vtt'), vttContent);
    await fs.writeFile(path.join(__dirname, 'subtitles.srt'), srtContent);

    console.log(`Audio saved to ${OUTPUT_FILE}`);
    console.log(`Generated ${result.subtitle.length} word boundaries`);
    console.log('VTT preview:', vttContent.substring(0, 200) + '...');
    console.log('SRT preview:', srtContent.substring(0, 200) + '...');
  } catch (error) {
    console.error('Synthesis failed:', error);
  }
}

if (require.main === module) {
  main().catch(console.error);
} 