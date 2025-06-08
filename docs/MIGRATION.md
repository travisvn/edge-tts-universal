# Migration Guide: @travisvn/edge-tts → edge-tts-universal

This guide helps you migrate from `@travisvn/edge-tts` to `edge-tts-universal`.

## Package Installation

### Before

```bash
npm install @travisvn/edge-tts
```

### After

```bash
npm uninstall @travisvn/edge-tts
npm install edge-tts-universal
```

## Import Changes

### Before

```typescript
import { EdgeTTS, Communicate } from '@travisvn/edge-tts';
```

### After

```typescript
// Default import (Node.js + Universal APIs)
import { EdgeTTS, Communicate } from 'edge-tts-universal';

// Or for browser-only usage
import { EdgeTTS, Communicate } from 'edge-tts-universal/browser';

// Or for maximum universal compatibility
import { EdgeTTS, Communicate } from 'edge-tts-universal/isomorphic';
```

## API Changes

The core API remains the same, but now you have more options:

### Enhanced Universal Support

1. **Isomorphic APIs**: Use `IsomorphicCommunicate` and `IsomorphicVoicesManager` for code that needs to run in both Node.js and browsers.

2. **Browser-Specific APIs**: Use `EdgeTTSBrowser` for browser-only applications that don't need Node.js dependencies.

3. **Entry Point Selection**: Choose the appropriate entry point based on your environment:
   - `edge-tts-universal` - Full API with Node.js dependencies
   - `edge-tts-universal/browser` - Browser-only APIs
   - `edge-tts-universal/isomorphic` - Universal APIs only

### New Features

- Browser-compatible implementations
- Better TypeScript types
- Environment-specific optimizations
- Improved error handling
- Enhanced CORS handling guidance

## Bundle Size Optimization

With the new universal design, you can reduce bundle size by importing only what you need:

```typescript
// Smallest bundle for browsers
import { EdgeTTS } from 'edge-tts-universal/browser';

// Universal APIs only
import { Communicate } from 'edge-tts-universal/isomorphic';

// Full API (Node.js)
import { Communicate, VoicesManager } from 'edge-tts-universal';
```

## No Breaking Changes

All existing code should work without changes when using the default import:

```typescript
// This still works exactly the same
import { EdgeTTS, Communicate, VoicesManager } from 'edge-tts-universal';
```

## Repository Links

- **Old**: `https://github.com/travisvn/edge-tts`
- **New**: `https://github.com/travisvn/edge-tts-universal`
