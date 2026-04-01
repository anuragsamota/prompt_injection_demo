"""Health check endpoint."""

from flask import Response, jsonify

from app_modules.config import OLLAMA_BASE_URL, OLLAMA_MODEL


def register_health_routes(app):
    """Register health check routes."""

    @app.route("/health", methods=["GET"])
    def health() -> Response:
        """Check backend and Ollama connectivity."""
        return jsonify(
            ok=True,
            service="flask-ollama-chat-proxy",
            framework="flask",
            model=OLLAMA_MODEL,
            ollamaBaseUrl=OLLAMA_BASE_URL,
        )

    return app
