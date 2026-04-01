"""Logging and tracing utilities."""

import json
import time
from typing import Any
from uuid import uuid4


def create_trace_id() -> str:
    """Generate a unique trace ID for request tracking."""
    return f"{int(time.time() * 1000):x}-{uuid4().hex[:6]}"


def serialize_for_log(value: Any, max_length: int = 1200) -> str:
    """Serialize a value for logging with optional truncation."""
    try:
        text = json.dumps(value, separators=(",", ":"))
    except Exception:
        text = str(value)

    if len(text) <= max_length:
        return text

    return f"{text[:max_length]}...(truncated {len(text) - max_length} chars)"
