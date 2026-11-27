"""course access: цены, доступ по оплате, прогресс уроков

Revision ID: 0012
Revises: 0011
"""
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0012"
down_revision: Union[str, None] = "0011"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "course_modules",
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="4300"),
    )

    op.create_table(
        "course_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("full_price", sa.Numeric(10, 2), nullable=False),
        sa.Column("access_days", sa.Integer(), nullable=False, server_default="365"),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.execute(
        "INSERT INTO course_settings (id, full_price, access_days) VALUES (1, 25800, 365)"
    )

    op.create_table(
        "course_access",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "module_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("course_modules.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(16), nullable=False),
        sa.Column(
            "payment_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("payments.id", ondelete="SET NULL"),
            nullable=True,
            unique=True,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_course_access_user_id", "course_access", ["user_id"])

    op.create_table(
        "course_lesson_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("course_lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "first_opened_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "last_opened_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("user_id", "lesson_id"),
    )
    op.create_index(
        "ix_course_lesson_progress_user_id", "course_lesson_progress", ["user_id"]
    )
    op.create_index(
        "ix_course_lesson_progress_lesson_id", "course_lesson_progress", ["lesson_id"]
    )


def downgrade() -> None:
    op.drop_table("course_lesson_progress")
    op.drop_table("course_access")
    op.drop_table("course_settings")
    op.drop_column("course_modules", "price")
