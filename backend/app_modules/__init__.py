"""Prompt Injection Demo - Flask backend module structure."""

__version__ = "2.0.0"
__description__ = "Modular Flask backend with prompt injection defence mechanisms"

from app_modules.config import get_config
from app_modules.defence import DefenceLayer, InjectionDetector

__all__ = [
    "get_config",
    "DefenceLayer",
    "InjectionDetector",
]
