"""remove_tenant_architecture

Revision ID: b1c2d3e4f5a6
Revises: 5226a1eaa02a
Create Date: 2026-04-26 04:00:00.000000

Removes multi-tenant architecture:
- Drops tenant_id columns from all tables
- Drops the tenants table
- Removes SUPERADMIN from userrole enum
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = 'b1c2d3e4f5a6'
down_revision: Union[str, None] = '5226a1eaa02a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── 0. Convert any SUPERADMIN users to ADMIN before enum change ──────────
    op.execute("UPDATE users SET role = 'ADMIN' WHERE role = 'SUPERADMIN'")

    # ── 1. Drop tenant_id FK constraints ─────────────────────────────────────
    # Users
    op.drop_index('ix_users_tenant_id', table_name='users')
    op.drop_constraint('users_tenant_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'tenant_id')

    # Academy contents
    op.drop_index('ix_academy_contents_tenant_id', table_name='academy_contents')
    op.drop_constraint('academy_contents_tenant_id_fkey', 'academy_contents', type_='foreignkey')
    op.drop_column('academy_contents', 'tenant_id')

    # Events
    op.drop_index('ix_events_tenant_id', table_name='events')
    op.drop_constraint('events_tenant_id_fkey', 'events', type_='foreignkey')
    op.drop_column('events', 'tenant_id')

    # Announcements
    op.drop_index('ix_announcements_tenant_id', table_name='announcements')
    op.drop_constraint('announcements_tenant_id_fkey', 'announcements', type_='foreignkey')
    op.drop_column('announcements', 'tenant_id')

    # Audit logs (nullable tenant_id)
    op.drop_constraint('audit_logs_tenant_id_fkey', 'audit_logs', type_='foreignkey')
    op.drop_column('audit_logs', 'tenant_id')

    # Reference codes
    op.drop_index('ix_reference_codes_tenant_id', table_name='reference_codes')
    op.drop_constraint('reference_codes_tenant_id_fkey', 'reference_codes', type_='foreignkey')
    op.drop_column('reference_codes', 'tenant_id')

    # Waitlist
    op.drop_index('ix_waitlist_tenant_id', table_name='waitlist')
    op.drop_constraint('waitlist_tenant_id_fkey', 'waitlist', type_='foreignkey')
    op.drop_column('waitlist', 'tenant_id')

    # Resource links
    op.drop_index('ix_resource_links_tenant_id', table_name='resource_links')
    op.drop_constraint('resource_links_tenant_id_fkey', 'resource_links', type_='foreignkey')
    op.drop_column('resource_links', 'tenant_id')

    # ── 2. Drop tenants table ─────────────────────────────────────────────────
    op.drop_index('ix_tenants_slug', table_name='tenants')
    op.drop_table('tenants')

    # ── 3. Remove SUPERADMIN from userrole enum (PostgreSQL raw SQL) ──────────
    # Step 1: Create new enum without SUPERADMIN
    op.execute("CREATE TYPE userrole_new AS ENUM ('ADMIN', 'EDITOR', 'PARTNER', 'GUEST')")
    # Step 2: Convert column to text (to allow re-typing)
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE TEXT")
    # Step 3: Drop old enum
    op.execute("DROP TYPE userrole")
    # Step 4: Rename new enum
    op.execute("ALTER TYPE userrole_new RENAME TO userrole")
    # Step 5: Convert column back to enum
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")


def downgrade() -> None:
    # ── Restore SUPERADMIN in userrole enum ───────────────────────────────────
    op.execute("CREATE TYPE userrole_old AS ENUM ('SUPERADMIN', 'ADMIN', 'EDITOR', 'PARTNER', 'GUEST')")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE TEXT")
    op.execute("DROP TYPE userrole")
    op.execute("ALTER TYPE userrole_old RENAME TO userrole")
    op.execute("ALTER TABLE users ALTER COLUMN role TYPE userrole USING role::userrole")

    # ── Restore tenants table ─────────────────────────────────────────────────
    op.create_table(
        'tenants',
        sa.Column('slug', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('config', sa.JSON(), nullable=True),
        sa.Column('id', sa.Uuid(), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_tenants_slug', 'tenants', ['slug'], unique=True)

    # NOTE: Downgrade re-adds columns but cannot restore original tenant_id data.
    # These columns are added with a dummy default and nullable for compatibility.

    op.add_column('users', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('academy_contents', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('events', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('announcements', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('audit_logs', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('reference_codes', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('waitlist', sa.Column('tenant_id', sa.Uuid(), nullable=True))
    op.add_column('resource_links', sa.Column('tenant_id', sa.Uuid(), nullable=True))
