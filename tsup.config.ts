import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  target: 'es2020',
  outDir: 'dist',
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
}) 