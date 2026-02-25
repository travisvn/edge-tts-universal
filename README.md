# Edge TTS Universal 🪐

[![API Documentation](https://img.shields.io/badge/API-Documentation-blue)](./API.md)
[![npm](https://img.shields.io/npm/v/edge-tts-universal)](https://www.npmjs.com/package/edge-tts-universal)
[![JSR](https://jsr.io/badges/@edge-tts/universal)](https://jsr.io/@edge-tts/universal)
[![Downloads](https://img.shields.io/npm/dm/edge-tts-universal)](https://www.npmjs.com/package/edge-tts-universal)
[![Tree Shaking](https://img.shields.io/badge/tree%20shaking-✓-green)](#bundle-optimization)
[![JSR Score](https://jsr.io/badges/@edge-tts/universal/score)](https://jsr.io/@edge-tts/universal)

This is a **universal** TypeScript conversion of the Python [`edge-tts`](https://github.com/rany2/edge-tts) library. It allows you to use Microsoft Edge's online text-to-speech service from **Node.js, Deno, Bun, and any server-side JavaScript environment**.

> **Important: Browser Limitation (v1.4.0+)**
>
> Microsoft's TTS service now requires a custom WebSocket header (`Sec-WebSocket-Version`) that browsers do not allow setting via the WebSocket API. As a result, **direct browser usage is limited to the Microsoft Edge browser only**, which permits the connection to its own service. Other browsers (Chrome, Firefox, Safari) will fail to connect. There are no known workarounds at this time.
>
> **Server-side environments (Node.js, Deno, Bun) are unaffected** and continue to work perfectly, as they have full control over WebSocket headers.

## 🌟 Universal Features

- **🚀 Multiple Entry Points**: Node.js, browser, and Universal (cross-platform) APIs
- **🌐 True Universal**: Works identically in Node.js, browsers, Deno, Bun, and edge runtimes
- **📦 Tree-Shakable**: Import only what you need for optimal bundle size
- **🔄 Universal & Isomorphic**: Same API works across all environments using Web standards
- **⚡ Zero Dependencies**: Universal builds use only native Web APIs
- **🛡️ Type Safe**: Full TypeScript support with comprehensive type definitions

This package provides high fidelity to the original Python implementation, replicating the specific headers and WebSocket communication necessary to interact with Microsoft's service.

## What's New in v1.4.0

- **Updated service compatibility**: Aligned with the latest [rany2/edge-tts](https://github.com/rany2/edge-tts) Python package (v7.2.7+) for reliable connectivity
- **Updated Chromium emulation**: Now emulates Chrome/Edge 143 (was 130)
- **MUID cookie authentication**: All WebSocket connections now include a randomized MUID cookie, matching how the official Edge client authenticates
- **Offset compensation padding**: Multi-chunk synthesis now adds timing padding between segments for accurate subtitle alignment
- **SentenceBoundary support**: Streaming API now surfaces `SentenceBoundary` metadata events alongside `WordBoundary`
- **Deduplicated browser internals**: `EdgeTTSBrowser` now uses shared constants and `BrowserDRM` instead of hardcoded values

## Installation

```bash
npm install edge-tts-universal
# or
yarn add edge-tts-universal
```

## Universal Usage

This package provides multiple entry points for different use cases:

### 🌍 Universal API (Recommended - Works Everywhere)

```typescript
import {
  UniversalEdgeTTS,
  UniversalCommunicate,
  UniversalVoicesManager,
  listVoicesUniversal
} from 'edge-tts-universal';

// Works identically in Node.js, Deno, Bun, and browsers
const tts = new UniversalEdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
const result = await tts.synthesize();
```

### 📦 Node.js Optimized (Full Features)

```typescript
import {
  EdgeTTS,
  Communicate,
  VoicesManager
} from 'edge-tts-universal';

// Node.js with proxy support, full headers, etc.
const tts = new EdgeTTS('Hello, world!');
```

### 🌐 Browser-Only (Minimal Bundle)

```typescript
import { EdgeTTS, Communicate } from 'edge-tts-universal/browser';
```

### 🔄 Legacy Isomorphic (Still Supported)

```typescript
import {
  IsomorphicEdgeTTS,
  IsomorphicCommunicate
} from 'edge-tts-universal';
```

## Runtime Compatibility

| Runtime | Universal API | Node.js API | Browser API | Status |
|---------|---------------|-------------|-------------|---------|
| Node.js 18.17+ | ✅ Full | ✅ Full | ❌ N/A | Perfect |
| Deno | ✅ Full | ❌ N/A | ❌ N/A | Perfect |
| Bun | ✅ Full | ✅ Full | ❌ N/A | Perfect |
| Microsoft Edge | ✅ Full | ❌ N/A | ✅ Full | Works |
| Chrome/Firefox/Safari | ❌ Blocked | ❌ N/A | ❌ Blocked | See note below |

> **Note**: As of v1.4.0, direct browser usage only works in Microsoft Edge. Other browsers cannot set the required custom WebSocket headers. Use a server-side environment for reliable TTS synthesis.

### Key Improvements

- **Universal API**: Uses Web standards (WebSocket, Web Crypto, fetch) for maximum compatibility
- **Smart Headers**: Automatically uses optimal WebSocket headers where supported
- **Zero Dependencies**: Universal builds bundle everything for true portability
- **Backward Compatible**: All existing "Isomorphic" APIs still work

## Quick Start

```typescript
import { UniversalEdgeTTS } from 'edge-tts-universal';

const tts = new UniversalEdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
const result = await tts.synthesize();

// Works in Node.js, Deno, Bun, and browsers!
```

### 👷 Web Worker Import (For background processing)

```typescript
import {
  EdgeTTS,
  Communicate,
  postAudioMessage,
} from 'edge-tts-universal/webworker';
```

### 🌐 CDN Import (No build step required)

```html
<!-- Via unpkg -->
<script type="module">
  import { EdgeTTS } from 'https://unpkg.com/edge-tts-universal/dist/browser.js';
</script>

<!-- Via jsdelivr -->
<script type="module">
  import { EdgeTTS } from 'https://cdn.jsdelivr.net/npm/edge-tts-universal/dist/browser.js';
</script>
```

## Bundle Optimization

Choose the right entry point for optimal bundle size:

| Entry Point                     | Bundle Size\* | Use Case       | Dependencies    |
| ------------------------------- | ------------- | -------------- | --------------- |
| `edge-tts-universal`            | ~46KB         | Node.js apps   | All deps        |
| `edge-tts-universal/browser`    | ~30KB         | Browser apps   | Zero deps       |
| `edge-tts-universal/isomorphic` | ~36KB         | Universal apps | Isomorphic deps |
| `edge-tts-universal/webworker`  | ~36KB         | Web Workers    | Isomorphic deps |

_\* Minified + Gzipped estimates_

## Quick Start

### Simple API (Recommended for most use cases)

```typescript
import { EdgeTTS } from 'edge-tts-universal';
import fs from 'fs/promises';

// Simple one-shot synthesis
const tts = new EdgeTTS('Hello, world!', 'en-US-EmmaMultilingualNeural');
const result = await tts.synthesize();

// Save audio file
const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
await fs.writeFile('output.mp3', audioBuffer);
```

### Advanced Streaming API (For real-time processing)

```typescript
import { Communicate } from 'edge-tts-universal';
import fs from 'fs/promises';

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

### Isomorphic API (Universal - works in Node.js and browsers)

```typescript
import { IsomorphicCommunicate } from 'edge-tts-universal';

// Works in both Node.js and browsers (subject to CORS policy)
const communicate = new IsomorphicCommunicate('Hello, universal world!', {
  voice: 'en-US-EmmaMultilingualNeural',
});

const audioChunks: Buffer[] = [];
for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio' && chunk.data) {
    audioChunks.push(chunk.data);
  }
}

// Environment-specific handling
const isNode = typeof process !== 'undefined' && process.versions?.node;
if (isNode) {
  // Node.js - save to file
  const fs = await import('fs/promises');
  await fs.writeFile('output.mp3', Buffer.concat(audioChunks));
} else {
  // Browser - create audio element
  const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(audioBlob);
  // Use audioUrl with <audio> element
}
```

## Usage Examples

<details>
<summary><strong>⚡ Simple API Usage (Recommended)</strong></summary>

Here's how to use the simple, promise-based API for quick synthesis:

```typescript
// examples/simple-api.ts
import { EdgeTTS, createVTT, createSRT } from 'edge-tts-universal';
import { promises as fs } from 'fs';
import path from 'path';

const TEXT = 'Hello, world! This is a test of the simple edge-tts API.';
const VOICE = 'en-US-EmmaMultilingualNeural';
const OUTPUT_FILE = path.join(__dirname, 'simple-test.mp3');

async function main() {
  // Create TTS instance with prosody options
  const tts = new EdgeTTS(TEXT, VOICE, {
    rate: '+10%',
    volume: '+0%',
    pitch: '+0Hz',
  });

  try {
    // Synthesize speech (one-shot)
    const result = await tts.synthesize();

    // Save audio file
    const audioBuffer = Buffer.from(await result.audio.arrayBuffer());
    await fs.writeFile(OUTPUT_FILE, audioBuffer);

    // Generate subtitle files
    const vttContent = createVTT(result.subtitle);
    const srtContent = createSRT(result.subtitle);

    await fs.writeFile('subtitles.vtt', vttContent);
    await fs.writeFile('subtitles.srt', srtContent);

    console.log(`Audio saved to ${OUTPUT_FILE}`);
    console.log(`Generated ${result.subtitle.length} word boundaries`);
  } catch (error) {
    console.error('Synthesis failed:', error);
  }
}

main().catch(console.error);
```

</details>

<details>
<summary><strong>📁 Advanced Streaming Usage</strong></summary>

Here is an example using the advanced streaming API for real-time processing:

```typescript
// examples/streaming.ts
import { Communicate } from 'edge-tts-universal';
import { promises as fs } from 'fs';
import path from 'path';

const TEXT =
  'Hello, world! This is a test of the new edge-tts Node.js library.';
const VOICE = 'en-US-EmmaMultilingualNeural';
const OUTPUT_FILE = path.join(__dirname, 'test.mp3');

async function main() {
  const communicate = new Communicate(TEXT, { voice: VOICE });

  const buffers: Buffer[] = [];
  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      buffers.push(chunk.data);
    }
  }

  const finalBuffer = Buffer.concat(buffers);
  await fs.writeFile(OUTPUT_FILE, finalBuffer);

  console.log(`Audio saved to ${OUTPUT_FILE}`);
}

main().catch(console.error);
```

</details>

<details>
<summary><strong>🎤 Listing and Finding Voices</strong></summary>

You can list all available voices and filter them by criteria.

```typescript
// examples/listVoices.ts
import { VoicesManager } from 'edge-tts-universal';

async function main() {
  const voicesManager = await VoicesManager.create();

  // Find all English voices
  const voices = voicesManager.find({ Language: 'en' });
  console.log(
    'English voices:',
    voices.map((v) => v.ShortName)
  );

  // Find female US voices
  const femaleUsVoices = voicesManager.find({
    Gender: 'Female',
    Locale: 'en-US',
  });
  console.log(
    'Female US voices:',
    femaleUsVoices.map((v) => v.ShortName)
  );
}

main().catch(console.error);
```

</details>

<details>
<summary><strong>📺 Streaming with Subtitles (WordBoundary events)</strong></summary>

The `stream()` method provides `WordBoundary` events for generating subtitles.

```typescript
// examples/streaming.ts
import { Communicate, SubMaker } from 'edge-tts-universal';

const TEXT = 'This is a test of the streaming functionality, with subtitles.';
const VOICE = 'en-GB-SoniaNeural';

async function main() {
  const communicate = new Communicate(TEXT, { voice: VOICE });
  const subMaker = new SubMaker();

  for await (const chunk of communicate.stream()) {
    if (chunk.type === 'audio' && chunk.data) {
      // Do something with the audio data, e.g., stream it to a client.
      console.log(`Received audio chunk of size: ${chunk.data.length}`);
    } else if (chunk.type === 'WordBoundary') {
      subMaker.feed(chunk);
    }
  }

  // Get the subtitles in SRT format.
  const srt = subMaker.getSrt();
  console.log('\nGenerated Subtitles (SRT):\n', srt);
}

main().catch(console.error);
```

</details>

## API Reference

📖 **[Complete API Documentation →](./API.md)**

The main exports of the package are:

**Simple API:**

- **`EdgeTTS`** - Simple, promise-based TTS class for one-shot synthesis
- **`createVTT`** / **`createSRT`** - Utility functions for subtitle generation

**Advanced API:**

- **`Communicate`** - Advanced streaming TTS class for real-time processing
- **`VoicesManager`** - A class to find and filter voices
- **`listVoices`** - A function to get all available voices
- **`SubMaker`** - A utility to generate SRT subtitles from `WordBoundary` events

**Universal API (Preferred):**

- **`UniversalEdgeTTS`** - Cross-platform simple TTS using Web standards
- **`UniversalCommunicate`** - Universal streaming TTS for all JavaScript runtimes  
- **`UniversalVoicesManager`** - Cross-platform voice management
- **`listVoicesUniversal`** - Universal voice listing with Web APIs
- **`UniversalDRM`** - Cross-platform security using Web Crypto API

**Isomorphic API (Legacy, Still Supported):**

- **`IsomorphicCommunicate`** - Universal TTS class that works in Node.js and browsers
- **`IsomorphicVoicesManager`** - Universal voice management with environment detection  
- **`listVoicesIsomorphic`** - Universal voice listing using cross-fetch
- **`IsomorphicDRM`** - Cross-platform security token generation

**Common:**

- **Exception classes** - `NoAudioReceived`, `WebSocketError`, etc.
- **TypeScript types** - Complete type definitions for voices, options, and stream chunks

All APIs use the same robust infrastructure including **DRM security handling**, error recovery, and Microsoft Edge authentication features. 

**Universal APIs** (preferred) use native Web standards for maximum compatibility, while **Isomorphic APIs** (legacy) provide backward compatibility. **Node.js APIs** offer full features including proxy support and custom headers.

For detailed documentation, examples, and advanced usage patterns, see the [comprehensive API guide](./API.md).
