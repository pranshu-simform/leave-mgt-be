import { defineConfig } from 'tsdown'

export default defineConfig({
  // The seed is built too, so the Docker image can seed without tsx (a dev tool).
  entry: { server: 'src/server.ts', seed: 'prisma/seed.ts' },
  format: 'esm',
  platform: 'node',
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  fixedExtension: false,
})
