import { test, describe } from 'node:test';
import assert from 'node:assert';
import { VoicesManager, listVoices } from '../dist/index.js';

describe('Voice Management', () => {
  test('listVoices returns array of voices', async () => {
    const voices = await listVoices();
    assert(Array.isArray(voices), 'listVoices should return an array');
    assert(voices.length > 0, 'Should have at least one voice');
    
    // Check voice structure
    const voice = voices[0];
    assert(typeof voice.Name === 'string', 'Voice should have Name property');
    assert(typeof voice.ShortName === 'string', 'Voice should have ShortName property');
    assert(['Female', 'Male'].includes(voice.Gender), 'Voice should have valid Gender');
    assert(typeof voice.Locale === 'string', 'Voice should have Locale property');
  });

  test('VoicesManager can filter voices', async () => {
    const voicesManager = await VoicesManager.create();
    
    // Test finding English voices
    const englishVoices = voicesManager.find({ Language: 'en' });
    assert(Array.isArray(englishVoices), 'Should return array');
    assert(englishVoices.length > 0, 'Should find English voices');
    
    for (const voice of englishVoices) {
      assert(voice.Language === 'en', 'All returned voices should be English');
    }
    
    // Test finding female voices
    const femaleVoices = voicesManager.find({ Gender: 'Female' });
    assert(Array.isArray(femaleVoices), 'Should return array');
    
    for (const voice of femaleVoices) {
      assert(voice.Gender === 'Female', 'All returned voices should be Female');
    }
  });
});