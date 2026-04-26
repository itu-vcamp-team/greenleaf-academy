import re
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from src.datalayer.model.db.academy_content import AcademyContent
from src.datalayer.repository.academy_repository import AcademyRepository
from src.exceptions import InvalidYouTubeURLError


class AcademyService:
    """
    Service layer for Academy logic including URL processing and high-level content management.
    Single-tenant: no tenant_id required.
    """

    @staticmethod
    def extract_youtube_id(url: str) -> Optional[str]:
        """
        Extracts the 11-char video ID from various YouTube URL formats.
        """
        patterns = [
            r"(?:v=|\/)([0-9A-Za-z_-]{11}).*",
            r"shorts\/([0-9A-Za-z_-]{11})",
            r"youtu\.be\/([0-9A-Za-z_-]{11})"
        ]
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None

    @staticmethod
    def get_youtube_thumbnail_url(video_url: str) -> Optional[str]:
        """
        Generates the standard YouTube high-def thumbnail URL.
        """
        video_id = AcademyService.extract_youtube_id(video_url)
        if video_id:
            return f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg"
        return None

    async def create_content(
        self,
        db: AsyncSession,
        data: dict
    ) -> AcademyContent:
        """
        Validated creation of AcademyContent.
        """
        # Validate YouTube URL
        video_id = self.extract_youtube_id(data["video_url"])
        if not video_id:
            raise InvalidYouTubeURLError()

        # Auto-set thumbnail if not provided
        if not data.get("thumbnail_url"):
            data["thumbnail_url"] = self.get_youtube_thumbnail_url(data["video_url"])

        repo = AcademyRepository(db)
        content = AcademyContent(**data)

        # Save entity
        saved_content = await repo.save(content)
        await db.commit()
        await db.refresh(saved_content)

        return saved_content

    async def update_content(
        self,
        db: AsyncSession,
        content_id: uuid.UUID,
        data: dict
    ) -> AcademyContent:
        """
        Updates content and refreshes thumbnail if video_url changes.
        """
        repo = AcademyRepository(db)
        content = await repo.get_by_id(content_id)

        if not content:
            return None  # Router handles 404

        # If video_url changes, re-validate and update thumbnail
        if "video_url" in data and data["video_url"] != content.video_url:
            video_id = self.extract_youtube_id(data["video_url"])
            if not video_id:
                raise InvalidYouTubeURLError()
            data["thumbnail_url"] = self.get_youtube_thumbnail_url(data["video_url"])

        for key, value in data.items():
            setattr(content, key, value)

        updated_content = await repo.save(content)
        await db.commit()
        await db.refresh(updated_content)

        return updated_content
