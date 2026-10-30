---
name: Math Stars audio defaults and challenge scope
description: Saved music-volume migration and which game modes use the revised arithmetic ranges.
---

For Math Stars, keep 5% as the default only when no music volume is saved. Preserve existing saved values by default. Older builds used 45% as the default and persisted the full settings object without recording whether the slider was intentionally changed, so a saved 45% value is ambiguous. If existing users should move to 5%, use an explicit reset or opt-in rather than silently migrating that value.

**Why:** Automatically changing a saved 45% value could overwrite an intentional preference.

**How to apply:** Preserve stored values during default changes unless the user explicitly approves a migration or reset.

The revised medium/hard addition and subtraction ranges apply to both Daily award challenges and the 60-second High Score Run. Regular games and Practice Mode keep their existing question generation.

**Why:** The user approved both challenge modes while explicitly preserving the other game modes.

**How to apply:** Keep this rule scoped to the mixed-operation challenge flow; do not alter regular or practice generators.
