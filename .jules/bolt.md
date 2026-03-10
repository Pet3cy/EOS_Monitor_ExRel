## 2026-03-08 - Concurrent Google Calendar Event Fetching
**Learning:** Sequential `await` in loops for independent API requests creates unnecessary latency proportional to the number of requests.
**Action:** Use `Promise.all` with `.map()` to execute independent I/O tasks concurrently, significantly reducing total response time. Ensure individual errors are caught within the `map` callback to maintain robustness.
