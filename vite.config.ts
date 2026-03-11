import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      build: {
        outDir: 'Frontend/build',
        emptyOutDir: true,
      },
      // WARNING: These keys are embedded in the client-side JS bundle at build time.
      // Any user can extract them from browser dev tools. For production, proxy
      // Gemini API calls through the backend server to protect the key.
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'mammoth': 'mammoth/mammoth.browser.js' // Explicit alias for mammoth to avoid Node dependency issues
        }
      },
      build: {
        outDir: 'Frontend/build' // Explicitly set output directory to match Render expectations
      }
    };
});
