"""Payload validation and construction utilities."""

from typing import Any

from app_modules.config import OLLAMA_MODEL


def build_chat_payload(input_data: Any, stream: bool) -> dict[str, Any]:
    """Build and validate a chat payload for Ollama."""
    body = input_data or {}
    if not isinstance(body, dict):
        return {"error": "request body must be a JSON object"}

    messages = body.get("messages")
    model = body.get("model")
    options = body.get("options")
    format_value = body.get("format")
    tools = body.get("tools")
    keep_alive = body.get("keep_alive")
    think = body.get("think")

    if not isinstance(messages, list) or len(messages) == 0:
        return {"error": "messages must be a non-empty array"}

    valid_roles = {"system", "user", "assistant", "tool"}
    for message in messages:
        if not isinstance(message, dict):
            return {"error": "each message must be an object"}

        if not isinstance(message.get("role"), str) or not isinstance(message.get("content"), str):
            return {"error": "each message requires string role and string content"}

        if message["role"] not in valid_roles:
            return {"error": f"invalid message role: {message['role']}"}

    payload: dict[str, Any] = {
        "model": model.strip() if isinstance(model, str) and model.strip() else OLLAMA_MODEL,
        "messages": messages,
        "stream": stream,
    }

    if isinstance(options, dict):
        payload["options"] = options

    if format_value is not None:
        payload["format"] = format_value

    if isinstance(tools, list):
        payload["tools"] = tools

    if keep_alive is not None:
        payload["keep_alive"] = keep_alive

    if isinstance(think, bool):
        payload["think"] = think

    return {"payload": payload}


def build_ollama_headers(stream: bool) -> dict[str, str]:
    """Build headers for Ollama API requests."""
    return {
        "Content-Type": "application/json",
        "Accept": "application/x-ndjson" if stream else "application/json",
    }
