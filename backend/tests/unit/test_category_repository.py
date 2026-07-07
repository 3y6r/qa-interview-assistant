import app.models  # noqa: F401
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.models import Base
from app.models.category import Category
from app.repositories.category_repository import CategoryRepository


def make_session(tmp_path):
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'category_repo.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = session_factory()
    return session, engine


def test_list_categories_filters_by_not_archived(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        active = Category(name="Backend", is_archived=False)
        archived = Category(name="Frontend", is_archived=True)
        session.add_all([active, archived])
        session.commit()

        items = CategoryRepository(session).list(is_archived=False)

        assert [item.name for item in items] == ["Backend"]
    finally:
        session.close()
        engine.dispose()
