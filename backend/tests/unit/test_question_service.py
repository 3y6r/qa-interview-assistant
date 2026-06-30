from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.exceptions.base import NotFoundError, ValidationError
from app.models.category import Category
from app.models.level import Level
from app.models.question import Question
from app.services import question_service as module
from app.services.question_service import QuestionService

from tests.unit.helpers import DummyRepo, DummySession


def make_question():
    return Question(
        id=1,
        text="Old question",
        expected_answer="Old answer",
        category_id=1,
        level_id=2,
        is_archived=False,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )


def test_create_question_trims_and_creates(monkeypatch):
    question_repo = DummyRepo()
    category_repo = DummyRepo(get_result=Category(id=1, name="Backend", is_archived=False))
    level_repo = DummyRepo(get_result=Level(id=2, name="Junior"))

    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: category_repo)
    monkeypatch.setattr(module, "LevelRepository", lambda db: level_repo)

    service = QuestionService(DummySession())
    result = service.create_question(
        SimpleNamespace(
            text="  What is API?  ",
            expected_answer="  Application Programming Interface  ",
            category_id=1,
            level_id=2,
        )
    )

    assert result.text == "What is API?"
    assert result.expected_answer == "Application Programming Interface"
    assert len(question_repo.created) == 1
    assert question_repo.created[0].category_id == 1
    assert question_repo.created[0].level_id == 2


def test_create_question_rejects_empty_fields(monkeypatch):
    question_repo = DummyRepo()
    category_repo = DummyRepo(get_result=Category(id=1, name="Backend", is_archived=False))
    level_repo = DummyRepo(get_result=Level(id=2, name="Junior"))

    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: category_repo)
    monkeypatch.setattr(module, "LevelRepository", lambda db: level_repo)

    service = QuestionService(DummySession())

    with pytest.raises(ValidationError, match="Question text cannot be empty"):
        service.create_question(
            SimpleNamespace(text="   ", expected_answer="Answer", category_id=1, level_id=2)
        )

    with pytest.raises(ValidationError, match="Expected answer cannot be empty"):
        service.create_question(
            SimpleNamespace(text="Question", expected_answer="   ", category_id=1, level_id=2)
        )


def test_create_question_rejects_missing_foreign_keys(monkeypatch):
    question_repo = DummyRepo()
    category_repo = DummyRepo(get_result=None)
    level_repo = DummyRepo(get_result=Level(id=2, name="Junior"))

    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: category_repo)
    monkeypatch.setattr(module, "LevelRepository", lambda db: level_repo)

    service = QuestionService(DummySession())

    with pytest.raises(NotFoundError, match="Category not found"):
        service.create_question(
            SimpleNamespace(text="Question", expected_answer="Answer", category_id=1, level_id=2)
        )


def test_create_question_rejects_archived_category(monkeypatch):
    question_repo = DummyRepo()
    archived_category = Category(id=1, name="Backend", is_archived=True)
    category_repo = DummyRepo(get_result=archived_category)
    level_repo = DummyRepo(get_result=Level(id=2, name="Junior"))

    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: category_repo)
    monkeypatch.setattr(module, "LevelRepository", lambda db: level_repo)

    service = QuestionService(DummySession())

    with pytest.raises(ValidationError, match="Category is archived"):
        service.create_question(
            SimpleNamespace(text="Question", expected_answer="Answer", category_id=1, level_id=2)
        )


def test_get_question_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "QuestionRepository", lambda db: repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: DummyRepo())
    monkeypatch.setattr(module, "LevelRepository", lambda db: DummyRepo())

    service = QuestionService(DummySession())

    with pytest.raises(NotFoundError, match="Question not found"):
        service.get_question(1)


def test_update_question_updates_fields(monkeypatch):
    question = make_question()
    question_repo = DummyRepo(get_result=question)
    category_repo = DummyRepo(get_result=Category(id=9, name="New Category", is_archived=False))
    level_repo = DummyRepo(get_result=Level(id=8, name="Middle"))

    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: category_repo)
    monkeypatch.setattr(module, "LevelRepository", lambda db: level_repo)

    service = QuestionService(DummySession())
    result = service.update_question(
        1,
        SimpleNamespace(
            text="  New question  ",
            expected_answer="  New answer  ",
            category_id=9,
            level_id=8,
            is_archived=True,
        ),
    )

    assert result.text == "New question"
    assert result.expected_answer == "New answer"
    assert result.category_id == 9
    assert result.level_id == 8
    assert result.is_archived is True
    assert question_repo.updated == [question]


def test_archive_question_sets_flag(monkeypatch):
    question = make_question()
    question_repo = DummyRepo(get_result=question)
    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: DummyRepo())
    monkeypatch.setattr(module, "LevelRepository", lambda db: DummyRepo())

    service = QuestionService(DummySession())
    result = service.archive_question(1)

    assert result.is_archived is True
    assert question_repo.updated == [question]


def test_delete_question_deletes_entity(monkeypatch):
    question = make_question()
    question_repo = DummyRepo(get_result=question)
    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: DummyRepo())
    monkeypatch.setattr(module, "LevelRepository", lambda db: DummyRepo())

    service = QuestionService(DummySession())
    service.delete_question(1)

    assert question_repo.get_calls == [1]
    assert question_repo.updated == []


def test_list_questions_passes_filters(monkeypatch):
    question_repo = DummyRepo(list_result=[make_question()])
    monkeypatch.setattr(module, "QuestionRepository", lambda db: question_repo)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: DummyRepo())
    monkeypatch.setattr(module, "LevelRepository", lambda db: DummyRepo())

    service = QuestionService(DummySession())
    items = service.list_questions(text="api", category_id=1, level_id=2, is_archived=False)

    assert len(items) == 1
    assert question_repo.list_calls == [
        {"text": "api", "category_id": 1, "level_id": 2, "is_archived": False}
    ]
