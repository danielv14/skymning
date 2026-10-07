import { defineConfig } from 'vitest/config'
import viteTsConfigPaths from 'vite-tsconfig-paths'

// Run in UTC like the Cloudflare Worker, so timezone bugs show up in tests
process.env.TZ = 'UTC'

export default defineConfig({
  plugins: [viteTsConfigPaths({ projects: ['./tsconfig.json'] })],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
