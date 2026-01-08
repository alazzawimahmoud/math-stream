import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Bundle workspace packages since they export .ts files
  noExternal: [
    '@mathstream/queue',
    '@mathstream/db',
    '@mathstream/shared',
    '@mathstream/cache',
  ],
});
