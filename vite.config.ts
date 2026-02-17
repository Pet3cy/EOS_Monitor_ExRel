import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    // Force output to Frontend/build to match Render/Netlify expectations
    // Memory says: "Render Dashboard settings ... expects output in Frontend/build"
    // and "Netlify ... publishing Frontend/build"
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
          external: ['mammoth', 'react', 'react-dom', 'lucide-react', '@google/genai'],
          output: {
            paths: {
              mammoth: 'https://esm.sh/mammoth@1.6.0',
              react: 'https://esm.sh/react@^19.2.4',
              'react-dom': 'https://esm.sh/react-dom@^19.2.4',
              'lucide-react': 'https://esm.sh/lucide-react@^0.563.0',
              '@google/genai': 'https://esm.sh/@google/genai@^1.39.0',
            }
          }
        }
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      test: {
        environment: 'jsdom',
        setupFiles: './setupTests.ts',
        globals: true
      }
    };
});
