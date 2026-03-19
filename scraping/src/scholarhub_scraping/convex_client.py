"""Convex client wrapper for the scraping pipeline."""

import os
from pathlib import Path

from convex import ConvexClient
from dotenv import load_dotenv


def get_convex_client() -> ConvexClient:
    """Create and return a configured Convex client.

    Reads the CONVEX_URL from environment variables.
    Loads from .env.local at repo root if present.

    Returns:
        ConvexClient: Configured client instance.

    Raises:
        ValueError: If CONVEX_URL is not set.
    """
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    env_file = repo_root / ".env.local"
    if env_file.exists():
        load_dotenv(env_file)

    convex_url = os.getenv("CONVEX_URL")
    if not convex_url:
        msg = "CONVEX_URL environment variable is not set"
        raise ValueError(msg)

    return ConvexClient(convex_url)
