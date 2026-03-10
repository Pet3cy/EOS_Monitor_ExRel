## 2024-05-24 - Pre-filtering logic for O(N^2) lists
**Learning:** Nested loops where one iterates over dates/weeks and another filters events inside causes `O(Weeks * Events)` complexity.
**Action:** Pre-filter and pre-parse objects outside nested loops into simple variables (e.g. `preFilteredEvents`) to reduce it to `O(Events) + O(Weeks * FilteredEvents)`. Also, avoid `useMemo` for simple evaluations like `Date` instantiations that should be refreshed continuously, like `todayKey`.
