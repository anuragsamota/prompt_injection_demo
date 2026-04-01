"""Connection status endpoint."""

import requests
from flask import Response, jsonify

from app_modules.config import OLLAMA_BASE_URL, OLLAMA_MODEL
from app_modules.utils import model_matches, serialize_for_log
from app_modules.utils.logging import create_trace_id


def register_connection_routes(app):
    """Register connection check routes."""

    @app.route("/api/connection", methods=["GET"])
    def connection() -> Response:
        """Check Ollama connection and model availability."""
        trace_id = create_trace_id()

        try:
            response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
            response.raise_for_status()

            try:
                data = response.json()
            except ValueError as error:
                return jsonify(
                    ok=False,
                    traceId=trace_id,
                    details=f"Ollama returned invalid JSON: {error}",
                    ollama={
                        "connected": True,
                        "modelAvailable": False,
                        "model": OLLAMA_MODEL,
                        "baseUrl": OLLAMA_BASE_URL,
                    },
                ), 502

            models = data.get("models") or []
            model_available = any(
                model_matches(item.get("name"), OLLAMA_MODEL) for item in models if isinstance(item, dict)
            )

            return jsonify(
                ok=True,
                traceId=trace_id,
                details="Ollama connection check completed",
                ollama={
                    "connected": True,
                    "modelAvailable": model_available,
                    "model": OLLAMA_MODEL,
                    "baseUrl": OLLAMA_BASE_URL,
                },
            )
        except requests.RequestException as error:
            return jsonify(
                ok=False,
                traceId=trace_id,
                details=f"Unable to reach Ollama: {error}",
                ollama={
                    "connected": False,
                    "modelAvailable": False,
                    "model": OLLAMA_MODEL,
                    "baseUrl": OLLAMA_BASE_URL,
                },
            ), 502

    return app
