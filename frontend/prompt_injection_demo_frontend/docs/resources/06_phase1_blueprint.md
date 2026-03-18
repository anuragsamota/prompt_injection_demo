# Phase 1 Blueprint: App Shell and Responsive Layout

Last reviewed: 2026-03-15
Status: Planning complete, implementation not started.

## Objective

Build the production-ready frontend shell for a ChatGPT-like cybersecurity demo UI, with clear support for:

- dual mode selection (`Unsecured Demo`, `Secured Demo`)
- chat sidebar with chat history
- system prompt editor panel
- backend console panel (logs/status/messages)
- responsive behavior on desktop and mobile

No backend logic or streaming integration in this phase. Phase 1 is UI structure and app state scaffolding only.

## Scope of Phase 1

In-scope:

- App frame layout (left sidebar + center chat area + right utility panel)
- Core navigation shell and routes
- Static/stub content for all panels
- Basic in-memory UI state wiring for selected mode/chat/panel visibility
- Responsive behavior and panel fallback patterns
- Design system baseline (theme choice, spacing rhythm, typography scale)

Out-of-scope:

- Real API calls
- Real websocket/SSE integration
- Message persistence
- Prompt execution logic
- Security scoring logic

## Route plan for Phase 1

- `/chat/:chatId` primary workspace route (default destination)
- `/samples` sample prompts page shell
- `/samples/:scenarioId` scenario detail shell

Note:

- Keep `/playground`, `/defense`, `/logs` as future labels in IA docs.
- Use chat-first route model for this product iteration.

## Layout architecture

Desktop (>= lg):

- Left panel: fixed-width sidebar
- Center panel: chat workspace (flex-grow)
- Right panel: utility stack (system prompt editor + console)

Tablet/mobile (< lg):

- Left panel becomes drawer
- Right utility panel becomes toggleable drawer/sheet (bottom or side)
- Chat workspace remains primary visible area

## Panel definitions

### 1. Left Sidebar

Sections:

- Top: app title/logo and new chat button
- Mode switch row: `Unsecured Demo` / `Secured Demo`
- Chat list section: past chats with active state
- Navigation section: links to `Sample Prompts` and related pages

UI components (daisyUI-first):

- `drawer`, `menu`, `btn`, `badge`, `divider`, `input` (search optional)

### 2. Center Chat Workspace

Sections:

- Header bar: chat title, mode badge, connection placeholder
- Message viewport: static empty and seeded demo states
- Composer area: textarea + action buttons (stub actions)

UI components:

- `card`, `chat`, `textarea`, `btn`, `status`, `badge`, `alert`

### 3. Right Utility Panel

Sub-panels (tabbed):

- `System Prompt`
- `Console`

System Prompt sub-panel content:

- editable prompt textarea (local state only)
- scope toggle (`this chat`, `global default`) as UI only
- reset and apply buttons (UI only)

Console sub-panel content:

- tabs: `Logs`, `Status`, `Messages`
- filter chips and severity legend
- static sample rows showing timestamp, source, level, message

UI components:

- `tabs`, `fieldset`, `label`, `textarea`, `btn`, `badge`, `list`, `table`, `select`

## State model for Phase 1 (frontend-only)

- `selectedMode`: `unsecured` | `secured`
- `activeChatId`: string
- `sidebarOpen`: boolean (mobile)
- `utilityPanelOpen`: boolean (mobile)
- `utilityTab`: `systemPrompt` | `console`
- `consoleTab`: `logs` | `status` | `messages`
- `draftSystemPrompt`: string

No persisted storage in this phase unless required for UX continuity (optional).

## Visual and interaction design direction

Design goals:

- modern and minimal with high clarity
- strong hierarchy without visual clutter
- responsive by default

Styling rules:

- stay on daisyUI + Tailwind utilities (minimal custom CSS)
- use semantic colors for security context
- maintain clear spacing scale and readable line lengths
- keep animations subtle and meaningful only

Recommended semantic mapping:

- unsecured mode badge: `warning`
- secured mode badge: `success`
- errors/failures: `error`
- status/info: `info`

## Accessibility baseline for Phase 1

- keyboard navigation for panel toggles and menu items
- visible focus states on all interactive controls
- aria labels for icon-only buttons
- clear text alternatives for status indicators
- adequate contrast for all badges and alerts

## Phase 1 deliverables

- responsive shell layout with all three panel zones
- route shells (`/chat/:chatId`, `/samples`, `/samples/:scenarioId`)
- mode dropdown in sidebar
- chat list UI in sidebar
- system prompt editor UI tab in utility panel
- console UI tab in utility panel with stub entries
- message composer and message area shell

## Phase 1 acceptance criteria

1. Desktop shows left, center, and right panels simultaneously.
2. Mobile allows opening sidebar and utility panel without breaking chat area.
3. User can switch between unsecured and secured mode in UI.
4. User can open system prompt tab and edit text locally.
5. User can switch console tabs and view placeholder entries.
6. No layout overflow issues on common screen sizes.
7. No raw HTML rendering pathways introduced in message area.

## Risks and controls

Risk: UI complexity causes brittle responsive layout.
Control: lock layout primitives early (`drawer` + predictable widths + overflow rules).

Risk: state sprawl before backend integration.
Control: keep state minimal and phase-bound; do not add API-derived state yet.

Risk: visual inconsistency across panels.
Control: define shared card/header/section patterns before content expansion.

## Phase 2 preview (not in current scope)

- local chat behavior (new chat, add messages)
- sample prompt injection templates
- initial frontend service layer for backend API contracts
