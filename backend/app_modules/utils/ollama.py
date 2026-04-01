"""Ollama API client utilities."""

from typing import Any, Iterable

import requests


def safe_read_text(response: requests.Response) -> str:
    """Safely read response text without raising exceptions."""
    try:
        return response.text or ""
    except Exception:
        return ""


def model_matches(candidate: Any, configured_model: str) -> bool:
    """Check if a model name matches the configured model (handles tags)."""
    if not isinstance(candidate, str) or not configured_model:
        return False

    if candidate == configured_model:
        return True

    if candidate.startswith(f"{configured_model}:"):
        return True

    if configured_model.startswith(f"{candidate}:"):
        return True

    return candidate.split(":", 1)[0] == configured_model.split(":", 1)[0]


def stream_ollama_response(stream: Iterable[bytes]) -> Iterable[str]:
    """Parse streaming response from Ollama API."""
    decoder = __import__("codecs").getincrementaldecoder("utf-8")(errors="ignore")
    buffer = ""
    
    for chunk in stream:
        buffer += decoder.decode(chunk, final=False)
        lines = buffer.split("\n")
        buffer = lines.pop() or ""
        
        for line in lines:
            line = line.strip()
            if line:
                yield line
    
    # Flush remaining buffer
    final = decoder.decode(b"", final=True)
    if final:
        buffer += final
        if buffer.strip():
            yield buffer.strip()
