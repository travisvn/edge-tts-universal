# Performance Optimizations for Edge TTS Universal

## Overview

This document outlines the performance optimizations made to improve audio quality and reduce delays in the Edge TTS Universal library.

## Key Issues Addressed

### 1. Hard-coded Delay Removal

**Problem**: A hard-coded delay of 8,750,000 nanoseconds (0.875 seconds) was being added to `offsetCompensation` on every `turn.end` event.

**Solution**: Removed the line `this.state.offsetCompensation += 8_750_000;` from all communicate implementations.

**Impact**: Eliminates the artificial 0.875-second delay between audio segments, providing seamless audio playback.

### 2. Audio Quality Enhancement

**Problem**: Low bitrate audio format (24kHz, 48kbps) was causing audio quality issues and potential smoothness problems.

**Solution**: Upgraded audio output format from `audio-24khz-48kbitrate-mono-mp3` to `audio-48khz-192kbitrate-mono-mp3`.

**Impact**:

- Sample rate increased from 24kHz to 48kHz (2x improvement)
- Bitrate increased from 48kbps to 192kbps (4x improvement)
- Significantly better audio quality and smoothness

### 3. Improved Audio Concatenation

**Problem**: Simple array concatenation could introduce gaps or inconsistencies in audio data.

**Solution**: Enhanced the `concatUint8Arrays` function with:

- Proper empty array handling
- Single array optimization
- Explicit length validation
- Better memory allocation

### 4. Message Processing Optimization

**Problem**: Indefinite waiting in message processing loops could cause delays.

**Solution**: Added timeout mechanism to message processing:

- Added 50ms timeout to prevent indefinite waiting
- More responsive message handling
- Better error recovery

## Configuration Changes

### Audio Format Upgrade

```json
{
  "context": {
    "synthesis": {
      "audio": {
        "metadataoptions": {
          "sentenceBoundaryEnabled": false,
          "wordBoundaryEnabled": true
        },
        "outputFormat": "audio-48khz-192kbitrate-mono-mp3"
      }
    }
  }
}
```

### Timing Compensation

The `offsetCompensation` now only uses actual audio timing data without artificial delays:

```typescript
// Before (with artificial delay)
this.state.offsetCompensation = this.state.lastDurationOffset;
this.state.offsetCompensation += 8_750_000; // Removed this line

// After (natural timing)
this.state.offsetCompensation = this.state.lastDurationOffset;
```

## Performance Benefits

1. **Reduced Latency**: Elimination of 0.875s artificial delay
2. **Better Audio Quality**: 4x bitrate increase and 2x sample rate increase
3. **Smoother Playback**: Improved audio chunk concatenation
4. **More Responsive**: Better message processing with timeout handling
5. **Cross-Platform**: Optimizations applied to all implementations (Browser, Node.js, Isomorphic)

## Files Modified

- `src/browser-communicate.ts`
- `src/communicate.ts`
- `src/isomorphic-communicate.ts`
- `src/browser.ts`
- `src/browser-simple.ts`
- `src/isomorphic-simple.ts`
- `examples/browser-example.html`

## Testing Recommendations

After implementing these changes, test with:

1. **Long text passages** to verify no delays between sentences
2. **Multiple paragraphs** to ensure smooth transitions
3. **Different voice types** to confirm quality improvements
4. **Browser playback** to verify smoothness in web environments
5. **Streaming scenarios** to test real-time performance

## Future Optimization Opportunities

1. **Audio Preloading**: Implement audio chunk preloading for even smoother playback
2. **Adaptive Bitrate**: Dynamic quality adjustment based on network conditions
3. **Audio Compression**: Consider WebM or other formats for better compression
4. **Buffer Management**: Implement smart buffering strategies for large texts
5. **WebAudio API**: Use WebAudio API for advanced audio processing in browsers

## Compatibility Notes

- All changes maintain backward compatibility
- Higher quality audio may require more bandwidth
- Older browsers should still work with the upgraded format
- The timeout mechanism adds resilience without breaking existing functionality
