from collections.abc import Generator

from sqlalchemy import create_engine, inspect, select, text
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.models.base import Base
import app.models  # noqa: F401
from app.models.level import Level


def _create_engine():
    connect_args = {}
    if settings.database_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}

    return create_engine(settings.database_url, connect_args=connect_args)


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_levels(db: Session) -> None:
    default_levels = ["Trainee", "Junior", "Middle", "Senior", "Lead"]
    existing = set(db.scalars(select(Level.name)).all())
    for level_name in default_levels:
        if level_name not in existing:
            db.add(Level(name=level_name))
    db.commit()


def sync_schema() -> None:
    inspector = inspect(engine)
    if not inspector.has_table("tags"):
        return

    migrations = []

    tag_columns = {column["name"] for column in inspector.get_columns("tags")}
    if "is_archived" not in tag_columns:
        if engine.dialect.name == "sqlite":
            migrations.append(
                "ALTER TABLE tags ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT 0"
            )
        else:
            migrations.append(
                "ALTER TABLE tags ADD COLUMN is_archived BOOLEAN NOT NULL DEFAULT false"
            )

    if inspector.has_table("interview_results"):
        result_columns = {
            column["name"] for column in inspector.get_columns("interview_results")
        }
        if "position" not in result_columns:
            if engine.dialect.name == "sqlite":
                migrations.append(
                    "ALTER TABLE interview_results ADD COLUMN position VARCHAR(255) NOT NULL DEFAULT ''"
                )
            else:
                migrations.append(
                    "ALTER TABLE interview_results ADD COLUMN position VARCHAR(255) NOT NULL DEFAULT ''"
                )

    if not migrations:
        return

    with engine.begin() as conn:
        for statement in migrations:
            conn.execute(text(statement))


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    sync_schema()
    db = SessionLocal()
    try:
        seed_levels(db)
    finally:
        db.close()
