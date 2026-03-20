"""Convex client wrapper with admin auth for the scraping pipeline."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from convex import ConvexClient
from dotenv import load_dotenv


class PipelineConvexClient:
    """Convex client with admin auth for pipeline operations.

    Loads CONVEX_URL and CONVEX_DEPLOY_KEY from environment or .env.local.
    Uses set_admin_auth for server-side mutations (batch inserts, run lifecycle).
    """

    def __init__(
        self,
        convex_url: str | None = None,
        deploy_key: str | None = None,
    ) -> None:
        """Initialize the Convex client with admin authentication.

        Args:
            convex_url: Convex deployment URL. Falls back to CONVEX_URL env var.
            deploy_key: Convex deploy key. Falls back to CONVEX_DEPLOY_KEY env var.

        Raises:
            ValueError: If CONVEX_URL or CONVEX_DEPLOY_KEY is not set.
        """
        repo_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        env_file = repo_root / ".env.local"
        if env_file.exists():
            load_dotenv(env_file)

        url = convex_url or os.getenv("CONVEX_URL")
        key = deploy_key or os.getenv("CONVEX_DEPLOY_KEY")
        if not url:
            msg = "CONVEX_URL not set"
            raise ValueError(msg)
        if not key:
            msg = "CONVEX_DEPLOY_KEY not set"
            raise ValueError(msg)

        self._client = ConvexClient(url)
        self._client.set_admin_auth(key)

    def mutation(self, name: str, args: dict[str, Any]) -> Any:
        """Call a Convex mutation.

        Args:
            name: Fully qualified mutation name (e.g. 'scraping:batchInsertRawRecords').
            args: Arguments to pass to the mutation.

        Returns:
            The mutation result.
        """
        return self._client.mutation(name, args)

    def query(self, name: str, args: dict[str, Any] | None = None) -> Any:
        """Call a Convex query.

        Args:
            name: Fully qualified query name (e.g. 'dashboard:getRecentRuns').
            args: Arguments to pass to the query.

        Returns:
            The query result.
        """
        return self._client.query(name, args or {})
