import { defineConfig } from 'tsup'

export default defineConfig([
  // Node.js builds only
  {
    entry: {
      index: 'src/index.ts',
      'runtime-detection': 'src/runtime-detection.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    platform: 'node',
    external: [
      'axios',
      'https-proxy-agent',
      'uuid',
      'ws',
      'xml-escape',
      'isomorphic-ws',
      'cross-fetch',
      'buffer'
    ]
  },
  // Universal/Isomorphic builds - truly universal with all dependencies bundled
  {
    entry: {
      isomorphic: 'src/isomorphic-entry.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: false,
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    platform: 'neutral', // Neither node nor browser - truly universal
    external: [
      // Bundle everything for universal compatibility
    ],
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  },
  // Browser builds (separate config to avoid conflicts)
  {
    entry: {
      browser: 'src/browser-entry.ts',
      webworker: 'src/webworker-entry.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    sourcemap: true,
    clean: false, // Don't clean since previous builds already ran
    splitting: false,
    treeshake: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    platform: 'browser',
    external: [
      // No external dependencies for browser builds - all bundled with browser-native implementations
    ]
  }
]) 