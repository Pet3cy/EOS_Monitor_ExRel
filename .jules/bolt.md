
## 2025-03-04 - React.memo and String Operation Hoisting
**Learning:** Found that `EventCard` components were re-rendering unnecessarily when the parent `App` state changed (e.g., selecting an event). By using `React.memo` and passing primitive ID-based stable callbacks instead of closure-based functions, we can effectively cut re-renders. Furthermore, hoisting `.toLowerCase()` out of the `.filter` loop inside `useMemo` prevents O(n) redundant string parsing, which is crucial as the list of events grows.
**Action:** Always verify if child components in large mapped lists receive stable callback references and are wrapped in `React.memo`. When doing string comparisons in array iteration, hoist expensive transformations outside the loop if they rely solely on external state variables.
