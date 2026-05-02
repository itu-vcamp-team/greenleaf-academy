import asyncio
import uuid
from datetime import datetime, timezone
import bcrypt
from sqlalchemy import select, delete
from src.datalayer.database import AsyncSessionFactory
from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.academy_content import AcademyContent, ContentType, ContentStatus
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.model.db.resource_link import ResourceLink
from src.datalayer.model.db.favorite import Favorite
from src.services.academy_service import AcademyService


async def seed_initial_data():
    async with AsyncSessionFactory() as session:

        # 1. Seed Admin User (gaffar-dulkadir)
        username = "gaffar-dulkadir"
        stmt_user = select(User).where(User.username == username)
        result_user = await session.execute(stmt_user)
        user = result_user.scalar_one_or_none()

        salt = bcrypt.gensalt()
        hashed_pw = bcrypt.hashpw("admin123".encode(), salt).decode()

        if user:
            user.full_name = "Gaffar Dulkadir"
            user.email = "gaffardulkadir@gmail.com"
            user.password_hash = hashed_pw
            user.role = UserRole.ADMIN
            user.is_active = True
            user.is_verified = True
        else:
            user = User(
                id=uuid.uuid4(),
                username=username,
                email="gaffardulkadir@gmail.com",
                full_name="Gaffar Dulkadir",
                password_hash=hashed_pw,
                role=UserRole.ADMIN,
                is_active=True,
                is_verified=True,
                consent_given_at=datetime.now(timezone.utc)
            )
            session.add(user)

        await session.flush()
        admin_id = user.id

        # 2. Seed Academy Contents
        service = AcademyService()

        # Cleanup existing academy contents to ensure a clean state
        await session.execute(
            delete(UserProgress).where(
                UserProgress.content_id.in_(
                    select(AcademyContent.id)
                )
            )
        )
        await session.execute(
            delete(Favorite).where(
                Favorite.content_id.in_(
                    select(AcademyContent.id)
                )
            )
        )
        await session.execute(delete(AcademyContent))
        await session.flush()

        print("Seeding Academy Contents...")

        # --- SHORTS ---
        shorts_data = [
            {
                "title": "Greenleaf Vizyonu: Neden Buradayız?",
                "description": "3 dakikada Greenleaf Akademi'nin kuruluş felsefesi.",
                "video_url": "https://youtube.com/shorts/hJTW3WMxAhc",
                "order": "000100"
            },
            {
                "title": "Başarı İçin İlk 3 Kritik Adım",
                "description": "Eğitime başlarken dikkat etmeniz gereken en önemli 3 kural.",
                "video_url": "https://youtube.com/shorts/hJTW3WMxAhc",
                "order": "000200"
            },
            {
                "title": "Partnerlik Süreci ve Yol Haritası",
                "description": "Kayıt işleminden sonra sizi neler bekliyor?",
                "video_url": "https://youtube.com/shorts/hJTW3WMxAhc",
                "order": "000300"
            }
        ]

        last_short_id = None
        for s in shorts_data:
            content = AcademyContent(
                type=ContentType.SHORT,
                locale="tr-TR",
                title=s["title"],
                description=s["description"],
                video_url=s["video_url"],
                order=s["order"],
                status=ContentStatus.PUBLISHED,
                prerequisite_id=last_short_id,
                thumbnail_url=service.get_youtube_thumbnail_url(s["video_url"])
            )
            session.add(content)
            await session.flush()
            last_short_id = content.id

            # Mock Progress: Set Short 1 as completed for Admin (to unlock Short 2)
            if s["order"] == 1:
                progress = UserProgress(
                    user_id=admin_id,
                    content_id=content.id,
                    status="completed",
                    completed_at=datetime.now(timezone.utc)
                )
                session.add(progress)

        # --- MASTERCLASS ---
        mc = AcademyContent(
            type=ContentType.MASTERCLASS,
            locale="tr-TR",
            title="Satışın Temelleri ve İtiraz Yönetimi",
            description="Müşteri adaylarıyla ilk temas eğitimi.",
            video_url="https://youtu.be/A8sze3bezaM",
            order="000100",
            status=ContentStatus.PUBLISHED,
            thumbnail_url=service.get_youtube_thumbnail_url("https://youtu.be/A8sze3bezaM")
        )
        session.add(mc)
        await session.flush()

        # 3. Seed Resource Links
        print("Seeding Resource Links...")
        await session.execute(delete(ResourceLink))
        await session.flush()

        resources = [
            {
                "title": "Greenleaf Global Office",
                "description": "Organizasyon ve aday yönetimi paneli.",
                "url": "https://greenleaf-global.com/office",
                "category": "Tools",
                "order": 1
            },
            {
                "title": "Telegram Duyuru Kanalı",
                "description": "Anlık haberler ve duyurular için resmi kanal.",
                "url": "https://t.me/greenleafakademi",
                "category": "Communication",
                "order": 2
            },
            {
                "title": "Zoom Eğitim Odası",
                "description": "Canlı Masterclass eğitimleri için giriş linki.",
                "url": "https://zoom.us/j/greenleaf",
                "category": "Education",
                "order": 3
            }
        ]

        for r in resources:
            res_link = ResourceLink(
                title=r["title"],
                description=r["description"],
                url=r["url"],
                category=r["category"],
                order=r["order"],
                is_active=True,
                created_by=admin_id
            )
            session.add(res_link)

        try:
            await session.commit()
            print("✅ Seeding completed successfully.")
            print(f"   Admin user: {username} (role=ADMIN)")
            print(f"   Academy contents: {len(shorts_data)} shorts + 1 masterclass")
            print(f"   Resource links: {len(resources)}")
        except Exception as e:
            import traceback
            print("--- SEED ERROR ---")
            traceback.print_exc()
            await session.rollback()
            raise e


if __name__ == "__main__":
    asyncio.run(seed_initial_data())
