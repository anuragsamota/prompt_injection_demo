"""Server-Sent Events (SSE) utilities."""

import json
from typing import Any


def write_sse(event: str, data: dict[str, Any]) -> str:
    """Format a message as a Server-Sent Event."""
    return f"event: {event}\ndata: {json.dumps(data, separators=(',', ':'))}\n\n"
