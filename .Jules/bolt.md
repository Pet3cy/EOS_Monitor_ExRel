## 2024-05-22 - O(N*W) to O(N+W) Calendar Generation
**Learning:** `new Date()` construction inside a hot loop (5000 events * 53 weeks) is extremely expensive. Pre-parsing dates and using a sorted linear scan reduced execution time from ~163ms to ~6.8ms (23x speedup).
**Action:** When mapping temporal data to buckets (weeks/days), sort the data first and use a sliding window instead of nested filters.

## 2024-05-23 - Top-Level View Memoization
**Learning:** `App.tsx` manages global state (`searchTerm`, `isUploadModalOpen`) which triggers re-renders of heavy top-level views (`CalendarView`, `Overview`, `ContactsView`) even if they don't consume that state.
**Action:** Wrap top-level view components in `React.memo` to isolate them from unrelated global state updates, especially when they are expensive to diff/render. Also, conditionally skip expensive `useMemo` calculations (like `filteredEvents`) based on view mode.

## 2024-05-23 - Externalizing Node-Dependent Libraries
**Learning:** The `mammoth` library depends on Node.js built-ins (`path`, `fs`) which causes Vite build warnings and potential runtime failures in browser environments if bundled. Externalizing it via `vite.config.ts` (`rollupOptions.external`) allows the browser to load the browser-compatible ESM version via `importmap`, resolving build warnings and significantly reducing bundle size (~500kB reduction).
**Action:** Always check build logs for "module externalized for browser compatibility" warnings and consider externalizing such libraries if an ESM CDN alternative is available.

## 2024-05-23 - Bundling UMD Libraries in Vite
**Learning:** While externalizing libraries like `mammoth` can save bundle size, relying on external CDNs or import maps can sometimes cause deployment issues if the build/deploy environment (e.g. Netlify) has strict checks or if the CDN resolution fails. A safer alternative for libraries with a specific browser build (e.g. `mammoth.browser.js`) is to alias the import in `vite.config.ts` (`resolve.alias: { 'mammoth': 'mammoth/mammoth.browser.js' }`). This bundles the browser-compatible version directly, ensuring stability and removing Node.js dependency warnings, albeit at the cost of increased bundle size.
**Action:** If externalization causes deployment failures, fallback to aliasing the package to its browser-compatible distribution file.
