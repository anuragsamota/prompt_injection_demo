# Routing and Linting Baseline

Last reviewed: 2026-03-14

## React Router v7 baseline

Sources:
- https://reactrouter.com/home
- https://reactrouter.com/start/library/installation

Key points:

- `react-router` is already installed in this project.
- Library/declarative mode is enough for this demo UI.
- Typical setup wraps app with `BrowserRouter`.

Suggested route structure:

- `/` -> overview + scenario cards
- `/playground` -> attack simulation UI
- `/defense` -> sanitization and guardrail visualization
- `/logs` -> timeline and event inspection

Route design guidelines:

- Keep each route task-focused (single responsibility).
- Make suspicious events deep-linkable for demos and debugging.
- Use route params for scenario IDs when you add predefined payload sets.

## ESLint flat config status

Sources:
- https://eslint.org/docs/latest/use/configure/configuration-files
- https://eslint.org/docs/latest/use/getting-started

Current repo already follows flat-config style in `eslint.config.js`.

What is already good:

- Uses `defineConfig` and `globalIgnores`.
- Uses browser globals.
- Uses React hooks and refresh plugin presets.

Recommended additions after UI grows:

- Add file-pattern overrides for tests (when test files exist).
- Keep rules strict around unused variables to avoid stale security logic.
- Consider adding explicit no-dangerous-HTML lint patterns when renderer code is added.

## Practical next lint guardrails for this project

- Keep all prompt parsing logic in a dedicated module and lint it strictly.
- Prefer pure utility functions for detection/sanitization.
- Avoid silent catches in risk-scoring code paths.
