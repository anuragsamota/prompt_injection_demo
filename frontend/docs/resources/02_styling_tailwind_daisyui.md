# Styling Baseline: Tailwind v4 + daisyUI v5

Last reviewed: 2026-03-14

## Tailwind v4 with Vite

Sources:
- https://tailwindcss.com/docs/installation/using-vite
- https://tailwindcss.com/docs/functions-and-directives

What matters for this project:

- Vite plugin flow is correct (`@tailwindcss/vite`).
- Tailwind import in CSS is correct:

```css
@import "tailwindcss";
```

- Tailwind v4 introduces CSS-first directives (`@theme`, `@utility`, `@variant`, etc.) that can be added only when needed.

## daisyUI v5 integration

Sources:
- https://daisyui.com/docs/install/
- https://daisyui.com/docs/v5/

Current setup is already valid for v5:

```css
@import "tailwindcss";
@plugin "daisyui";
```

Important v5 reminders:

- Tailwind v4 compatibility is first-class.
- CSS-file plugin config replaces old `tailwind.config.js`-centric patterns.
- Component modifiers are broadly responsive-friendly.

## Recommended theming strategy for this demo

- Start with one stable theme to avoid noisy visual changes while building functionality.
- Use semantic tokens from daisyUI (`primary`, `warning`, `error`, `success`) for security states.
- Reserve custom theme work until core UX is proven.

Security state color mapping suggestion:

- Normal/info: `info`
- Suspected injection: `warning`
- Blocked/high risk: `error`
- Sanitized/approved: `success`

## Component shortlist for first UI iteration

- Layout: `card`, `divider`, `tabs`, `drawer` (if needed)
- Input: `textarea`, `input`, `select`, `fieldset`, `label`
- State cues: `badge`, `alert`, `loading`
- Actions: `btn` variants (`btn-primary`, `btn-warning`, `btn-error`)

## Caution points

- Avoid overusing custom CSS until utility/classes fail you.
- Keep contrast high for warning/error views.
- Ensure mobile behavior for split panels and long prompts.
