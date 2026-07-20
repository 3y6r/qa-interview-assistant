from datetime import datetime, timezone

import app.models  # noqa: F401
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.exceptions.base import NotFoundError
from app.models import Base
from app.models.category import Category
from app.models.level import Level
from app.models.question import Question
from app.models.tag import Tag
from app.repositories.question_repository import QuestionRepository


def make_session(tmp_path):
    engine = create_engine(
        f"sqlite:///{(tmp_path / 'repo.db').as_posix()}",
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = session_factory()
    return session, engine


def seed_common_entities(session):
    category = Category(name="Backend")
    level = Level(name="Junior")
    sql = Tag(name="SQL", color="#FF5733")
    api = Tag(name="API", color="#33AAFF")
    session.add_all([category, level, sql, api])
    session.commit()
    session.refresh(category)
    session.refresh(level)
    session.refresh(sql)
    session.refresh(api)
    return category, level, sql, api


def make_question(text, category_id, level_id):
    return Question(
        text=text,
        expected_answer=f"{text} answer",
        category_id=category_id,
        level_id=level_id,
        is_archived=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_create_question_attaches_tags(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        category, level, sql, api = seed_common_entities(session)
        repo = QuestionRepository(session)

        question = make_question("Question 1", category.id, level.id)
        created = repo.create(question, tag_ids=[sql.id, api.id])

        assert {tag.name for tag in created.tags} == {"SQL", "API"}
    finally:
        session.close()
        engine.dispose()


def test_update_question_replaces_tags(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        category, level, sql, api = seed_common_entities(session)
        repo = QuestionRepository(session)

        question = make_question("Question 1", category.id, level.id)
        created = repo.create(question, tag_ids=[sql.id])
        updated = repo.update(created, tag_ids=[api.id])

        assert {tag.name for tag in updated.tags} == {"API"}
    finally:
        session.close()
        engine.dispose()


def test_list_questions_filters_by_all_tags(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        category, level, sql, api = seed_common_entities(session)
        repo = QuestionRepository(session)

        q1 = repo.create(
            make_question("Question 1", category.id, level.id), tag_ids=[sql.id, api.id]
        )
        repo.create(
            make_question("Question 2", category.id, level.id), tag_ids=[sql.id]
        )
        repo.create(
            make_question("Question 3", category.id, level.id), tag_ids=[api.id]
        )
        repo.create(make_question("Question 4", category.id, level.id))

        items = repo.list(tag_ids=[sql.id, api.id])

        assert [item.id for item in items] == [q1.id]
    finally:
        session.close()
        engine.dispose()


def test_create_question_rejects_missing_tags(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        category, level, sql, _ = seed_common_entities(session)
        repo = QuestionRepository(session)

        question = make_question("Question 1", category.id, level.id)

        try:
            repo.create(question, tag_ids=[sql.id, 999])
            raised = False
        except NotFoundError:
            raised = True

        assert raised is True
    finally:
        session.close()
        engine.dispose()


def test_list_questions_sorts_before_limit_and_offset(tmp_path):
    session, engine = make_session(tmp_path)
    try:
        category, level, _, _ = seed_common_entities(session)
        repo = QuestionRepository(session)

        created = [
            repo.create(make_question(f"Question {index}", category.id, level.id))
            for index in range(5)
        ]
        created_ids = [question.id for question in created]

        newest_first_page = repo.list(sort_order="newest", limit=2, offset=0)
        newest_second_page = repo.list(sort_order="newest", limit=2, offset=2)
        oldest_first_page = repo.list(sort_order="oldest", limit=2, offset=0)

        assert [item.id for item in newest_first_page] == list(reversed(created_ids))[:2]
        assert [item.id for item in newest_second_page] == list(reversed(created_ids))[2:4]
        assert [item.id for item in oldest_first_page] == created_ids[:2]
    finally:
        session.close()
        engine.dispose()
