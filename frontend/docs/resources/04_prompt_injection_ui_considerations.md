# Prompt Injection UI Considerations (For This Demo)

Last reviewed: 2026-03-14

Primary sources:
- https://owasp.org/www-community/attacks/PromptInjection
- https://cheatsheetseries.owasp.org/cheatsheets/LLM_Prompt_Injection_Prevention_Cheat_Sheet.html
- https://genai.owasp.org/llmrisk/llm01-prompt-injection/

## Core threat model to reflect in UI

Prompt injection succeeds when untrusted input is interpreted as instruction rather than data.
Your UI should make this boundary visible at all times.

Show these channels separately:

- System instructions (trusted)
- User prompt (untrusted)
- External retrieved content (untrusted)
- Tool/action requests (privileged)
- Final output (must be validated before display/action)

## Attack classes to include in demo scenarios

- Direct prompt injection
- Indirect/remote prompt injection (content from docs/web/file)
- Obfuscated injection (encoding, spacing, typo variants)
- Multi-turn persistence attempts
- Prompt extraction attempts

## Defense layers to visualize in UI

- Input screening:
  - Pattern detection
  - Length/encoding checks
  - suspicious marker extraction
- Prompt structuring:
  - Explicit instruction/data separation
- Output validation:
  - leak patterns
  - policy violations
- Action controls:
  - least-privilege gating
  - human approval for high-risk actions

## UX patterns that improve security clarity

- Tag each content block as `trusted` or `untrusted`.
- Add a risk score badge and explain which checks triggered it.
- Show blocked response reasons (not just blocked state).
- Add "show raw" and "show filtered" output diff.
- Log every transformation step with timestamp.

## Safe rendering notes for frontend

- Treat model output as untrusted content.
- Avoid raw HTML rendering of model output unless sanitized.
- Sanitize/escape Markdown or HTML if rich rendering is enabled.
- Clearly separate display-only output from executable actions.

## Demo success criteria (UI phase)

- A user can see how the same malicious payload behaves with and without defenses.
- A user can identify where in the pipeline a payload was caught.
- A user can inspect logs and understand why a response was allowed/blocked.
