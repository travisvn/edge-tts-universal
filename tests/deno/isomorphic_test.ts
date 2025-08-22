import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { Communicate } from "../../dist/isomorphic.js";

Deno.test("Isomorphic API - Communicate can be instantiated", () => {
  const communicate = new Communicate('Hello, world!', {
    voice: 'en-US-EmmaMultilingualNeural'
  });
  assert(communicate instanceof Communicate, 'Should create Communicate instance');
});

Deno.test("Isomorphic API - Communicate stream method exists", () => {
  const communicate = new Communicate('Test', {
    voice: 'en-US-EmmaMultilingualNeural'
  });
  
  assert(typeof communicate.stream === 'function', 'Should have stream method');
  
  const stream = communicate.stream();
  assert(typeof stream[Symbol.asyncIterator] === 'function', 'Should return async iterable');
});

Deno.test("Isomorphic API - Communicate accepts configuration options", () => {
  const communicate = new Communicate('Test text', {
    voice: 'en-US-EmmaMultilingualNeural',
    rate: '+20%',
    volume: '+10%',
    pitch: '+5Hz',
    connectionTimeout: 5000
  });
  
  assert(communicate instanceof Communicate, 'Should create Communicate instance with options');
});