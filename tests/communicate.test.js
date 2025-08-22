import { test, describe } from 'node:test';
import assert from 'node:assert';
import { Communicate, SubMaker } from '../dist/index.js';

describe('Streaming API', () => {
  test('Communicate can be instantiated', () => {
    const communicate = new Communicate('Hello, world!', {
      voice: 'en-US-EmmaMultilingualNeural'
    });
    assert(communicate instanceof Communicate, 'Should create Communicate instance');
  });

  test('Communicate accepts configuration options', () => {
    const communicate = new Communicate('Test text', {
      voice: 'en-US-EmmaMultilingualNeural',
      rate: '+20%',
      volume: '+10%',
      pitch: '+5Hz',
      connectionTimeout: 5000
    });
    
    assert(communicate instanceof Communicate, 'Should create Communicate instance with options');
  });

  test('SubMaker can process word boundary events', () => {
    const subMaker = new SubMaker();
    
    // Mock word boundary event
    const wordBoundary = {
      type: 'WordBoundary',
      offset: 0,
      duration: 1000000,
      text: 'Hello'
    };
    
    subMaker.feed(wordBoundary);
    const srt = subMaker.getSrt();
    
    assert(typeof srt === 'string', 'SubMaker should return SRT string');
    assert(srt.includes('Hello'), 'SRT should contain the word');
  });

  test('Communicate stream method exists and is async iterable', async () => {
    const communicate = new Communicate('Test', {
      voice: 'en-US-EmmaMultilingualNeural'
    });
    
    // Check that stream method exists
    assert(typeof communicate.stream === 'function', 'Should have stream method');
    
    // Check that it returns an async iterable
    const stream = communicate.stream();
    assert(typeof stream[Symbol.asyncIterator] === 'function', 'Should return async iterable');
  });
});