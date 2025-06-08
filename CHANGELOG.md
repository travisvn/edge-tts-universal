# Changelog

## v1.0.3 - Universal Migration

### 🚀 Universal Package Migration

- **Breaking Change**: Migrated from `@travisvn/edge-tts` to `edge-tts-universal`
- Updated all repository URLs and package metadata
- Enhanced package description to highlight universal capabilities

### ✨ New Universal Features

#### Multiple Entry Points

- **Main Entry** (`edge-tts-universal`): Full Node.js + Isomorphic APIs
- **Browser Entry** (`edge-tts-universal/browser`): Browser-only APIs with zero Node.js dependencies
- **Isomorphic Entry** (`edge-tts-universal/isomorphic`): Universal APIs that work everywhere

#### Enhanced API Surface

- Added `EdgeTTSBrowser` for pure browser environments
- Added `IsomorphicCommunicate` for universal compatibility
- Added `IsomorphicVoicesManager` for cross-platform voice management
- Added `IsomorphicDRM` for universal security token generation

#### Environment Detection

- Automatic environment detection for optimal API selection
- Graceful fallbacks for different JavaScript environments
- Support for Node.js, browsers, Deno, Bun, and edge runtimes

#### Bundle Optimization

- Tree-shakable exports for optimal bundle size
- Separate browser builds with zero external dependencies
- Isomorphic builds using universal packages (cross-fetch, isomorphic-ws)

### 📦 Package.json Updates

- Updated keywords to highlight universal/isomorphic capabilities
- Enhanced package description for universal nature
- Fixed repository URLs to point to new repository
- Added multiple export paths for different environments

### 🔧 Build System

- Enhanced tsup configuration for multiple entry points
- Fixed top-level await issues for better compatibility
- Improved TypeScript configuration for universal builds
- Generated separate builds for each entry point

### 📚 Documentation

- Created comprehensive migration guide (`MIGRATION.md`)
- Updated README with universal usage patterns
- Added universal environment detection examples
- Enhanced API documentation for universal features

### 🛠️ Technical Improvements

- Dynamic proxy agent loading for better environment compatibility
- Improved error handling for cross-platform scenarios
- Better CORS handling guidance for browser usage
- Enhanced WebSocket compatibility across environments

### 🎯 Developer Experience

- Clear separation of Node.js vs Browser vs Universal APIs
- Better TypeScript types for each environment
- Comprehensive examples for all usage patterns
- Improved environment-specific optimizations

---

## Migration Notes

If you're upgrading from `@travisvn/edge-tts`:

1. **Update package**: `npm uninstall @travisvn/edge-tts && npm install edge-tts-universal`
2. **Update imports**: Change `@travisvn/edge-tts` to `edge-tts-universal`
3. **Optional**: Use specific entry points for better optimization:
   - Browser: `edge-tts-universal/browser`
   - Universal: `edge-tts-universal/isomorphic`

All existing APIs remain compatible with the default import.
