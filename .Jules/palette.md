## 2025-02-23 - Nested Interactive Cards
**Learning:** Applying `role="button"` to a card container that also includes a delete `<button>` creates invalid ARIA nesting (interactive within interactive) which confuses screen readers.
**Action:** When making a complex card clickable but with secondary actions, avoid `role="button"` on the container. Instead, use `tabIndex="0"` with key handlers, or use `role="article"` if appropriate, or use the "stretched link" pattern to separate the main click target from secondary actions.
