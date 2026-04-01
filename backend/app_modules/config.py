"""Configuration management for the Flask Ollama proxy."""

import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Server configuration
PORT = int(os.getenv("PORT", "8080"))
DEBUG_MODE = os.getenv("FLASK_ENV", "production") != "production"

# CORS configuration
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")

# Ollama configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:latest")

# Request limits
MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2MB


def get_config():
    """Return a dictionary of all configuration values."""
    return {
        "PORT": PORT,
        "DEBUG_MODE": DEBUG_MODE,
        "CORS_ORIGIN": CORS_ORIGIN,
        "OLLAMA_BASE_URL": OLLAMA_BASE_URL,
        "OLLAMA_MODEL": OLLAMA_MODEL,
        "MAX_CONTENT_LENGTH": MAX_CONTENT_LENGTH,
    }
