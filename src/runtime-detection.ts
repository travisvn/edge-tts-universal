/**
 * Runtime detection utilities for cross-platform compatibility
 */

export interface RuntimeInfo {
  name: 'node' | 'deno' | 'bun' | 'browser' | 'webworker' | 'unknown';
  version?: string;
  isNode: boolean;
  isDeno: boolean;
  isBun: boolean;
  isBrowser: boolean;
  isWebWorker: boolean;
}

/**
 * Detect the current JavaScript runtime environment
 */
export function detectRuntime(): RuntimeInfo {
  const info: RuntimeInfo = {
    name: 'unknown',
    isNode: false,
    isDeno: false,
    isBun: false,
    isBrowser: false,
    isWebWorker: false,
  };

  // Check for Deno
  if (typeof (globalThis as any).Deno !== 'undefined') {
    info.name = 'deno';
    info.isDeno = true;
    info.version = (globalThis as any).Deno.version?.deno;
    return info;
  }

  // Check for Bun
  if (typeof (globalThis as any).Bun !== 'undefined') {
    info.name = 'bun';
    info.isBun = true;
    info.version = (globalThis as any).Bun.version;
    return info;
  }

  // Check for Node.js
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    info.name = 'node';
    info.isNode = true;
    info.version = process.versions.node;
    return info;
  }

  // Check for Web Worker
  if (typeof (globalThis as any).importScripts === 'function' && typeof (globalThis as any).WorkerGlobalScope !== 'undefined') {
    info.name = 'webworker';
    info.isWebWorker = true;
    return info;
  }

  // Check for Browser
  if (typeof window !== 'undefined') {
    info.name = 'browser';
    info.isBrowser = true;
    return info;
  }

  return info;
}

/**
 * Get the appropriate fetch implementation for the current runtime
 */
export function getFetch(): typeof fetch {
  const runtime = detectRuntime();

  if (runtime.isDeno || runtime.isBrowser || runtime.isWebWorker) {
    return globalThis.fetch;
  }

  if (runtime.isNode || runtime.isBun) {
    try {
      // Try using built-in fetch first (Node 18+, Bun)
      if (typeof globalThis.fetch !== 'undefined') {
        return globalThis.fetch;
      }
      // Fallback to cross-fetch for older Node versions
      return require('cross-fetch');
    } catch {
      throw new Error('No fetch implementation available. Please install cross-fetch.');
    }
  }

  throw new Error('Unsupported runtime environment');
}

/**
 * Get the appropriate WebSocket implementation for the current runtime
 */
export function getWebSocket(): any {
  const runtime = detectRuntime();

  if (runtime.isDeno || runtime.isBrowser || runtime.isWebWorker) {
    return globalThis.WebSocket;
  }

  if (runtime.isNode || runtime.isBun) {
    try {
      return require('isomorphic-ws');
    } catch {
      throw new Error('No WebSocket implementation available. Please install isomorphic-ws.');
    }
  }

  throw new Error('Unsupported runtime environment');
}

/**
 * Get runtime-specific crypto implementation
 * Note: Node.js 16+ (and our minimum version of 18.17+) has native globalThis.crypto support
 */
export function getCrypto(): Crypto {
  const runtime = detectRuntime();

  if (runtime.isDeno || runtime.isBrowser || runtime.isWebWorker) {
    return globalThis.crypto;
  }

  if (runtime.isNode || runtime.isBun) {
    // Node.js 18.17+ and Bun have built-in crypto
    if (typeof globalThis.crypto !== 'undefined') {
      return globalThis.crypto;
    }
    throw new Error('No crypto implementation available. Please upgrade to Node.js 18.17+.');
  }

  throw new Error('Unsupported runtime environment');
} 