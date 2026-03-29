import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    include: ['test/js/**/*.test.ts'],
    // Native addon with embedded Python: each vitest run gets a fresh process.
    // We run test files via separate vitest invocations (see package.json).
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: ['lib/**/*.ts', 'dist/**/*.js'],
      exclude: ['test/**', 'bench/**', 'scripts/**', 'examples/**'],
    },
  },
  resolve: {
    alias: {
      '../../lib/index': path.resolve(__dirname, 'lib/index.ts'),
    },
  },
})
