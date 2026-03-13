import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Strip the CSP <meta> tag during development so Vite's injected inline
 * scripts (React Fast Refresh preamble) are not blocked by the browser.
 * The tag is kept intact in production builds.
 */
function stripCspInDev(mode: string): Plugin {
    return {
      name: 'strip-csp-in-dev',
      transformIndexHtml(html) {
        if (mode !== 'development') return html;
        return html.replace(
          /<meta[^>]*http-equiv="Content-Security-Policy"[^>]*>/i,
          '',
        );
      },
    };
}

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
      plugins: [react(), stripCspInDev(mode)],
      build: {
        outDir: outDir,
        emptyOutDir: true,
        // Explicitly disable the module preload polyfill so that a future Vite
        // upgrade cannot inject an inline script that violates the strict CSP
        // defined in index.html (no 'unsafe-inline' in script-src).
        modulePreload: { polyfill: false },
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
