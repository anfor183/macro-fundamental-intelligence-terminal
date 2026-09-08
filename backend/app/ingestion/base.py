"""Abstract Base Ingestor with circuit breaking, rate limits, and error handling."""

import asyncio
import logging
import time
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


class BaseIngestor(ABC):
    """Abstract base class for all macro data ingestion adapters."""

    def __init__(self, name: str, timeout_seconds: float = 10.0, max_retries: int = 3):
        self.name = name
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries
        self.failure_count = 0
        self.circuit_open_until: Optional[float] = None
        self.last_fetch_time: Optional[datetime] = None

    def is_circuit_open(self) -> bool:
        """Check if circuit breaker is currently preventing requests due to repeated failures."""
        if self.circuit_open_until is not None:
            if time.time() < self.circuit_open_until:
                return True
            # Circuit reset
            self.circuit_open_until = None
            self.failure_count = 0
            logger.info(f"[{self.name}] Circuit breaker reset to closed state.")
        return False

    def record_failure(self, error: Exception):
        """Record a failure and trip circuit breaker if threshold is exceeded."""
        self.failure_count += 1
        logger.warning(f"[{self.name}] Ingestion failure #{self.failure_count}: {error}")
        if self.failure_count >= 5:
            cooldown = 180.0 # 3 minutes cooldown
            self.circuit_open_until = time.time() + cooldown
            logger.error(f"[{self.name}] Circuit breaker TRIPPED. Cooling down for {cooldown}s.")

    def record_success(self):
        """Record successful ingestion and reset failure counters."""
        self.failure_count = 0
        self.circuit_open_until = None
        self.last_fetch_time = datetime.now(timezone.utc)

    @abstractmethod
    async def fetch_latest(self) -> List[Dict[str, Any]]:
        """Fetch and return normalized items."""
        pass
