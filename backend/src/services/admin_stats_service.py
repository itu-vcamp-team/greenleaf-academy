from __future__ import annotations
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, func, case, and_, cast, Date
from sqlalchemy.ext.asyncio import AsyncSession

from src.datalayer.model.db.user import User, UserRole
from src.datalayer.model.db.academy_content import AcademyContent, ContentStatus, ContentType
from src.datalayer.model.db.user_progress import UserProgress
from src.datalayer.model.db.event_calendar_rsvp import EventCalendarRsvp
from src.utils.rank_utils import (
    compute_rank,
    POINTS_PER_SHORT,
    POINTS_PER_MASTERCLASS,
    RANK_META,
    PartnerRank,
)


class AdminStatsService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_dashboard_stats(self) -> dict:
        """
        Calculates enriched metrics for the admin dashboard.
        Returns core counts, rank distribution, avg completion, and 7-day registrations.
        """
        now = datetime.now(timezone.utc)
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        seven_days_ago = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)

        # ── 1. Total Active Partners ─────────────────────────────────────────────
        total_partners = (
            await self.session.execute(
                select(func.count(User.id)).where(
                    User.role == UserRole.PARTNER,
                    User.is_active == True,
                )
            )
        ).scalar() or 0

        # ── 2. Total Event Guests (unauthenticated RSVP filers) ─────────────────
        # "Misafir" = people who filled name/email to get event calendar invites
        # These are EventCalendarRsvp records with is_member=False (not registered users)
        total_guests = (
            await self.session.execute(
                select(func.count(EventCalendarRsvp.id)).where(
                    EventCalendarRsvp.is_member == False
                )
            )
        ).scalar() or 0

        # ── 3. Pending Approvals (PARTNER role, verified but not yet activated) ──
        # New registrations create users with role=PARTNER, is_active=False, is_verified=True
        # They need admin approval to become active partners
        pending_approvals = (
            await self.session.execute(
                select(func.count(User.id)).where(
                    User.is_verified == True,
                    User.is_active == False,
                    User.role == UserRole.PARTNER,
                )
            )
        ).scalar() or 0

        # ── 4. New Partners This Month ───────────────────────────────────────────
        new_partners_this_month = (
            await self.session.execute(
                select(func.count(User.id)).where(
                    User.role == UserRole.PARTNER,
                    User.is_active == True,
                    User.created_at >= month_start,
                )
            )
        ).scalar() or 0

        # ── 5. Total Published Contents ──────────────────────────────────────────
        total_contents = (
            await self.session.execute(
                select(func.count(AcademyContent.id)).where(
                    AcademyContent.status == ContentStatus.PUBLISHED
                )
            )
        ).scalar() or 0

        # ── 6. Total Short / Masterclass published (for rank calculation) ────────
        total_shorts = (
            await self.session.execute(
                select(func.count(AcademyContent.id)).where(
                    AcademyContent.status == ContentStatus.PUBLISHED,
                    AcademyContent.type == ContentType.SHORT,
                )
            )
        ).scalar() or 0

        total_mc = (
            await self.session.execute(
                select(func.count(AcademyContent.id)).where(
                    AcademyContent.status == ContentStatus.PUBLISHED,
                    AcademyContent.type == ContentType.MASTERCLASS,
                )
            )
        ).scalar() or 0

        max_points = (total_shorts * POINTS_PER_SHORT) + (total_mc * POINTS_PER_MASTERCLASS)

        # ── 7. Per-partner completed counts (for rank distribution + avg pct) ────
        #  LEFT JOINs so partners with zero progress are included.
        per_partner_stmt = (
            select(
                User.id,
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    UserProgress.status == "completed",
                                    AcademyContent.type == ContentType.SHORT,
                                    AcademyContent.status == ContentStatus.PUBLISHED,
                                ),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("completed_shorts"),
                func.coalesce(
                    func.sum(
                        case(
                            (
                                and_(
                                    UserProgress.status == "completed",
                                    AcademyContent.type == ContentType.MASTERCLASS,
                                    AcademyContent.status == ContentStatus.PUBLISHED,
                                ),
                                1,
                            ),
                            else_=0,
                        )
                    ),
                    0,
                ).label("completed_mc"),
            )
            .outerjoin(UserProgress, UserProgress.user_id == User.id)
            .outerjoin(
                AcademyContent,
                and_(
                    AcademyContent.id == UserProgress.content_id,
                    AcademyContent.status == ContentStatus.PUBLISHED,
                ),
            )
            .where(User.role == UserRole.PARTNER, User.is_active == True)
            .group_by(User.id)
        )

        partner_rows = (await self.session.execute(per_partner_stmt)).all()

        # Compute rank distribution and average completion
        rank_distribution: dict[str, int] = {r.value: 0 for r in PartnerRank}
        total_pct_sum = 0.0

        for row in partner_rows:
            earned = (row.completed_shorts * POINTS_PER_SHORT) + (row.completed_mc * POINTS_PER_MASTERCLASS)
            pct = round((earned / max_points) * 100, 1) if max_points > 0 else 0.0
            rank = compute_rank(pct)
            rank_distribution[rank.value] += 1
            total_pct_sum += pct

        avg_completion_pct = round(total_pct_sum / len(partner_rows), 1) if partner_rows else 0.0

        # ── 8. Registrations last 7 days (all roles) ────────────────────────────
        reg_stmt = (
            select(
                cast(User.created_at, Date).label("day"),
                func.count(User.id).label("count"),
            )
            .where(User.created_at >= seven_days_ago)
            .group_by(cast(User.created_at, Date))
            .order_by(cast(User.created_at, Date))
        )
        reg_rows = (await self.session.execute(reg_stmt)).all()
        reg_by_date = {str(row.day): row.count for row in reg_rows}

        # Fill in all 7 days (including 0-count days)
        registrations_last_7_days = []
        for i in range(7):
            day = (seven_days_ago + timedelta(days=i)).date()
            day_str = str(day)
            registrations_last_7_days.append(
                {"date": day_str, "count": reg_by_date.get(day_str, 0)}
            )

        return {
            "total_partners": total_partners,
            "total_guests": total_guests,
            "pending_approvals": pending_approvals,
            "new_partners_this_month": new_partners_this_month,
            "total_contents": total_contents,
            "avg_completion_pct": avg_completion_pct,
            "rank_distribution": rank_distribution,
            "registrations_last_7_days": registrations_last_7_days,
        }
