## 2024-05-22 - O(N*W) to O(N+W) Calendar Generation
**Learning:** `new Date()` construction inside a hot loop (5000 events * 53 weeks) is extremely expensive. Pre-parsing dates and using a sorted linear scan reduced execution time from ~163ms to ~6.8ms (23x speedup).
**Action:** When mapping temporal data to buckets (weeks/days), sort the data first and use a sliding window instead of nested filters.

## 2024-05-22 - Pre-calculated Calendar Grid
**Learning:** Bucketing events by day for a calendar view inside the render loop (using `filter`) is inefficient (O(N*7) per render). Moving this logic to the data preparation phase (O(N) total) and strictly using local time construction (`new Date(y, m-1, d)`) prevents timezone mismatches and reduces render overhead.
**Action:** Pre-calculate the exact view structure (e.g., `days` array with events) in the data layer/hook, so the view component only maps and renders without logic.
