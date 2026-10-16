import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'copy-classic-runtime-scripts',
      apply: 'build',
      writeBundle(outputOptions) {
        const outputDir = resolve(__dirname, outputOptions.dir || 'dist');
        for (const file of ['app.js', 'supabaseClient.js', 'pdf_compressor.js', 'data_backup.js']) {
          copyFileSync(resolve(__dirname, file), resolve(outputDir, file));
        }
      },
    },
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
