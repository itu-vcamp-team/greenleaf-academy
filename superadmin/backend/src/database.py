from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from src.models import Base
from src.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://").replace("postgres://", "postgresql+asyncpg://"),
    echo=settings.APP_ENV == "development"
)

AsyncSessionFactory = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db():
    """Create all tables on startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionFactory() as session:
        yield session
