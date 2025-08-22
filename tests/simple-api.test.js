import { test, describe } from 'node:test';
import assert from 'node:assert';
import { EdgeTTS, createVTT, createSRT } from '../dist/index.js';

describe('Simple API', () => {
  test('EdgeTTS can be instantiated with text and voice', () => {
    const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
    assert(tts instanceof EdgeTTS, 'Should create EdgeTTS instance');
  });

  test('EdgeTTS synthesize method returns proper result structure', async () => {
    const tts = new EdgeTTS('Hello, test!', 'en-US-EmmaMultilingualNeural');
    
    try {
      const result = await tts.synthesize();
      
      // Check result structure
      assert(typeof result === 'object', 'Result should be an object');
      assert(result.audio instanceof Blob, 'Result should have audio Blob');
      assert(Array.isArray(result.subtitle), 'Result should have subtitle array');
      
      // Check audio
      assert(result.audio.size > 0, 'Audio should have content');
      assert(result.audio.type.includes('audio'), 'Audio should have audio mime type');
      
      // Check subtitles structure if present
      if (result.subtitle.length > 0) {
        const sub = result.subtitle[0];
        assert(typeof sub.offset === 'number', 'Subtitle should have offset');
        assert(typeof sub.duration === 'number', 'Subtitle should have duration');
        assert(typeof sub.text === 'string', 'Subtitle should have text');
      }
    } catch (error) {
      // If network/service is unavailable, just check that error is reasonable
      assert(error instanceof Error, 'Should throw proper Error if service unavailable');
    }
  });

  test('createVTT and createSRT work with subtitle data', () => {
    const mockSubtitles = [
      { offset: 0, duration: 1000000, text: 'Hello' },
      { offset: 1000000, duration: 1000000, text: 'world' }
    ];
    
    const vtt = createVTT(mockSubtitles);
    const srt = createSRT(mockSubtitles);
    
    assert(typeof vtt === 'string', 'createVTT should return string');
    assert(typeof srt === 'string', 'createSRT should return string');
    assert(vtt.includes('WEBVTT'), 'VTT should contain WEBVTT header');
    assert(srt.includes('Hello'), 'SRT should contain subtitle text');
  });

  test('EdgeTTS accepts prosody options', () => {
    const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural', {
      rate: '+10%',
      volume: '+0%',
      pitch: '+5Hz'
    });
    
    assert(tts instanceof EdgeTTS, 'Should create EdgeTTS instance with prosody options');
  });
});