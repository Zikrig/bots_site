"""Initial schema: products, leads, admins

Revision ID: 001
Revises:
Create Date: 2025-02-16

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "products",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(255), nullable=True),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("short_description", sa.String(500), nullable=False),
        sa.Column("image_url", sa.String(512), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=True),
        sa.Column("is_visible", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_slug"), "products", ["slug"], unique=True)

    op.create_table(
        "leads",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("name", sa.String(255), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("status", sa.Enum("new", "contacted", "closed", name="leadstatus"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "admins",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("username", sa.String(64), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )


def downgrade() -> None:
    op.drop_table("admins")
    op.drop_table("leads")
    op.drop_index(op.f("ix_products_slug"), table_name="products")
    op.drop_table("products")
