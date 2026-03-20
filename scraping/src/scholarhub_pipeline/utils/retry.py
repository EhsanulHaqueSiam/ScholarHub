"""Exponential backoff retry logic for HTTP requests.

Handles 429 (rate limited) and 5xx server errors with configurable
retry count, base delay, and max delay. Includes jitter to prevent
thundering herd.
"""

from __future__ import annotations

import asyncio
import random
from typing import Any, Callable, TypeVar

import structlog

logger = structlog.get_logger()

T = TypeVar("T")

RETRYABLE_STATUS_CODES: set[int] = {429, 500, 502, 503, 504}


async def retry_with_backoff(
    func: Callable[[], Any],
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    retryable_exceptions: tuple[type[BaseException], ...] = (Exception,),
) -> Any:
    """Retry an async function with exponential backoff and jitter.

    Delays increase exponentially: base_delay * 2^attempt, capped at max_delay.
    Jitter of +/- 25% is applied to prevent synchronized retries.

    Args:
        func: Async callable to retry.
        max_retries: Maximum number of retry attempts (default 3).
        base_delay: Initial delay in seconds (default 1.0).
        max_delay: Maximum delay in seconds (default 30.0).
        retryable_exceptions: Tuple of exception types that trigger a retry.

    Returns:
        The return value of func on success.

    Raises:
        Exception: The last exception if all retries are exhausted.
    """
    for attempt in range(max_retries + 1):
        try:
            return await func()
        except retryable_exceptions as e:
            if attempt == max_retries:
                raise
            delay = min(base_delay * (2**attempt), max_delay)
            # Add jitter: +/- 25%
            delay = delay * (0.75 + random.random() * 0.5)  # noqa: S311
            logger.warning(
                "retry_attempt",
                attempt=attempt + 1,
                delay=round(delay, 2),
                error=str(e),
            )
            await asyncio.sleep(delay)

    # Should not reach here, but satisfy type checker
    msg = "Retry logic error: exhausted retries without raising"
    raise RuntimeError(msg)
