# React + Vite Baseline (Current and Relevant)

Last reviewed: 2026-03-14

## React essentials to anchor this project

Source: https://react.dev/learn

Focus areas for this demo app:

- Build pages from composable components.
- Keep scenario state local first, then lift shared state when needed.
- Use conditional rendering to show safe/unsafe response variants.
- Use list rendering for attack history and filter results.
- Use predictable event handlers for user actions (simulate, sanitize, submit).

Suggested initial component map:

- `ScenarioTabs`
- `PromptEditor`
- `DefensePanel`
- `ResultPanel`
- `AttackLogTable`

## React Compiler notes (already enabled)

Source: https://react.dev/learn/react-compiler

- React Compiler aims to reduce manual memoization (`useMemo`, `useCallback`, `React.memo`) in many cases.
- Treat it as optimization support, not a replacement for clean state boundaries.
- Keep components pure and avoid mutation-heavy render logic.

For this project:

- Keep data transforms outside JSX when they become complex.
- Prefer explicit derived values before `return` for readability and debugging.

## Vite baseline behavior

Source: https://vite.dev/guide/

- Dev mode: fast HMR and modern browser target assumptions.
- Build mode: production bundling and optimization defaults.
- Standard scripts already present in `package.json`:
  - `dev`
  - `build`
  - `preview`

## Vite config guidance relevant to your setup

Source: https://vite.dev/config/

- `defineConfig` is the recommended entry point.
- Keep environment-dependent behavior explicit if needed via function config.
- Use `loadEnv` if env values must alter config-time behavior.

## Practical baseline rules for this repo

- Keep `App.jsx` thin and compose feature sections.
- Introduce route-level code split only after 2+ major screens exist.
- Add no backend assumptions to UI contracts yet (backend is empty).
