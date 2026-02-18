import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Force output to Frontend/build to match Render/Netlify expectations
    const outDir = 'Frontend/build';

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      build: {
        outDir: outDir,
        emptyOutDir: true,
        rollupOptions: {
            external: ['mammoth']
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {

          '@': path.resolve(__dirname, '.'),
          'mammoth': 'mammoth/mammoth.browser.js'
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
        globals: true
      }
    };
});
