---
name: gs1-frontend-feature-designer
description: Use this skill when the user asks to design, plan, review, or prepare frontend feature changes for the GS1 interactive wireframes project. It is especially useful for b05 HTML views, vanilla JavaScript controllers, Bootstrap/custom CSS, product flows, wizard steps, image upload flows, tables, modals, responsive behavior, UI polish, and Codex implementation plans. Optimize for targeted context usage, beautiful coherent UI, GS1 visual consistency, minimal diffs, and avoiding unnecessary scans of the whole repository.
---

# GS1 Frontend Feature Designer

Use this skill to help the user design, plan, implement-guidance, or review frontend functionality in the GS1 interactive wireframes project.

The goal is not only to make code work. The goal is to produce frontend changes that are functional, visually coherent, simple to understand, consistent with the existing GS1 look and feel, and safe to execute with Codex.

## Default behavior

When the user asks for frontend changes, first identify the mode:

- `PLAN`: the user wants a Plan Codice before implementation.
- `UI_REDESIGN`: the user wants a section to look better, be simpler, or match the page.
- `IMPLEMENTATION_GUIDE`: the user wants precise implementation instructions but not direct code edits.
- `REVIEW`: the user provides a Codex plan, diff, implementation, screenshot, or bug report and wants critique.

If no mode is specified, default to `PLAN`.

Always write in Spanish unless the user asks otherwise.

## Repository context policy

Before proposing changes:

1. Read `AGENTS.md` first if available.
2. Use `manifests/agent-view-context.json` if available.
3. Inspect only the target view and direct dependencies.
4. Do not scan the whole repository unless the user explicitly asks.
5. Do not use old context files as source of truth unless explicitly requested.

Avoid reading or modifying:

- `assets/js/chart.js`
- minified vendor files
- full navigation manifests unless required
- `b03/` and `b04/` unless explicitly requested
- `memory.md` unless explicitly requested

Default active app folder:

- `b05/`

Historical/reference folders:

- `b03/`
- `b04/`

## Frontend architecture assumptions

The project generally uses:

- HTML views under `b05/`
- vanilla JavaScript controllers under `assets/js/`
- shared CSS under `assets/styles.css`
- Bootstrap/custom CSS
- shared utilities/components such as product tables, shortcuts, account summary, help widget, product catalog, and wizard controllers

Prefer reusing existing components and patterns over creating new isolated implementations.

## UI/UX rules

Always prioritize:

- clean white theme;
- GS1-style visual consistency;
- simple cards;
- clear buttons;
- readable Spanish labels;
- coherent spacing;
- visible active states;
- simple empty states;
- responsive behavior;
- minimal cognitive load;
- accessibility basics.

Never introduce:

- dark mode;
- unrelated visual systems;
- new frameworks;
- broad redesigns outside the requested section;
- navbar/sidebar changes unless explicitly requested;
- unrelated layout changes just to make implementation easier.

## Functional design rule

Never solve a frontend feature only from code.

Before proposing implementation, define:

1. what the user is trying to do;
2. what the screen should show;
3. what state must be shared;
4. what happens when data is empty;
5. what happens when data is invalid;
6. what happens when the user goes back or forward;
7. what must be preserved visually;
8. what files should not be touched.

## Mode: PLAN

Use this when the user wants a Plan Codice before implementation.

Output sections:

1. Modelo recomendado / IA recomendada
2. Objetivo funcional
3. Objetivo UI/UX
4. Archivos a revisar
5. Archivos que no debe tocar
6. Comportamiento actual a verificar
7. Flujo UX propuesto
8. Cambios propuestos por archivo
9. Criterios de aceptación
10. Validaciones manuales
11. Validaciones técnicas
12. Plan Codice listo para copiar

For model recommendation, default to:

- GPT-5.4 con inteligencia media y velocidad normal.

Increase only if the task requires deep architectural refactoring or complex debugging across many files.

## Mode: UI_REDESIGN

Use this when the user says that a section is ugly, confusing, too complex, visually broken, or does not match the page.

Before proposing code, define:

- user goal;
- flow simplification;
- visual hierarchy;
- empty states;
- loading states;
- error states;
- responsive behavior;
- accessibility basics;
- copy/text labels;
- consistency with the existing white GS1 look and feel.

The redesign must remain compatible with the current architecture.

## Mode: IMPLEMENTATION_GUIDE

Use this when the user wants precise implementation instructions but not actual code edits.

Output:

- exact files to modify;
- expected HTML structure;
- expected JS state changes;
- CSS class strategy;
- events and validations;
- edge cases;
- tests.

## Mode: REVIEW

Use this when the user provides a Codex plan, diff, implementation, screenshot, or bug report.

Check:

- whether the requirement was actually met;
- unnecessary files touched;
- broken navigation;
- duplicated logic;
- poor UI/UX;
- inconsistent styling;
- navbar/sidebar accidental changes;
- responsive regressions;
- encoding issues;
- missing validations;
- unclear acceptance criteria;
- hidden regressions in related views.

Be direct. If the implementation is wrong, say exactly why and what to fix.

## Example: product image flow

User request:

In `producto-nuevo.html`, step 0 should allow uploading multiple product images. Those images must automatically appear in step 7. In step 7 the user must choose one image as `Imagen Principal` or `Imagen Frontal`. The image section should be simpler and match the look and feel of the page.

Expected plan:

- Step 0 accepts multiple images.
- Uploaded images are stored in a shared wizard state.
- Step 7 reads from the same state.
- Step 7 displays clean image cards.
- Each card has preview, file name if available, remove action, and primary selector.
- Only one image can be primary.
- If one image exists, mark it as primary by default.
- If multiple images exist and no primary is selected, require selection before finalizing.
- Keep the UI white, simple, and GS1-consistent.
- Do not touch navbar/sidebar.
- Do not scan the whole repository.
- Modify only the target view, direct JS controller, and scoped CSS if needed.

## Codex plan style

When preparing a Codex plan, write it in Spanish and make it directly copyable.

Use this structure:

```text
# Plan Codice - [feature name]

## Modelo recomendado
Usar GPT-5.4 con inteligencia media y velocidad normal.

## Objetivo funcional
...

## Objetivo UI/UX
...

## Archivos a revisar
...

## Archivos que no debe tocar
...

## Comportamiento actual a verificar
...

## Flujo UX propuesto
...

## Cambios por archivo
...

## Criterios de aceptación
...

## Validaciones manuales
...

## Validaciones técnicas
...
```

## Validation checklist

Every plan should include:

Manual validation:

- target flow works;
- back/forward navigation still works;
- UI matches existing look and feel;
- responsive behavior is acceptable;
- no unrelated visual changes;
- edge cases behave clearly.

Technical validation:

- `git diff --check`
- `node --check` on modified JS files
- browser console without errors
- review modified files only
- confirm no accidental changes to navbar/sidebar/vendor files
