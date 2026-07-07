from types import SimpleNamespace

import pytest

from app.exceptions.base import ConflictError, NotFoundError, ValidationError
from app.models.category import Category
from app.services import category_service as module
from app.services.category_service import CategoryService

from tests.unit.helpers import DummyRepo, DummySession


def test_list_categories_passes_archive_filter(monkeypatch):
    repo = DummyRepo(list_result=[Category(id=1, name="Backend", is_archived=False)])
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())
    categories = service.list_categories(is_archived=False)

    assert len(categories) == 1
    assert repo.list_calls == [{"is_archived": False}]


def test_create_category_trims_name_and_creates(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())
    result = service.create_category(SimpleNamespace(name="  Backend  "))

    assert result.name == "Backend"
    assert len(repo.created) == 1
    assert repo.created[0].name == "Backend"


def test_create_category_rejects_empty_name(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(ValidationError, match="Category name cannot be empty"):
        service.create_category(SimpleNamespace(name="   "))


def test_create_category_rejects_duplicate(monkeypatch):
    repo = DummyRepo(get_result=SimpleNamespace(id=1))
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(ConflictError, match="Category with this name already exists"):
        service.create_category(SimpleNamespace(name="Backend"))


def test_update_category_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(NotFoundError, match="Category not found"):
        service.update_category(1, SimpleNamespace(name=None, is_archived=None))


def test_update_category_renames_and_archives(monkeypatch):
    category = Category(id=1, name="Old", is_archived=False)
    repo = DummyRepo(get_result=category)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())
    result = service.update_category(1, SimpleNamespace(name="  New  ", is_archived=True))

    assert result.name == "New"
    assert result.is_archived is True
    assert repo.updated == [category]


def test_archive_category_sets_flag(monkeypatch):
    category = Category(id=1, name="Backend", is_archived=False)
    repo = DummyRepo(get_result=category)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())
    result = service.archive_category(1)

    assert result.is_archived is True
    assert repo.updated == [category]


def test_archive_category_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(NotFoundError, match="Category not found"):
        service.archive_category(1)

    assert repo.updated == []


def test_unarchive_category_sets_flag(monkeypatch):
    category = Category(id=1, name="Backend", is_archived=True)
    repo = DummyRepo(get_result=category)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())
    result = service.unarchive_category(1)

    assert result.is_archived is False
    assert repo.updated == [category]


def test_unarchive_category_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(NotFoundError, match="Category not found"):
        service.unarchive_category(1)

    assert repo.updated == []


def test_update_category_rejects_name_conflict(monkeypatch):
    category = Category(id=1, name="Old", is_archived=False)
    repo = DummyRepo(get_result=category)

    def get_by_name(name):
        return SimpleNamespace(id=2, name=name)

    repo.get_by_name = get_by_name
    monkeypatch.setattr(module, "CategoryRepository", lambda db: repo)

    service = CategoryService(DummySession())

    with pytest.raises(ConflictError, match="Category with this name already exists"):
        service.update_category(1, SimpleNamespace(name="New", is_archived=None))
