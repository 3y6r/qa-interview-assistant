from types import SimpleNamespace

import pytest

from app.exceptions.base import ConflictError, NotFoundError, ValidationError
from app.models.tag import Tag
from app.services import tag_service as module
from app.services.tag_service import TagService

from tests.unit.helpers import DummyRepo, DummySession


def test_list_tags_uses_repository(monkeypatch):
    repo = DummyRepo(
        list_result=[Tag(id=1, name="SQL", color="#FF5733", is_archived=False)]
    )
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    tags = service.list_tags()

    assert len(tags) == 1
    assert repo.get_all_calls == 1


def test_list_tags_passes_archive_filter(monkeypatch):
    repo = DummyRepo(
        list_result=[Tag(id=1, name="SQL", color="#FF5733", is_archived=False)]
    )
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    tags = service.list_tags(is_archived=False)

    assert len(tags) == 1
    assert repo.get_all_calls == 1
    assert repo.get_all_calls_kwargs == [{"is_archived": False}]


def test_create_tag_defaults_color_and_trims_name(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    result = service.create_tag(SimpleNamespace(name="  SQL  ", color=None))

    assert result.name == "SQL"
    assert result.color == "#808080"
    assert result.is_archived is False
    assert repo.created[0].color == "#808080"


def test_create_tag_rejects_invalid_color(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())

    with pytest.raises(ValidationError, match="Invalid HEX color"):
        service.create_tag(SimpleNamespace(name="SQL", color="blue"))


def test_create_tag_rejects_duplicate_name(monkeypatch):
    repo = DummyRepo(
        get_result=Tag(id=1, name="SQL", color="#FF5733", is_archived=False)
    )
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())

    with pytest.raises(ConflictError, match="Tag with this name already exists"):
        service.create_tag(SimpleNamespace(name="SQL", color="#FF5733"))


def test_update_tag_updates_name_and_color(monkeypatch):
    tag = Tag(id=1, name="SQL", color="#808080", is_archived=False)
    repo = DummyRepo(get_result=tag)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    result = service.update_tag(
        1, SimpleNamespace(name="  Databases  ", color="#33AAFF")
    )

    assert result.name == "Databases"
    assert result.color == "#33AAFF"
    assert repo.updated == [tag]


def test_update_tag_can_archive(monkeypatch):
    tag = Tag(id=1, name="SQL", color="#808080", is_archived=False)
    repo = DummyRepo(get_result=tag)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    result = service.update_tag(
        1, SimpleNamespace(name=None, color=None, is_archived=True)
    )

    assert result.is_archived is True
    assert repo.updated == [tag]


def test_archive_tag_sets_flag(monkeypatch):
    tag = Tag(id=1, name="SQL", color="#808080", is_archived=False)
    repo = DummyRepo(get_result=tag)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    result = service.archive_tag(1)

    assert result.is_archived is True
    assert repo.updated == [tag]


def test_unarchive_tag_sets_flag(monkeypatch):
    tag = Tag(id=1, name="SQL", color="#808080", is_archived=True)
    repo = DummyRepo(get_result=tag)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())
    result = service.unarchive_tag(1)

    assert result.is_archived is False
    assert repo.updated == [tag]


def test_unarchive_tag_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())

    with pytest.raises(NotFoundError, match="Tag not found"):
        service.unarchive_tag(1)

    assert repo.updated == []


def test_update_tag_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "TagRepository", lambda db: repo)

    service = TagService(DummySession())

    with pytest.raises(NotFoundError, match="Tag not found"):
        service.update_tag(1, SimpleNamespace(name=None, color=None))
