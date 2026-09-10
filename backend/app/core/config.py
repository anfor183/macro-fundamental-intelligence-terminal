"""Configuration module for Macro Fundamental Intelligence Platform."""

import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Fortune Anukposi Automated Macro Fundamental Intelligence Platform"
    AUTHOR: str = "Fortune Anukposi"
    COPYRIGHT: str = "© 2026 Fortune Anukposi. All rights reserved."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment mode: 'production', 'development', 'demo'
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "false").lower() in ("true", "1", "yes")
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite+aiosqlite:///./backend/data/macro_platform.db"
    )
    
    # Cache / Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_ENABLED: bool = os.getenv("CACHE_ENABLED", "false").lower() in ("true", "1", "yes")
    
    # External API Keys (optional; platform runs with fallback public feeds + local simulation)
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-2.0-flash")
    FINANCIAL_NEWS_API_KEY: str = os.getenv("FINANCIAL_NEWS_API_KEY", "")
    FRED_API_KEY: str = os.getenv("FRED_API_KEY", "")
    
    # Ingestion & Polling
    POLL_INTERVAL_SECONDS: int = int(os.getenv("POLL_INTERVAL_SECONDS", "300"))
    ENABLE_LIVE_POLLING: bool = os.getenv("ENABLE_LIVE_POLLING", "true").lower() in ("true", "1", "yes")
    
    # Timezone & Formatting
    DEFAULT_TIMEZONE: str = "UTC"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
