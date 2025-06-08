# Edge TTS Universal - Features

## 🌟 Universal Compatibility

### Supported Environments

- ✅ **Node.js** (v16+) - Full-featured implementation
- ✅ **Browsers** - Modern browsers with ES2020 support
- ✅ **Web Workers** - Background processing support
- ✅ **Deno** - First-class Deno support
- ✅ **Bun** - Works with Bun runtime
- ✅ **Edge Runtimes** - Cloudflare Workers, Vercel Edge, etc.
- ✅ **React Native** - Compatible with RN's JS engine
- ✅ **Electron** - Works in both main and renderer processes

### Entry Points

| Entry Point                     | Size  | Environment | Features                         |
| ------------------------------- | ----- | ----------- | -------------------------------- |
| `edge-tts-universal`            | ~46KB | Node.js     | Full API + Node.js optimizations |
| `edge-tts-universal/browser`    | ~30KB | Browser     | Browser-only, zero Node.js deps  |
| `edge-tts-universal/isomorphic` | ~36KB | Universal   | Works everywhere                 |
| `edge-tts-universal/webworker`  | ~36KB | Web Workers | Background processing            |

## 🚀 API Styles

### 1. Simple API (Promise-based)

```typescript
import { EdgeTTS } from 'edge-tts-universal';

const tts = new EdgeTTS('Hello world', 'en-US-EmmaMultilingualNeural');
const result = await tts.synthesize();
// Returns: { audio: Blob, subtitle: WordBoundary[] }
```

**Best for:**

- Quick synthesis tasks
- One-shot audio generation
- Simple applications
- Getting started quickly

### 2. Streaming API (Real-time)

```typescript
import { Communicate } from 'edge-tts-universal';

const communicate = new Communicate('Hello world', {
  voice: 'en-US-EmmaMultilingualNeural',
});

for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Process audio chunks in real-time
  } else if (chunk.type === 'WordBoundary') {
    // Handle word timing events
  }
}
```

**Best for:**

- Real-time audio streaming
- Large text processing
- Memory-efficient synthesis
- Live applications

### 3. Isomorphic API (Universal)

```typescript
import { IsomorphicCommunicate } from 'edge-tts-universal';

// Works identically in Node.js and browsers
const communicate = new IsomorphicCommunicate('Hello world');
```

**Best for:**

- Cross-platform libraries
- SSR applications
- Universal modules
- Consistent API across environments

## 🎵 Audio Features

### Supported Audio Formats

- **MP3** - Default format (24kHz, 48kbit/s, mono)
- High-quality audio optimized for speech

### Voice Control

- **170+ Voices** - Multiple languages and regions
- **Neural Voices** - High-quality AI-generated speech
- **Voice Filtering** - Find voices by language, gender, locale
- **Voice Discovery** - List and search available voices

### Prosody Control

- **Rate** - Speaking speed (`+20%`, `-10%`, etc.)
- **Volume** - Audio level (`+50%`, `-25%`, etc.)
- **Pitch** - Voice pitch (`+5Hz`, `-10Hz`, etc.)
- **SSML Support** - Advanced speech markup

## 📝 Subtitle Features

### Word-Level Timing

- **WordBoundary Events** - Precise word timing data
- **100-nanosecond precision** - Extremely accurate timing
- **Real-time Generation** - Timing data as audio streams

### Subtitle Formats

- **VTT (WebVTT)** - Web-compatible subtitle format
- **SRT (SubRip)** - Universal subtitle format
- **Custom Formatting** - Build your own subtitle format

### Subtitle Tools

- **SubMaker** - Generate SRT from word boundaries
- **Cue Merging** - Combine words into phrases
- **Time Formatting** - Automatic time conversion

## 🔧 Advanced Features

### Environment Detection

- **Automatic Detection** - Detects Node.js, browser, Deno, etc.
- **API Selection** - Chooses optimal API for environment
- **Graceful Fallbacks** - Handles missing features gracefully

### Performance Optimizations

- **Tree Shaking** - Import only what you need
- **Code Splitting** - Separate bundles for different environments
- **Lazy Loading** - Dynamic imports for optional features
- **Bundle Analysis** - Size monitoring and optimization

### Developer Experience

- **TypeScript First** - Full type definitions
- **ESLint Config** - Environment-specific linting
- **VS Code Support** - Optimized development settings
- **Documentation** - Comprehensive API docs

### Network Features

- **Proxy Support** - HTTP/HTTPS proxy support (Node.js)
- **Connection Timeout** - Configurable timeout settings
- **Error Recovery** - Automatic retry with token refresh
- **CORS Handling** - Browser CORS considerations

## 🛡️ Security Features

### DRM Token Generation

- **Automatic Tokens** - Generates required security tokens
- **Clock Skew Handling** - Adjusts for time differences
- **Token Refresh** - Automatic token renewal on expiry
- **Cross-platform** - Works in all environments

### Error Handling

- **Typed Exceptions** - Specific error types for different failures
- **Graceful Degradation** - Continues working when possible
- **Detailed Errors** - Helpful error messages and debugging info

## 📦 Distribution Features

### Package Formats

- **ESM** - Modern ES modules
- **CommonJS** - Traditional Node.js compatibility
- **TypeScript** - Native TypeScript support
- **Source Maps** - Debugging support

### CDN Support

- **unpkg** - `https://unpkg.com/edge-tts-universal`
- **jsdelivr** - `https://cdn.jsdelivr.net/npm/edge-tts-universal`
- **Direct Import** - No build step required

### Size Optimization

- **Multiple Bundles** - Choose the right size for your needs
- **Zero Dependencies** - Browser builds have no external deps
- **Size Monitoring** - Automated bundle size tracking
- **Performance Budgets** - Size limits to prevent bloat

## 🔄 Compatibility Features

### Legacy Support

- **ES2020 Target** - Wide browser compatibility
- **Polyfill Ready** - Works with standard polyfills
- **Progressive Enhancement** - Graceful feature detection

### Modern Features

- **Async/Await** - Modern async patterns
- **Generator Functions** - Streaming API support
- **Dynamic Imports** - Lazy loading capabilities
- **Web Standards** - Uses standard Web APIs when available

## 🌐 Platform-Specific Features

### Node.js

- **File System** - Direct file writing
- **Streams** - Node.js stream compatibility
- **Process Environment** - Environment variable support
- **Native Modules** - Can use Node.js-specific modules

### Browser

- **Blob API** - Native browser file handling
- **Audio Element** - Direct `<audio>` element support
- **Download Links** - Generate downloadable files
- **Web APIs** - Uses native browser WebSocket, fetch, etc.

### Web Workers

- **Background Processing** - Non-blocking synthesis
- **Message Passing** - Structured communication
- **Shared Workers** - Multi-tab support possible
- **Service Workers** - Offline synthesis capabilities

### Deno

- **Standard Library** - Uses Deno standard modules
- **Permissions** - Respects Deno security model
- **TypeScript Native** - No compilation step needed
- **Web Standards** - Prefers web-standard APIs

## 🔮 Future Features

### Planned Enhancements

- **Voice Cloning** - Custom voice training
- **Emotion Control** - Emotional speech synthesis
- **Speed Optimization** - Faster synthesis times
- **Offline Mode** - Local voice synthesis
- **Streaming Improvements** - Better real-time performance

### Community Requests

- **More Formats** - Additional audio format support
- **Better Docs** - Interactive documentation
- **More Examples** - Framework-specific examples
- **Testing Suite** - Comprehensive test coverage
