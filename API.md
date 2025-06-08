# edge-tts API Reference

A comprehensive guide to using the `edge-tts-universal` package for text-to-speech synthesis using Microsoft Edge's online TTS service.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Styles](#api-styles)
  - [Simple API](#simple-api)
  - [Advanced Streaming API](#advanced-streaming-api)
- [Core Classes](#core-classes)
  - [EdgeTTS (Simple API)](#edgetts-simple-api)
  - [Communicate](#communicate)
  - [VoicesManager](#voicesmanager)
  - [SubMaker](#submaker)
- [Functions](#functions)
  - [listVoices](#listvoices)
  - [createVTT](#createvtt)
  - [createSRT](#createsrt)
- [Types](#types)
- [Exceptions](#exceptions)
- [Advanced Usage](#advanced-usage)
- [Examples](#examples)

## Installation

```bash
npm install edge-tts-universal
# or
yarn add edge-tts-universal
```

## Quick Start

```typescript
import { Communicate } from 'edge-tts-universal';
import fs from 'fs/promises';

// Basic text-to-speech
const communicate = new Communicate('Hello, world!', {
  voice: 'en-US-EmmaMultilingualNeural',
});

const buffers: Buffer[] = [];
for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio' && chunk.data) {
    buffers.push(chunk.data);
  }
}

await fs.writeFile('output.mp3', Buffer.concat(buffers));
```

## API Styles

This package provides three API styles to suit different use cases:

### Simple API

**Best for:** One-shot synthesis, simple applications, drop-in replacement scenarios

The Simple API provides a straightforward, promise-based interface similar to other TTS libraries:

```typescript
import { EdgeTTS, createVTT, createSRT } from 'edge-tts-universal';

// Simple one-shot synthesis
const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural', {
  rate: '+10%',
  volume: '+0%',
  pitch: '+0Hz',
});

const result = await tts.synthesize();
console.log('Audio size:', result.audio.size, 'bytes');
console.log('Words:', result.subtitle.length);

// Generate subtitle files
const vttSubtitles = createVTT(result.subtitle);
const srtSubtitles = createSRT(result.subtitle);
```

### Advanced Streaming API

**Best for:** Real-time processing, large texts, fine-grained control, memory efficiency

The Advanced API provides streaming capabilities with real-time chunk processing:

```typescript
import { Communicate, SubMaker } from 'edge-tts-universal';

const communicate = new Communicate('Hello, world!', {
  voice: 'en-US-EmmaMultilingualNeural',
  rate: '+10%',
});

for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Process audio chunks in real-time
    console.log(`Audio chunk: ${chunk.data?.length} bytes`);
  } else if (chunk.type === 'WordBoundary') {
    // Handle word timing events
    console.log(`Word: "${chunk.text}" at ${chunk.offset}ms`);
  }
}
```

### Isomorphic (Universal) API

**Best for:** Cross-platform applications, libraries, universal modules that need to work in both Node.js and browsers

The Isomorphic API provides a universal interface that automatically detects the environment and uses appropriate implementations:

```typescript
import {
  IsomorphicCommunicate,
  IsomorphicVoicesManager,
  listVoicesIsomorphic,
} from 'edge-tts-universal';

// Works in both Node.js and browsers (subject to CORS policy)
const communicate = new IsomorphicCommunicate('Hello, universal world!', {
  voice: 'en-US-EmmaMultilingualNeural',
  rate: '+10%',
});

// Environment detection happens automatically
for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Process audio chunks universally
    console.log(`Audio chunk: ${chunk.data?.length} bytes`);
  } else if (chunk.type === 'WordBoundary') {
    // Handle word timing events
    console.log(`Word: "${chunk.text}" at ${chunk.offset}ms`);
  }
}

// Universal voice management
const voicesManager = await IsomorphicVoicesManager.create();
const englishVoices = voicesManager.find({ Language: 'en' });
```

**Key Features:**

- **Environment Detection**: Automatically uses Node.js crypto vs Web Crypto API
- **Universal WebSocket**: Uses `isomorphic-ws` for consistent WebSocket handling
- **Cross-Platform Fetch**: Uses `cross-fetch` instead of axios for broader compatibility
- **Buffer Polyfill**: Consistent binary data handling across environments
- **Proxy Support**: Works in Node.js, graceful fallback in browsers
- **Same API Surface**: Identical interface regardless of environment

**Note:** All three APIs use the same robust infrastructure including DRM handling, error recovery, proxy support, and security features.

## Core Classes

### EdgeTTS (Simple API)

A simple, promise-based TTS class that provides a familiar API for one-shot synthesis.

#### Constructor

```typescript
new EdgeTTS(
  text: string,
  voice?: string,
  options?: ProsodyOptions
)
```

**Parameters:**

- `text` (string): The text to synthesize
- `voice` (string, optional): Voice to use (default: "Microsoft Server Speech Text to Speech Voice (zh-CN, XiaoxiaoNeural)")
- `options` (ProsodyOptions, optional): Prosody options

#### ProsodyOptions

```typescript
interface ProsodyOptions {
  rate?: string; // Speaking rate (e.g., "+10.00%", "-20.00%")
  volume?: string; // Speaking volume (e.g., "+15.00%", "-10.00%")
  pitch?: string; // Speaking pitch (e.g., "+20Hz", "-10Hz")
}
```

#### Methods

##### synthesize()

```typescript
async synthesize(): Promise<SynthesisResult>
```

Initiates the synthesis process and returns the complete result.

**Returns:** `Promise<SynthesisResult>`

#### SynthesisResult

```typescript
interface SynthesisResult {
  audio: Blob; // Generated audio as a Blob for web use
  subtitle: WordBoundary[]; // Word boundaries for subtitle generation
}
```

#### WordBoundary

```typescript
interface WordBoundary {
  offset: number; // Offset in 100-nanosecond units
  duration: number; // Duration in 100-nanosecond units
  text: string; // The spoken word
}
```

**Example:**

```typescript
import { EdgeTTS, createSRT } from 'edge-tts-universal';

const tts = new EdgeTTS(
  'Hello, this is a test of the simple API.',
  'en-US-EmmaMultilingualNeural',
  { rate: '+20%', pitch: '+5Hz' }
);

try {
  const result = await tts.synthesize();

  // Use the audio (e.g., in a web audio element)
  const audioUrl = URL.createObjectURL(result.audio);

  // Generate subtitles
  const srtContent = createSRT(result.subtitle);
  console.log(srtContent);
} catch (error) {
  console.error('Synthesis failed:', error);
}
```

### Communicate

The main class for text-to-speech synthesis.

#### Constructor

```typescript
new Communicate(text: string, options?: CommunicateOptions)
```

**Parameters:**

- `text` (string): The text to synthesize
- `options` (CommunicateOptions, optional): Configuration options

#### CommunicateOptions

```typescript
interface CommunicateOptions {
  voice?: string; // Voice to use (default: "en-US-EmmaMultilingualNeural")
  rate?: string; // Speech rate (e.g., "+20%", "-10%")
  volume?: string; // Volume level (e.g., "+50%", "-25%")
  pitch?: string; // Pitch adjustment (e.g., "+5Hz", "-10Hz")
  proxy?: string; // Proxy URL for requests
  connectionTimeout?: number; // WebSocket connection timeout in ms
}
```

**Voice Format:**

- Short name: `"en-US-EmmaMultilingualNeural"`
- Full name: `"Microsoft Server Speech Text to Speech Voice (en-US, EmmaMultilingualNeural)"`

**Rate, Volume, Pitch Format:**

- Must include sign: `"+0%"`, `"-10%"`, `"+5Hz"`
- Rate/Volume: percentage with % suffix
- Pitch: frequency with Hz suffix

#### Methods

##### stream()

```typescript
async *stream(): AsyncGenerator<TTSChunk, void, unknown>
```

Returns an async generator that yields audio chunks and word boundary events.

**Returns:** `AsyncGenerator<TTSChunk>`

**Important:** Can only be called once per Communicate instance.

**Example:**

```typescript
const communicate = new Communicate('Hello world');

for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Handle audio data
    console.log(`Audio chunk: ${chunk.data?.length} bytes`);
  } else if (chunk.type === 'WordBoundary') {
    // Handle word timing information
    console.log(`Word: ${chunk.text} at ${chunk.offset}ms`);
  }
}
```

### VoicesManager

Utility class for finding and filtering available voices.

#### Static Methods

##### create()

```typescript
static async create(customVoices?: Voice[], proxy?: string): Promise<VoicesManager>
```

Creates a new VoicesManager instance.

**Parameters:**

- `customVoices` (Voice[], optional): Custom voice list instead of fetching from API
- `proxy` (string, optional): Proxy URL for API requests

**Returns:** `Promise<VoicesManager>`

**Example:**

```typescript
const voicesManager = await VoicesManager.create();
// or with proxy
const voicesManager = await VoicesManager.create(
  undefined,
  'http://proxy:8080'
);
```

#### Instance Methods

##### find()

```typescript
find(filter: VoicesManagerFind): VoicesManagerVoice[]
```

Finds voices matching the specified criteria.

**Parameters:**

- `filter` (VoicesManagerFind): Filter criteria

**Returns:** `VoicesManagerVoice[]`

**VoicesManagerFind:**

```typescript
interface VoicesManagerFind {
  Gender?: 'Female' | 'Male';
  Locale?: string; // e.g., "en-US", "fr-FR"
  Language?: string; // e.g., "en", "fr"
}
```

**Example:**

```typescript
const voicesManager = await VoicesManager.create();

// Find all English voices
const englishVoices = voicesManager.find({ Language: 'en' });

// Find female US voices
const femaleUSVoices = voicesManager.find({
  Gender: 'Female',
  Locale: 'en-US',
});

// Find specific locale
const frenchVoices = voicesManager.find({ Locale: 'fr-FR' });
```

### SubMaker

Utility class for generating SRT subtitles from WordBoundary events.

#### Constructor

```typescript
new SubMaker();
```

#### Methods

##### feed()

```typescript
feed(msg: TTSChunk): void
```

Adds a WordBoundary chunk to the subtitle maker.

**Parameters:**

- `msg` (TTSChunk): Must be a WordBoundary type chunk

**Throws:** `ValueError` if chunk is not a WordBoundary with required fields

##### mergeCues()

```typescript
mergeCues(words: number): void
```

Merges subtitle cues to combine multiple words per subtitle.

**Parameters:**

- `words` (number): Maximum number of words per subtitle cue

**Throws:** `ValueError` if words <= 0

##### getSrt()

```typescript
getSrt(): string
```

Returns the subtitles in SRT format.

**Returns:** `string` - SRT formatted subtitles

##### toString()

```typescript
toString(): string
```

Alias for `getSrt()`.

**Example:**

```typescript
const communicate = new Communicate('Hello world, this is a test.');
const subMaker = new SubMaker();

for await (const chunk of communicate.stream()) {
  if (chunk.type === 'WordBoundary') {
    subMaker.feed(chunk);
  }
}

// Merge every 3 words into one subtitle
subMaker.mergeCues(3);

const srt = subMaker.getSrt();
console.log(srt);
// Output:
// 1
// 00:00:00,000 --> 00:00:01,500
// Hello world, this
//
// 2
// 00:00:01,500 --> 00:00:02,800
// is a test.
```

### IsomorphicCommunicate

Universal version of the Communicate class that works in both Node.js and browsers.

#### Constructor

```typescript
new IsomorphicCommunicate(text: string, options?: IsomorphicCommunicateOptions)
```

**Parameters:**

- `text` (string): The text to synthesize
- `options` (IsomorphicCommunicateOptions, optional): Configuration options

#### IsomorphicCommunicateOptions

```typescript
interface IsomorphicCommunicateOptions {
  voice?: string; // Voice to use (default: "en-US-EmmaMultilingualNeural")
  rate?: string; // Speech rate (e.g., "+20%", "-10%")
  volume?: string; // Volume level (e.g., "+50%", "-25%")
  pitch?: string; // Pitch adjustment (e.g., "+5Hz", "-10Hz")
  proxy?: string; // Proxy URL (Node.js only)
  connectionTimeout?: number; // WebSocket timeout in ms
}
```

#### Methods

##### stream()

```typescript
async *stream(): AsyncGenerator<TTSChunk, void, unknown>
```

Returns an async generator that yields audio chunks and word boundary events. Works identically across Node.js and browsers.

**Example:**

```typescript
const communicate = new IsomorphicCommunicate('Hello world');

for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Universal audio handling
    console.log(`Audio chunk: ${chunk.data?.length} bytes`);
  } else if (chunk.type === 'WordBoundary') {
    // Universal word timing
    console.log(`Word: ${chunk.text} at ${chunk.offset}ns`);
  }
}
```

### IsomorphicVoicesManager

Universal utility class for finding and filtering available voices across environments.

#### Static Methods

##### create()

```typescript
static async create(customVoices?: Voice[], proxy?: string): Promise<IsomorphicVoicesManager>
```

Creates a new IsomorphicVoicesManager instance using cross-platform fetch.

**Parameters:**

- `customVoices` (Voice[], optional): Custom voice list instead of fetching from API
- `proxy` (string, optional): Proxy URL (limited browser support)

**Returns:** `Promise<IsomorphicVoicesManager>`

**Example:**

```typescript
const voicesManager = await IsomorphicVoicesManager.create();
// Works in both Node.js and browsers
```

#### Instance Methods

##### find()

```typescript
find(filter: VoicesManagerFind): VoicesManagerVoice[]
```

Finds voices matching the specified criteria. Same interface as VoicesManager.

**Example:**

```typescript
const voicesManager = await IsomorphicVoicesManager.create();

// Find all English voices (universal)
const englishVoices = voicesManager.find({ Language: 'en' });

// Find female US voices (universal)
const femaleUSVoices = voicesManager.find({
  Gender: 'Female',
  Locale: 'en-US',
});
```

## Functions

### listVoices()

```typescript
async function listVoices(proxy?: string): Promise<Voice[]>;
```

Fetches all available voices from the Microsoft Edge TTS service.

**Parameters:**

- `proxy` (string, optional): Proxy URL for the request

**Returns:** `Promise<Voice[]>`

**Example:**

```typescript
import { listVoices } from 'edge-tts-universal';

const voices = await listVoices();
console.log(`Found ${voices.length} voices`);

// With proxy
const voices = await listVoices('http://proxy:8080');
```

### createVTT()

```typescript
function createVTT(wordBoundaries: WordBoundary[]): string;
```

Creates subtitle file content in VTT (WebVTT) format from word boundary data.

**Parameters:**

- `wordBoundaries` (WordBoundary[]): Array of word boundary data from Simple API

**Returns:** `string` - VTT formatted subtitles

**Example:**

```typescript
import { EdgeTTS, createVTT } from 'edge-tts-universal';

const tts = new EdgeTTS('Hello world');
const result = await tts.synthesize();
const vttContent = createVTT(result.subtitle);

console.log(vttContent);
// Output:
// WEBVTT
//
// 1
// 00:00:00.000 --> 00:00:01.200
// Hello
//
// 2
// 00:00:01.200 --> 00:00:02.000
// world
```

### createSRT()

```typescript
function createSRT(wordBoundaries: WordBoundary[]): string;
```

Creates subtitle file content in SRT (SubRip) format from word boundary data.

**Parameters:**

- `wordBoundaries` (WordBoundary[]): Array of word boundary data from Simple API

**Returns:** `string` - SRT formatted subtitles

**Example:**

```typescript
import { EdgeTTS, createSRT } from 'edge-tts-universal';

const tts = new EdgeTTS('Hello world');
const result = await tts.synthesize();
const srtContent = createSRT(result.subtitle);

console.log(srtContent);
// Output:
// 1
// 00:00:00,000 --> 00:00:01,200
// Hello
//
// 2
// 00:00:01,200 --> 00:00:02,000
// world
```

### listVoicesIsomorphic()

```typescript
async function listVoicesIsomorphic(proxy?: string): Promise<Voice[]>;
```

Universal version of listVoices that works in both Node.js and browsers using cross-fetch.

**Parameters:**

- `proxy` (string, optional): Proxy URL (limited browser support)

**Returns:** `Promise<Voice[]>`

**Example:**

```typescript
import { listVoicesIsomorphic } from 'edge-tts-universal';

// Works in both Node.js and browsers
const voices = await listVoicesIsomorphic();
console.log(`Found ${voices.length} voices`);
```

## Types

### TTSChunk

```typescript
type TTSChunk = {
  type: 'audio' | 'WordBoundary';
  data?: Buffer; // Audio data (only for audio type)
  duration?: number; // Duration in 100-nanosecond units (only for WordBoundary)
  offset?: number; // Offset in 100-nanosecond units (only for WordBoundary)
  text?: string; // Word text (only for WordBoundary)
};
```

### ProsodyOptions (Simple API)

```typescript
interface ProsodyOptions {
  rate?: string; // Speaking rate (e.g., "+10.00%", "-20.00%")
  volume?: string; // Speaking volume (e.g., "+15.00%", "-10.00%")
  pitch?: string; // Speaking pitch (e.g., "+20Hz", "-10Hz")
}
```

### WordBoundary (Simple API)

```typescript
interface WordBoundary {
  offset: number; // Offset in 100-nanosecond units
  duration: number; // Duration in 100-nanosecond units
  text: string; // The spoken word
}
```

### SynthesisResult (Simple API)

```typescript
interface SynthesisResult {
  audio: Blob; // Generated audio as a Blob for web use
  subtitle: WordBoundary[]; // Word boundaries for subtitle generation
}
```

### Voice

```typescript
type Voice = {
  Name: string; // Full voice name
  ShortName: string; // Short voice identifier
  Gender: 'Female' | 'Male';
  Locale: string; // e.g., "en-US"
  SuggestedCodec: 'audio-24khz-48kbitrate-mono-mp3';
  FriendlyName: string; // Human-readable name
  Status: 'GA'; // General availability
  VoiceTag: VoiceTag;
};
```

### VoicesManagerVoice

```typescript
type VoicesManagerVoice = Voice & {
  Language: string; // Extracted from Locale (e.g., "en" from "en-US")
};
```

### VoiceTag

```typescript
type VoiceTag = {
  ContentCategories: (
    | 'Cartoon'
    | 'Conversation'
    | 'Copilot'
    | 'Dialect'
    | 'General'
    | 'News'
    | 'Novel'
    | 'Sports'
  )[];
  VoicePersonalities: (
    | 'Approachable'
    | 'Authentic'
    | 'Authority'
    | 'Bright'
    | 'Caring'
    | 'Casual'
    | 'Cheerful'
    | 'Clear'
    | 'Comfort'
    | 'Confident'
    | 'Considerate'
    | 'Conversational'
    | 'Cute'
    | 'Expressive'
    | 'Friendly'
    | 'Honest'
    | 'Humorous'
    | 'Lively'
    | 'Passion'
    | 'Pleasant'
    | 'Positive'
    | 'Professional'
    | 'Rational'
    | 'Reliable'
    | 'Sincere'
    | 'Sunshine'
    | 'Warm'
  )[];
};
```

## Exceptions

All exceptions extend `EdgeTTSException`:

### EdgeTTSException

Base exception class for all edge-tts errors.

### SkewAdjustmentError

Thrown when there are issues with clock skew adjustment.

### UnknownResponse

Thrown when receiving an unexpected response from the service.

### UnexpectedResponse

Thrown when response format is unexpected.

### NoAudioReceived

Thrown when no audio data is received from the service.

### WebSocketError

Thrown when WebSocket connection issues occur.

### ValueError

Thrown for invalid parameter values.

**Example Error Handling:**

```typescript
import {
  Communicate,
  NoAudioReceived,
  WebSocketError,
} from 'edge-tts-universal';

try {
  const communicate = new Communicate('Hello world');
  for await (const chunk of communicate.stream()) {
    // Process chunks
  }
} catch (error) {
  if (error instanceof NoAudioReceived) {
    console.error('No audio received from service');
  } else if (error instanceof WebSocketError) {
    console.error('WebSocket connection failed:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Advanced Usage

### Using Proxies

```typescript
const communicate = new Communicate('Hello world', {
  proxy: 'http://proxy.example.com:8080',
});

// Also works with HTTPS proxies
const communicate2 = new Communicate('Hello world', {
  proxy: 'https://user:pass@proxy.example.com:3128',
});
```

### Custom Voice Parameters

```typescript
const communicate = new Communicate('Hello world', {
  voice: 'en-US-EmmaMultilingualNeural',
  rate: '+25%', // 25% faster
  volume: '+10%', // 10% louder
  pitch: '+2Hz', // 2Hz higher
});
```

### Connection Timeout

```typescript
const communicate = new Communicate('Hello world', {
  connectionTimeout: 10000, // 10 second timeout
});
```

### Processing Large Text

The library automatically splits large text into chunks:

```typescript
const longText = 'Your very long text here...'.repeat(1000);
const communicate = new Communicate(longText);

for await (const chunk of communicate.stream()) {
  // Chunks are automatically split and processed
}
```

## Examples

### Simple API - Quick Synthesis

```typescript
import { EdgeTTS, createVTT, createSRT } from 'edge-tts-universal';
import fs from 'fs/promises';

async function quickSynthesis() {
  // Simple one-shot synthesis
  const tts = new EdgeTTS(
    'Welcome to the simple edge-tts API!',
    'en-US-EmmaMultilingualNeural',
    { rate: '+15%', volume: '+10%' }
  );

  try {
    const result = await tts.synthesize();

    // Save audio to file
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    await fs.writeFile('simple-output.mp3', audioBuffer);

    // Generate subtitle files
    const vttContent = createVTT(result.subtitle);
    const srtContent = createSRT(result.subtitle);

    await fs.writeFile('subtitles.vtt', vttContent);
    await fs.writeFile('subtitles.srt', srtContent);

    console.log(
      `Generated audio (${result.audio.size} bytes) and ${result.subtitle.length} word boundaries`
    );
  } catch (error) {
    console.error('Synthesis failed:', error);
  }
}
```

### Save to File with Error Handling

```typescript
import { Communicate, NoAudioReceived } from 'edge-tts-universal';
import fs from 'fs/promises';

async function saveToFile(text: string, filename: string) {
  try {
    const communicate = new Communicate(text, {
      voice: 'en-US-EmmaMultilingualNeural',
    });

    const buffers: Buffer[] = [];
    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        buffers.push(chunk.data);
      }
    }

    if (buffers.length === 0) {
      throw new NoAudioReceived('No audio chunks received');
    }

    await fs.writeFile(filename, Buffer.concat(buffers));
    console.log(`Saved ${buffers.length} chunks to ${filename}`);
  } catch (error) {
    console.error('Failed to generate audio:', error);
    throw error;
  }
}
```

### Real-time Streaming with Subtitles

```typescript
import { Communicate, SubMaker } from 'edge-tts-universal';

async function streamWithSubtitles(text: string) {
  const communicate = new Communicate(text);
  const subMaker = new SubMaker();

  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      // Stream audio in real-time (e.g., to speakers or network)
      await streamAudioChunk(chunk.data);
    } else if (chunk.type === 'WordBoundary') {
      subMaker.feed(chunk);

      // Real-time subtitle display
      console.log(`Word: ${chunk.text} at ${chunk.offset! / 10000}ms`);
    }
  }

  // Final subtitles
  subMaker.mergeCues(5);
  return subMaker.getSrt();
}

async function streamAudioChunk(data: Buffer) {
  // Implement your audio streaming logic here
  // e.g., write to audio device, send to client, etc.
}
```

### Voice Discovery and Selection

```typescript
import { VoicesManager } from 'edge-tts-universal';

async function findBestVoice(language: string, gender?: 'Male' | 'Female') {
  const voicesManager = await VoicesManager.create();

  const criteria: any = { Language: language };
  if (gender) criteria.Gender = gender;

  const voices = voicesManager.find(criteria);

  if (voices.length === 0) {
    throw new Error(
      `No voices found for ${language}${gender ? ` (${gender})` : ''}`
    );
  }

  // Prefer neural voices (they typically have "Neural" in the name)
  const neuralVoices = voices.filter((v) => v.ShortName.includes('Neural'));

  return neuralVoices.length > 0 ? neuralVoices[0] : voices[0];
}

// Usage
const voice = await findBestVoice('en', 'Female');
console.log(`Selected voice: ${voice.ShortName}`);
```

### Batch Processing

```typescript
import { Communicate } from 'edge-tts-universal';

async function processMultipleTexts(texts: string[], voice: string) {
  const results: Buffer[] = [];

  for (const text of texts) {
    const communicate = new Communicate(text, { voice });
    const buffers: Buffer[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        buffers.push(chunk.data);
      }
    }

    results.push(Buffer.concat(buffers));
  }

  return results;
}
```

### Isomorphic (Universal) Usage

```typescript
import {
  IsomorphicCommunicate,
  IsomorphicVoicesManager,
  listVoicesIsomorphic,
} from 'edge-tts-universal';

async function universalExample() {
  console.log('🌐 Running universal TTS example...');

  try {
    // Universal voice listing
    const voices = await listVoicesIsomorphic();
    console.log(`✅ Found ${voices.length} voices`);

    // Universal voice management
    const voicesManager = await IsomorphicVoicesManager.create();
    const englishVoices = voicesManager.find({ Language: 'en' });
    console.log(`✅ Found ${englishVoices.length} English voices`);

    // Universal TTS synthesis
    const communicate = new IsomorphicCommunicate(
      'Hello from the universal edge-tts API!',
      {
        voice: 'en-US-EmmaMultilingualNeural',
        rate: '+10%',
      }
    );

    const audioChunks: Buffer[] = [];
    let wordCount = 0;

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        audioChunks.push(chunk.data);
        console.log(`🔊 Audio chunk: ${chunk.data.length} bytes`);
      } else if (chunk.type === 'WordBoundary') {
        wordCount++;
        console.log(`📝 Word ${wordCount}: "${chunk.text}"`);
      }
    }

    // Environment-specific handling
    const isNode = typeof process !== 'undefined' && process.versions?.node;

    if (isNode) {
      // Node.js - save to file
      const fs = await import('fs/promises');
      await fs.writeFile('universal-output.mp3', Buffer.concat(audioChunks));
      console.log('💾 Node.js: Audio saved to file');
    } else {
      // Browser - create audio element
      const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log(`🌐 Browser: Audio Blob created (${audioBlob.size} bytes)`);
    }

    console.log(`✅ Universal synthesis complete!`);
  } catch (error) {
    console.error('❌ Universal TTS Error:', error);
  }
}
```

This API reference provides comprehensive coverage of all available functionality in the `edge-tts-universal` package. For additional examples and use cases, refer to the examples directory in the package repository.
