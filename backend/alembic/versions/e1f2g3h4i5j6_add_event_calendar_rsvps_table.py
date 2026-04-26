"""add event_calendar_rsvps table

Revision ID: e1f2g3h4i5j6
Revises: a2b3c4d5e6f7
Create Date: 2026-04-26 17:00:00.000000

Adds event_calendar_rsvps table to track calendar-invite requests from
both unauthenticated guests (name + email) and authenticated members.
Data is surfaced in the admin events panel to gauge event interest.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e1f2g3h4i5j6'
down_revision: Union[str, None] = 'a2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS event_calendar_rsvps (
            id          UUID         NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
            event_id    UUID         NOT NULL
                            REFERENCES events(id) ON DELETE CASCADE,
            email       VARCHAR(255) NOT NULL,
            full_name   VARCHAR(200),
            is_member   BOOLEAN      NOT NULL DEFAULT false,
            user_id     UUID
                            REFERENCES users(id) ON DELETE SET NULL,
            CONSTRAINT pk_event_calendar_rsvps PRIMARY KEY (id)
        );
        """
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_event_calendar_rsvps_event_id "
        "ON event_calendar_rsvps (event_id);"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_event_calendar_rsvps_email "
        "ON event_calendar_rsvps (email);"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_event_calendar_rsvps_email;")
    op.execute("DROP INDEX IF EXISTS ix_event_calendar_rsvps_event_id;")
    op.execute("DROP TABLE IF EXISTS event_calendar_rsvps;")
