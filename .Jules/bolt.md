## 2024-05-22 - O(N*W) to O(N+W) Calendar Generation
**Learning:** `new Date()` construction inside a hot loop (5000 events * 53 weeks) is extremely expensive. Pre-parsing dates and using a sorted linear scan reduced execution time from ~163ms to ~6.8ms (23x speedup).
**Action:** When mapping temporal data to buckets (weeks/days), sort the data first and use a sliding window instead of nested filters.

## 2024-05-22 - Moving Render Logic to Data Prep
**Learning:** `CalendarView` was filtering events for every day cell during every render (`week.events.filter(...)`). By pre-calculating the distribution of events into `days` during the memoized `generateCalendarWeeks` phase, we reduced the per-render cost significantly (~1.7x faster in micro-benchmarks).
**Action:** Move derived state calculations (like bucketing items) out of the render loop and into `useMemo` or data processing functions.
