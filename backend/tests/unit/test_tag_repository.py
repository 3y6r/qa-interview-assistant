import app.models  # noqa: F401
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base
from app.models.tag import Tag
from app.repositories.tag_repository import TagRepository


def make_session(tmp_path):
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'tag_repo.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = session_factory()
    return session, engine


def test_get_all_tags_filters_by_not_archived(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        active = Tag(name="SQL", color="#FF5733", is_archived=False)
        archived = Tag(name="API", color="#33AAFF", is_archived=True)
        session.add_all([active, archived])
        session.commit()

        items = TagRepository(session).get_all(is_archived=False)

        assert [item.name for item in items] == ["SQL"]
    finally:
        session.close()
        engine.dispose()
