import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { IsomorphicCommunicate } from "../../src/isomorphic-communicate.ts";

Deno.test("Isomorphic API - IsomorphicCommunicate can be instantiated", () => {
  const communicate = new IsomorphicCommunicate('Hello, world!', {
    voice: 'en-US-EmmaMultilingualNeural'
  });
  assert(communicate instanceof IsomorphicCommunicate, 'Should create IsomorphicCommunicate instance');
});

Deno.test("Isomorphic API - IsomorphicCommunicate stream method exists", () => {
  const communicate = new IsomorphicCommunicate('Test', {
    voice: 'en-US-EmmaMultilingualNeural'
  });
  
  assert(typeof communicate.stream === 'function', 'Should have stream method');
  
  const stream = communicate.stream();
  assert(typeof stream[Symbol.asyncIterator] === 'function', 'Should return async iterable');
});

Deno.test("Isomorphic API - IsomorphicCommunicate accepts configuration options", () => {
  const communicate = new IsomorphicCommunicate('Test text', {
    voice: 'en-US-EmmaMultilingualNeural',
    rate: '+20%',
    volume: '+10%',
    pitch: '+5Hz',
    connectionTimeout: 5000
  });
  
  assert(communicate instanceof IsomorphicCommunicate, 'Should create IsomorphicCommunicate instance with options');
});