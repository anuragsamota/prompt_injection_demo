# Prompt Injection Demo Frontend: Stack Overview

Last reviewed: 2026-03-14
Project path: `frontend/prompt_injection_demo_frontend`

## Current stack (from codebase)

- Runtime UI: React `19.2.4`
- Bundler/dev server: Vite `8.0.0`
- Styling: Tailwind CSS `4.2.1`
- UI components: daisyUI `5.5.19`
- Routing library: react-router `7.13.1`
- Linting: ESLint `9.39.4` with flat config
- React compiler path: `@vitejs/plugin-react` + `@rolldown/plugin-babel` + `babel-plugin-react-compiler`

## Confirmed project wiring

- Vite plugins in `vite.config.js`:
  - `react()`
  - `tailwindcss()`
  - `babel({ presets: [reactCompilerPreset()] })`
- Global CSS in `src/index.css`:
  - `@import "tailwindcss";`
  - `@plugin "daisyui";`
- App mount in `src/main.jsx` with `StrictMode`
- App shell currently empty in `src/App.jsx`
- Backend folder exists but currently empty

## Why this matters for your demo

- This stack is ideal for a fast interactive security demo UI:
  - React gives clear stateful views for attack/defense flows.
  - Vite keeps iteration fast for rapidly changing demo screens.
  - Tailwind + daisyUI supports quick component assembly and theme variants.
  - React Router can split the demo into attack scenarios and defense dashboards.

## Planned near-term architecture for the demo UI

- Views
  - Scenario selector (direct, indirect, obfuscated injection)
  - Prompt playground (system prompt, user input, model output)
  - Safety pipeline view (filters, validation, review gates)
  - Event/audit timeline view
- Core states
  - Input payload
  - Sanitized payload
  - model_response_raw
  - model_response_filtered
  - risk score + blocked/allowed status
- Accessibility/security UX
  - Explicit trust labels: trusted instructions vs untrusted content
  - Clear warning badges for suspicious tokens/patterns
  - Explain-why messages when actions are blocked

## Existing docs in repository

- `daisyui_llms_docs.md`: large daisyUI reference already present.
- `docs/resources/*`: curated project-specific docs (this folder).
