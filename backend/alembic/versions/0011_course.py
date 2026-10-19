"""course: modules, lessons, materials + 6 стартовых модулей

Revision ID: 0011
Revises: 0010
"""
import uuid
from typing import Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0011"
down_revision: Union[str, None] = "0010"
branch_labels = None
depends_on = None


MODULES = [
    (
        "Финансовое мышление",
        "Как работают деньги и почему одни люди богатеют, а другие нет. "
        "Ставим личные финансовые цели и разбираем привычки, которые мешают их достичь.",
    ),
    (
        "Личный бюджет и учёт",
        "Доходы, расходы и куда на самом деле уходят деньги. Простая система учёта, "
        "финансовый план на месяц и год, как начать откладывать при любом доходе.",
    ),
    (
        "Подушка безопасности и долги",
        "Сколько денег держать на чёрный день и где их хранить. Кредиты и кредитные карты "
        "без ловушек, как рассчитать переплату и выбраться из долгов.",
    ),
    (
        "Основы инвестирования",
        "Инфляция, сложный процент, риск и доходность. Вклады, облигации, акции и фонды: "
        "как они устроены, с чего начать и как не потерять деньги на старте.",
    ),
    (
        "Защита капитала",
        "Страхование, налоги и налоговые вычеты, которые возвращают деньги. "
        "Как распознать финансовое мошенничество и защитить себя и близких.",
    ),
    (
        "Путь к финансовой независимости",
        "Пассивный доход, пенсия, которую вы строите сами, и личная стратегия на годы вперёд. "
        "Собираем всё пройденное в один план действий.",
    ),
]


def upgrade() -> None:
    modules = op.create_table(
        "course_modules",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("position", sa.Integer(), nullable=False, unique=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "course_lessons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "module_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("course_modules.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_published", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index("ix_course_lessons_module_id", "course_lessons", ["module_id"])

    op.create_table(
        "course_lesson_materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "lesson_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("course_lessons.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", sa.String(16), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("filename", sa.String(255), nullable=False),
        sa.Column("content_type", sa.String(127), nullable=False),
        sa.Column("size_bytes", sa.BigInteger(), nullable=False, server_default="0"),
        sa.Column("storage_key", sa.String(512), nullable=False, unique=True),
        sa.Column("upload_id", sa.String(1024), nullable=True),
        sa.Column(
            "is_uploaded", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column("position", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )
    op.create_index(
        "ix_course_lesson_materials_lesson_id",
        "course_lesson_materials",
        ["lesson_id"],
    )

    op.bulk_insert(
        modules,
        [
            {"id": uuid.uuid4(), "position": i, "title": title, "description": desc}
            for i, (title, desc) in enumerate(MODULES, start=1)
        ],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_course_lesson_materials_lesson_id", table_name="course_lesson_materials"
    )
    op.drop_table("course_lesson_materials")
    op.drop_index("ix_course_lessons_module_id", table_name="course_lessons")
    op.drop_table("course_lessons")
    op.drop_table("course_modules")
