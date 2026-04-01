"""Modular Flask backend - Main application entry point.

Replaces the original monolithic app.py with a cleaned modular structure:
- Configuration centralized in app_modules/config.py
- Utilities isolated in app_modules/utils/
- Routes organized in app_modules/routes/
- Defence layer in app_modules/defence/
"""

import logging
import sys

from flask import Response, jsonify, request

from app_modules.config import get_config
from app_modules.routes.chat import register_chat_routes
from app_modules.routes.connection import register_connection_routes
from app_modules.routes.health import register_health_routes
from app_modules.routes.secure_chat import register_secure_chat_routes


def create_app():
    """Create and configure the Flask application."""
    from flask import Flask

    config = get_config()
    app = Flask(__name__)

    # Configure app settings
    app.config["MAX_CONTENT_LENGTH"] = config["MAX_CONTENT_LENGTH"]
    app.config["JSON_SORT_KEYS"] = False

    # Setup logging
    log_level = logging.DEBUG if config["DEBUG_MODE"] else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    app.logger.setLevel(log_level)

    # Setup CORS manually for better control
    from flask_cors import CORS

    CORS(
        app,
        resources={r"/api/*": {"origins": config["CORS_ORIGIN"], "methods": ["GET", "POST", "OPTIONS"]}},
        supports_credentials=True,
    )

    @app.before_request
    def log_request():
        """Log incoming requests."""
        app.logger.debug(
            "-> %s %s Headers=%s",
            request.method,
            request.path,
            dict(request.headers),
        )

    @app.after_request
    def add_security_headers(response):
        """Add security headers to responses."""
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

    # Register route modules
    register_health_routes(app)
    register_connection_routes(app)
    register_chat_routes(app)
    register_secure_chat_routes(app)

    @app.errorhandler(413)
    def request_entity_too_large(error):
        """Handle request entity too large errors."""
        return (
            jsonify(
                ok=False,
                error="Request payload too large",
                max_size=config["MAX_CONTENT_LENGTH"],
            ),
            413,
        )

    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 errors."""
        return (
            jsonify(
                ok=False,
                error="Endpoint not found",
            ),
            404,
        )

    @app.errorhandler(500)
    def internal_error(error):
        """Handle 500 errors."""
        app.logger.exception("Internal server error", exc_info=error)
        return (
            jsonify(
                ok=False,
                error="Internal server error",
            ),
            500,
        )

    app.logger.info(
        "✓ Flask app initialized: CORS_ORIGIN=%s DEBUG_MODE=%s OLLAMA=%s:%s",
        config["CORS_ORIGIN"],
        config["DEBUG_MODE"],
        config["OLLAMA_BASE_URL"],
        config["OLLAMA_MODEL"],
    )

    return app


if __name__ == "__main__":
    app = create_app()
    config = get_config()

    try:
        app.run(
            host="0.0.0.0",
            port=config["PORT"],
            debug=config["DEBUG_MODE"],
            use_reloader=config["DEBUG_MODE"],
        )
    except KeyboardInterrupt:
        print("\n✓ Shutting down...")
        sys.exit(0)