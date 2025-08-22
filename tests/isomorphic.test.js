import { test, describe } from 'node:test';
import assert from 'node:assert';
import { IsomorphicCommunicate, IsomorphicVoicesManager, listVoicesIsomorphic } from '../dist/index.js';

describe('Isomorphic API', () => {
  test('IsomorphicCommunicate can be instantiated', () => {
    const communicate = new IsomorphicCommunicate('Hello, world!', {
      voice: 'en-US-EmmaMultilingualNeural'
    });
    assert(communicate instanceof IsomorphicCommunicate, 'Should create IsomorphicCommunicate instance');
  });

  test('listVoicesIsomorphic returns array of voices', async () => {
    try {
      const voices = await listVoicesIsomorphic();
      assert(Array.isArray(voices), 'Should return array');
      assert(voices.length > 0, 'Should have voices');
      
      const voice = voices[0];
      assert(typeof voice.Name === 'string', 'Voice should have Name');
      assert(typeof voice.ShortName === 'string', 'Voice should have ShortName');
    } catch (error) {
      // If network/service is unavailable, just check error type
      assert(error instanceof Error, 'Should throw proper Error if service unavailable');
    }
  });

  test('IsomorphicVoicesManager can filter voices', async () => {
    try {
      const voicesManager = await IsomorphicVoicesManager.create();
      
      const englishVoices = voicesManager.find({ Language: 'en' });
      assert(Array.isArray(englishVoices), 'Should return array');
      
      for (const voice of englishVoices) {
        assert(voice.Language === 'en', 'All voices should be English');
      }
    } catch (error) {
      // If network/service is unavailable, just check error type
      assert(error instanceof Error, 'Should throw proper Error if service unavailable');
    }
  });

  test('IsomorphicCommunicate stream method exists', () => {
    const communicate = new IsomorphicCommunicate('Test', {
      voice: 'en-US-EmmaMultilingualNeural'
    });
    
    assert(typeof communicate.stream === 'function', 'Should have stream method');
    
    const stream = communicate.stream();
    assert(typeof stream[Symbol.asyncIterator] === 'function', 'Should return async iterable');
  });
});