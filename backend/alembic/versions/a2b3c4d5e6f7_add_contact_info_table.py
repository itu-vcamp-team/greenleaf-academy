"""add_contact_info_table

Revision ID: a2b3c4d5e6f7
Revises: 66b9eef5c1fe
Create Date: 2026-04-26 14:00:00.000000

Adds contact_infos table for admin-managed public contact entries
displayed in the guest/partner navbar when active entries exist.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2b3c4d5e6f7'
down_revision: Union[str, None] = '66b9eef5c1fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create enum type — idempotent; handles pre-existing type created by SQLAlchemy metadata.
    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE contacttype AS ENUM
                ('EMAIL', 'PHONE', 'WHATSAPP', 'INSTAGRAM', 'YOUTUBE', 'WEBSITE', 'OTHER');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )

    # 2. Create table via raw SQL to avoid SQLAlchemy's enum auto-create event hooks
    #    which fire even when create_type=False in certain asyncpg/SQLAlchemy version combos.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS contact_infos (
            id          UUID NOT NULL DEFAULT gen_random_uuid(),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            owner_name  VARCHAR(200) NOT NULL,
            label       VARCHAR(200),
            type        contacttype NOT NULL,
            value       VARCHAR(500) NOT NULL,
            "order"     INTEGER NOT NULL DEFAULT 0,
            is_active   BOOLEAN NOT NULL DEFAULT true,
            created_by  UUID NOT NULL,
            CONSTRAINT pk_contact_infos PRIMARY KEY (id),
            CONSTRAINT fk_contact_infos_created_by
                FOREIGN KEY (created_by) REFERENCES users(id)
        );
        """
    )

    # 3. Indexes for common query patterns
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_contact_infos_is_active ON contact_infos (is_active);"
    )
    op.execute(
        'CREATE INDEX IF NOT EXISTS ix_contact_infos_order ON contact_infos ("order");'
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_contact_infos_order;")
    op.execute("DROP INDEX IF EXISTS ix_contact_infos_is_active;")
    op.execute("DROP TABLE IF EXISTS contact_infos;")
    op.execute("DROP TYPE IF EXISTS contacttype;")
