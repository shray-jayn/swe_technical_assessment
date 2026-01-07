"""create vehicles table

Revision ID: 0001_create_vehicles
Revises:
Create Date: 2026-01-06
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = "0001_create_vehicles"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "vehicles",
        sa.Column("vin", sa.Text(), primary_key=True),
        sa.Column("make", sa.Text(), nullable=False),
        sa.Column("model", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("image_urls", sa.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("now()")),
    )


def downgrade() -> None:
    op.drop_table("vehicles")


