# Frontend Backend Contract (Streaming-Ready)

## Current Frontend Adapter
- File: `src/services/chatEngine.js`
- Purpose: local simulation of secured/unsecured processing with token streaming.
- API used by UI state:
  - `streamAssistantReply({ mode, userText, systemPrompt, signal, onToken, onEvent })`

## Target Backend Endpoints
- `POST /api/chats`
- `GET /api/chats`
- `GET /api/chats/:chatId`
- `DELETE /api/chats/:chatId`
- `PATCH /api/chats/:chatId` (rename/title updates)
- `POST /api/chats/:chatId/messages` (streaming)
- `POST /api/chats/:chatId/system-prompt`

## Message Streaming Shape
- Transport options:
  - Server-Sent Events (recommended for simplicity)
  - chunked JSON stream over fetch
- Event model to align with current frontend state:
  - `token`: `{ type: "token", chatId, content }`
  - `status`: `{ type: "status", level, source, message }`
  - `done`: `{ type: "done", chatId }`
  - `error`: `{ type: "error", level, source, message }`

## Request/Response Notes
- Request body for send message:
  - `mode`: `"secured" | "unsecured"`
  - `userText`: string
  - `systemPrompt`: string
- Backend should return status and guardrail metadata events so the utility console can display them.

## Frontend Integration Point
- File: `src/state/uiContext.jsx`
- Method: `sendMessage(chatId, userText)`
- Migration plan:
  - Replace local `streamAssistantReply` internals with real network streaming.
  - Keep method signature unchanged to avoid UI component churn.

## Abort/Stop Behavior
- Frontend uses `AbortController` per chat stream.
- Backend should respect connection abort and terminate stream promptly.

## Security Demo Behavior
- `secured` mode:
  - enforce guardrail policy
  - emit warning/status events for suspicious patterns
- `unsecured` mode:
  - minimal filtering to demonstrate risk

## Testing Gaps (Current)
- No automated test runner is configured yet.
- Recommended next additions:
  - Vitest + React Testing Library for UI behavior tests.
  - Contract tests for stream event parsing.
