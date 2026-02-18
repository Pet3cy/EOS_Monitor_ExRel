## 2024-05-22 - O(N*W) to O(N+W) Calendar Generation
**Learning:** `new Date()` construction inside a hot loop (5000 events * 53 weeks) is extremely expensive. Pre-parsing dates and using a sorted linear scan reduced execution time from ~163ms to ~6.8ms (23x speedup).
**Action:** When mapping temporal data to buckets (weeks/days), sort the data first and use a sliding window instead of nested filters.
