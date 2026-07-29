# UI Review Checklist

Use this checklist when designing or reviewing a frontend section.

## Visual consistency

- White/light theme only.
- GS1-style colors.
- Clear cards and spacing.
- No dark-mode components.
- Buttons aligned and readable.
- Icons consistent with existing views.
- Avoid visual noise.

## Flow clarity

- The user understands what to do next.
- Empty states are clear.
- Error states are visible.
- Required actions are obvious.
- The screen does not require unnecessary scrolling.
- Back/forward navigation preserves state.

## Functional consistency

- State is not duplicated unnecessarily.
- Shared wizard data remains synchronized.
- Related steps show the same source of truth.
- The same object is not rendered through separate incompatible states.
- Edge cases are handled.

## Safety

- Navbar/sidebar untouched unless requested.
- No vendor/minified files edited.
- No unrelated views changed.
- No new framework added.
- No broad redesign outside the requested scope.
