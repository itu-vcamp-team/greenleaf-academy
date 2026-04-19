from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from src.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=(settings.APP_ENV == "development"),
    pool_size=10,
    max_overflow=20,
)

AsyncSessionFactory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Standard SQLAlchemy Declarative Base"""
    pass


async def get_db_session() -> AsyncSession:
    """FastAPI Depends ile kullanılacak session generator."""
    async with AsyncSessionFactory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_tables():
    """Sadece development ortamında tüm tabloları oluşturur. Prod'da Alembic kullan."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
