## 2024-05-22 - O(N*W) to O(N+W) Calendar Generation
**Learning:** `new Date()` construction inside a hot loop (5000 events * 53 weeks) is extremely expensive. Pre-parsing dates and using a sorted linear scan reduced execution time from ~163ms to ~6.8ms (23x speedup).
**Action:** When mapping temporal data to buckets (weeks/days), sort the data first and use a sliding window instead of nested filters.
## 2025-05-23 - WeakMap Caching for Search Optimization
**Learning:** When filtering a large list of objects based on derived properties (e.g., lowercased strings), wrapping objects in a stable wrapper cached via `WeakMap` inside `useMemo` allows for O(1) access to derived properties while preserving referential identity of the list items. This enables `React.memo` to prevent unnecessary re-renders of list items that haven't changed, offering a 60% speedup in filtering (350ms vs 920ms) without sacrificing render performance on updates.
**Action:** Use `useRef(new WeakMap())` to cache derived wrapper objects when needing to optimize filtering while maintaining stable object references for memoized components.
