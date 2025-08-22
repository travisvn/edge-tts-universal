# API Naming Examples

This library supports both "Isomorphic" and "Universal" naming conventions for cross-platform APIs. **Universal is the preferred naming**.

## Preferred Universal Naming

```typescript
// ✅ Preferred: Universal naming (clear and descriptive)
import { 
  UniversalEdgeTTS,
  UniversalCommunicate, 
  UniversalVoicesManager,
  listVoicesUniversal 
} from 'edge-tts-universal';

// Simple API
const tts = new UniversalEdgeTTS('Hello world', 'en-US-EmmaMultilingualNeural');
const result = await tts.synthesize();

// Streaming API  
const communicate = new UniversalCommunicate('Hello world');
for await (const chunk of communicate.stream()) {
  if (chunk.type === 'audio') {
    // Handle audio data
  }
}

// Voice management
const voices = await listVoicesUniversal();
const voicesManager = await UniversalVoicesManager.create();
```

## Legacy Isomorphic Naming

```typescript  
// ⚠️ Legacy: Still supported but not recommended for new code
import { 
  IsomorphicEdgeTTS,
  IsomorphicCommunicate,
  IsomorphicVoicesManager, 
  listVoicesIsomorphic
} from 'edge-tts-universal';

// Same functionality, different naming
const tts = new IsomorphicEdgeTTS('Hello world', 'en-US-EmmaMultilingualNeural');
const communicate = new IsomorphicCommunicate('Hello world');
const voices = await listVoicesIsomorphic();
```

## Platform-Specific APIs

For platform-optimized code, you can still use platform-specific exports:

```typescript
// Node.js optimized (with proxy support, etc.)
import { EdgeTTS, Communicate, VoicesManager } from 'edge-tts-universal';

// Browser optimized (smaller bundle size) 
import { EdgeTTSBrowser, BrowserCommunicate } from 'edge-tts-universal/browser';
```

## Migration Guide

If you're currently using Isomorphic naming, you can easily migrate:

```typescript
// Old code
import { IsomorphicCommunicate } from 'edge-tts-universal';

// New code (just change the import)  
import { UniversalCommunicate as Communicate } from 'edge-tts-universal';
// OR
import { UniversalCommunicate } from 'edge-tts-universal';
```

Both naming conventions will continue to work, but new projects should prefer the "Universal" naming for clarity.