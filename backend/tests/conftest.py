import pytest
import pytest_asyncio
import uuid
from typing import AsyncGenerator
from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from src.datalayer.database import Base
from src.app import app

# Use SQLite in-memory for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="session", autouse=True)
async def setup_db():
    """Initialize test database schema after stripping PG-specific server defaults."""

    # SQLite does not support gen_random_uuid() or now() as server defaults.
    # We strip them from metadata for the test session.
    for table in Base.metadata.tables.values():
        for column in table.columns:
            if column.server_default is not None:
                # Remove server_default for SQLite compatibility
                column.server_default = None

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provides a clean database session for each test."""
    async with AsyncSessionLocal() as session:
        yield session
        # Rollback any changes to keep tests independent
        await session.rollback()

@pytest.fixture
def test_user_id() -> uuid.UUID:
    return uuid.uuid4()
