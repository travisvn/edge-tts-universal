import { test, describe } from 'node:test';
import assert from 'node:assert';
import { 
  NoAudioReceived, 
  UnexpectedResponse, 
  UnknownResponse, 
  WebSocketError 
} from '../dist/index.js';

describe('Types and Exceptions', () => {
  test('Exception classes can be instantiated', () => {
    const noAudio = new NoAudioReceived('No audio received');
    const unexpected = new UnexpectedResponse('Unexpected response');
    const unknown = new UnknownResponse('Unknown response');
    const wsError = new WebSocketError('WebSocket error');
    
    assert(noAudio instanceof Error, 'NoAudioReceived should extend Error');
    assert(unexpected instanceof Error, 'UnexpectedResponse should extend Error');
    assert(unknown instanceof Error, 'UnknownResponse should extend Error');
    assert(wsError instanceof Error, 'WebSocketError should extend Error');
    
    assert(noAudio instanceof NoAudioReceived, 'Should be instance of NoAudioReceived');
    assert(unexpected instanceof UnexpectedResponse, 'Should be instance of UnexpectedResponse');
    assert(unknown instanceof UnknownResponse, 'Should be instance of UnknownResponse');
    assert(wsError instanceof WebSocketError, 'Should be instance of WebSocketError');
  });

  test('Exception classes have proper names', () => {
    const noAudio = new NoAudioReceived('test');
    const unexpected = new UnexpectedResponse('test');
    const unknown = new UnknownResponse('test');
    const wsError = new WebSocketError('test');
    
    assert(noAudio.name === 'NoAudioReceived', 'Should have correct name');
    assert(unexpected.name === 'UnexpectedResponse', 'Should have correct name');
    assert(unknown.name === 'UnknownResponse', 'Should have correct name');
    assert(wsError.name === 'WebSocketError', 'Should have correct name');
  });

  test('Exception classes preserve error messages', () => {
    const message = 'Test error message';
    const error = new NoAudioReceived(message);
    
    assert(error.message === message, 'Should preserve error message');
  });
});