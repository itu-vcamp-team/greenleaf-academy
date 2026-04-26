import pytest
import uuid
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.model.db.academy_content import AcademyContent, ContentType, ContentStatus
from src.datalayer.repository.progress_repository import ProgressRepository
from src.services.progress_service import ProgressService


@pytest.mark.asyncio
async def test_progress_auto_completion_at_85_percent(db_session, test_user_id):
    """Verify that progress > 85% marks status as COMPLETED."""
    content_id = uuid.uuid4()
    repo = ProgressRepository(db_session, test_user_id)
    service = ProgressService(repo)

    # Test Case 1: 50% watching -> status: in_progress
    progress = await service.update_watch_progress(content_id, 50.0, 100.0)
    assert progress.status == "in_progress"
    assert progress.completion_percentage == 50.0

    # Test Case 2: 85% watching -> status: completed
    progress = await service.update_watch_progress(content_id, 85.0, 170.0)
    assert progress.status == "completed"
    assert progress.completed_at is not None


@pytest.mark.asyncio
async def test_progress_backward_protection(db_session, test_user_id):
    """Ensure completion percentage never goes backwards."""
    content_id = uuid.uuid4()
    repo = ProgressRepository(db_session, test_user_id)
    service = ProgressService(repo)

    # Watch 60%
    await service.update_watch_progress(content_id, 60.0, 120.0)

    # Try to set 40%
    progress = await service.update_watch_progress(content_id, 40.0, 80.0)

    assert progress.completion_percentage == 60.0
    assert progress.last_position_seconds == 80.0  # Position can change, but percentage is "highest reach"


@pytest.mark.asyncio
async def test_progress_stats_calculation(db_session, test_user_id):
    """Verify completion percentage statistics."""
    # 1. Setup sample contents
    c1 = AcademyContent(id=uuid.uuid4(), type=ContentType.SHORT, locale="tr", title="S1", video_url="v1", status=ContentStatus.PUBLISHED, order=1)
    c2 = AcademyContent(id=uuid.uuid4(), type=ContentType.SHORT, locale="tr", title="S2", video_url="v2", status=ContentStatus.PUBLISHED, order=2)
    c3 = AcademyContent(id=uuid.uuid4(), type=ContentType.SHORT, locale="tr", title="S3", video_url="v3", status=ContentStatus.PUBLISHED, order=3)

    db_session.add_all([c1, c2, c3])
    await db_session.commit()

    repo = ProgressRepository(db_session, test_user_id)
    service = ProgressService(repo)

    # 2. Mark c1 as completed
    await service.update_watch_progress(c1.id, 90.0, 180.0)

    # 3. Get Stats
    stats = await service.get_stats(ContentType.SHORT)

    assert stats["total"] == 3
    assert stats["completed"] == 1
    assert stats["percentage"] == 33.3  # (1/3) * 100
