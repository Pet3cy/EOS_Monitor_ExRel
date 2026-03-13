import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

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
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss(), stripCspInDev(mode)],
      build: {
        outDir: 'Frontend/build',
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
        }
      }
    };
});
