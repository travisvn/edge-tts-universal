/**
 * Isomorphic utilities that work in both Node.js and browsers using only Web APIs.
 * This module provides browser-compatible implementations without Node.js dependencies.
 */

import { TTSConfig } from './tts_config';
import { ValueError } from "./exceptions";

/**
 * Generates a UUID v4 string without hyphens using Web Crypto API.
 * Works in both Node.js (with globalThis.crypto) and browsers.
 */
export function connectId(): string {
  // Use Web Crypto API available in both Node.js 16+ and all modern browsers
  const array = new Uint8Array(16);
  globalThis.crypto.getRandomValues(array);

  // Set version (4) and variant bits according to RFC 4122
  array[6] = (array[6] & 0x0f) | 0x40;
  array[8] = (array[8] & 0x3f) | 0x80;

  // Convert to hex string and format as UUID, then remove hyphens
  const hex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  const uuid = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;

  return uuid.replace(/-/g, '');
}

/**
 * Web-native XML escaping function.
 */
export function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Unescapes XML entities in text.
 */
export function unescape(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Parses text-based WebSocket messages to extract headers and data.
 * Uses Uint8Array for universal compatibility.
 */
export function getHeadersAndDataFromText(message: Uint8Array): [{ [key: string]: string }, Uint8Array] {
  const messageString = new TextDecoder().decode(message);
  const headerEndIndex = messageString.indexOf('\r\n\r\n');
  
  const headers: { [key: string]: string } = {};
  if (headerEndIndex !== -1) {
    const headerString = messageString.substring(0, headerEndIndex);
    const headerLines = headerString.split('\r\n');
    for (const line of headerLines) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        headers[key] = value.trim();
      }
    }
  }

  const headerByteLength = new TextEncoder().encode(messageString.substring(0, headerEndIndex + 4)).length;
  return [headers, message.slice(headerByteLength)];
}

/**
 * Parses binary WebSocket messages to extract headers and data.
 * Uses Uint8Array for universal compatibility.
 */
export function getHeadersAndDataFromBinary(message: Uint8Array): [{ [key: string]: string }, Uint8Array] {
  if (message.length < 2) {
    throw new Error('Message too short to contain header length');
  }

  const headerLength = (message[0] << 8) | message[1]; // Read big-endian uint16
  const headers: { [key: string]: string } = {};

  if (headerLength > 0 && headerLength + 2 <= message.length) {
    const headerBytes = message.slice(2, headerLength + 2);
    const headerString = new TextDecoder().decode(headerBytes);
    const headerLines = headerString.split('\r\n');
    for (const line of headerLines) {
      const [key, value] = line.split(':', 2);
      if (key && value) {
        headers[key] = value.trim();
      }
    }
  }

  return [headers, message.slice(headerLength + 2)];
}

/**
 * Converts a date to the expected string format for WebSocket messages.
 */
export function dateToString(date?: Date): string {
  if (!date) {
    date = new Date();
  }
  return date.toISOString().replace(/[-:.]/g, '').slice(0, -1);
}

/**
 * Removes characters that are incompatible with SSML.
 */
export function removeIncompatibleCharacters(str: string): string {
  const chars_to_remove = "*.?;:!&/()[]{}$%^@#+=|\\~`><\"";
  let clean_str = str;
  for (const char of chars_to_remove) {
    clean_str = clean_str.replace(new RegExp('\\' + char, 'g'), '');
  }
  return clean_str;
}

/**
 * Creates SSML from TTS configuration and text.
 * Compatible with original mkssml function signature.
 */
export function mkssml(tc: TTSConfig, escapedText: string | Uint8Array): string {
  const text = escapedText instanceof Uint8Array ? new TextDecoder().decode(escapedText) : escapedText;
  return (
    "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>"
    + `<voice name='${tc.voice}'>`
    + `<prosody pitch='${tc.pitch}' rate='${tc.rate}' volume='${tc.volume}'>`
    + `${text}`
    + "</prosody>"
    + "</voice>"
    + "</speak>"
  );
}

/**
 * Splits text by byte length while respecting word boundaries.
 */
export function splitTextByByteLength(text: string, byteLength: number): string[] {
  const encoder = new TextEncoder();
  const words = text.split(/(\s+)/); // Split by whitespace but keep delimiters
  const chunks: string[] = [];
  let currentChunk = "";

  for (const word of words) {
    const potentialChunk = currentChunk + word;
    if (encoder.encode(potentialChunk).length <= byteLength) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = word;
      } else {
        // Single word is longer than byteLength, split it
        const wordBytes = encoder.encode(word);
        for (let i = 0; i < wordBytes.length; i += byteLength) {
          const slice = wordBytes.slice(i, i + byteLength);
          chunks.push(new TextDecoder().decode(slice));
        }
        currentChunk = "";
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Calculates the maximum message size based on configuration.
 */
export function calcMaxMesgSize(voiceConfig: TTSConfig): number {
  // Use a fixed maximum size as configured in recent commits
  return 4096;
}

/**
 * Creates SSML headers plus data for WebSocket communication.
 */
export function ssmlHeadersPlusData(requestId: string, timestamp: string, ssml: string): string {
  return `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${timestamp}Z\r\nPath:ssml\r\n\r\n${ssml}`;
}