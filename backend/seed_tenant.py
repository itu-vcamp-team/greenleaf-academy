import asyncio
import uuid
from src.datalayer.database import AsyncSessionFactory
from src.datalayer.model.db.tenant import Tenant

async def seed_tenant():
    async with AsyncSessionFactory() as session:
        # Check if tr tenant exists
        from sqlalchemy import select
        stmt = select(Tenant).where(Tenant.slug == "tr")
        result = await session.execute(stmt)
        if result.scalar_one_or_none():
            print("Tenant 'tr' already exists.")
            return

        tr_tenant = Tenant(
            id=uuid.uuid4(),
            slug="tr",
            name="Greenleaf Türkiye",
            is_active=True,
            config={"logo_url": "/logo.png", "theme": "default"}
        )
        session.add(tr_tenant)
        await session.commit()
        print("Tenant 'tr' created successfully.")

if __name__ == "__main__":
    asyncio.run(seed_tenant())
