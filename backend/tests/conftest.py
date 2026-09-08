"""Pytest configuration and test database isolation.

Ensures all test suites run strictly against an isolated test database
('backend/data/test_macro_platform.db') and NEVER contaminate the production
or live terminal database ('backend/data/macro_platform.db').
"""

import os
import pytest

# Point to isolated test database before importing backend modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./backend/data/test_macro_platform.db"
os.environ["ENVIRONMENT"] = "testing"

from backend.app.core.database import init_db, engine
from backend.app.core.seeder import seed_database


@pytest.fixture(scope="session", autouse=True)
def isolated_test_db():
    """Ensure test database is isolated and clean."""
    test_db_file = os.path.abspath("./backend/data/test_macro_platform.db")
    if os.path.exists(test_db_file):
        try:
            os.remove(test_db_file)
        except OSError:
            pass

    yield

    # Clean up test database file after test session
    if os.path.exists(test_db_file):
        try:
            os.remove(test_db_file)
        except OSError:
            pass
