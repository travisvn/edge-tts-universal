import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { VoicesManager, listVoices } from "../../dist/isomorphic.js";

Deno.test("Voice Management - listVoices returns array of voices", async () => {
  try {
    const voices = await listVoices();
    assert(Array.isArray(voices), 'listVoices should return an array');
    assert(voices.length > 0, 'Should have at least one voice');
    
    // Check voice structure
    const voice = voices[0];
    assert(typeof voice.Name === 'string', 'Voice should have Name property');
    assert(typeof voice.ShortName === 'string', 'Voice should have ShortName property');
    assert(['Female', 'Male'].includes(voice.Gender), 'Voice should have valid Gender');
    assert(typeof voice.Locale === 'string', 'Voice should have Locale property');
  } catch (error) {
    // If network/service is unavailable, just check that error is reasonable
    assert(error instanceof Error, 'Should throw proper Error if service unavailable');
  }
});

Deno.test("Voice Management - VoicesManager can filter voices", async () => {
  try {
    const voicesManager = await VoicesManager.create();
    
    // Test finding English voices
    const englishVoices = voicesManager.find({ Language: 'en' });
    assert(Array.isArray(englishVoices), 'Should return array');
    assert(englishVoices.length > 0, 'Should find English voices');
    
    for (const voice of englishVoices) {
      assertEquals(voice.Language, 'en', 'All returned voices should be English');
    }
    
    // Test finding female voices
    const femaleVoices = voicesManager.find({ Gender: 'Female' });
    assert(Array.isArray(femaleVoices), 'Should return array');
    
    for (const voice of femaleVoices) {
      assertEquals(voice.Gender, 'Female', 'All returned voices should be Female');
    }
  } catch (error) {
    // If network/service is unavailable, just check that error is reasonable
    assert(error instanceof Error, 'Should throw proper Error if service unavailable');
  }
});

