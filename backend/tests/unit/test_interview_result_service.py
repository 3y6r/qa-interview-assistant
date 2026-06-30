from datetime import date
from types import SimpleNamespace

import pytest

from app.exceptions.base import NotFoundError, ValidationError
from app.models.interview_result import InterviewResult
from app.services import interview_result_service as module
from app.services.interview_result_service import InterviewResultService

from tests.unit.helpers import DummyRepo, DummySession


def make_result():
    return InterviewResult(
        id=1,
        candidate_full_name="Ivan Ivanov",
        interview_date=date(2026, 1, 1),
        average_score=7.5,
        comment="Good candidate",
        created_at=None,
    )


def test_create_result_trims_and_creates(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "InterviewResultRepository", lambda db: repo)

    service = InterviewResultService(DummySession())
    result = service.create_result(
        SimpleNamespace(
            candidate_full_name="  Ivan Ivanov  ",
            interview_date=date(2026, 1, 1),
            average_score=7.5,
            comment="  Good candidate  ",
        )
    )

    assert result.candidate_full_name == "Ivan Ivanov"
    assert result.comment == "Good candidate"
    assert len(repo.created) == 1


def test_create_result_rejects_empty_fields(monkeypatch):
    repo = DummyRepo()
    monkeypatch.setattr(module, "InterviewResultRepository", lambda db: repo)

    service = InterviewResultService(DummySession())

    with pytest.raises(ValidationError, match="Candidate full name cannot be empty"):
        service.create_result(
            SimpleNamespace(
                candidate_full_name="   ",
                interview_date=date(2026, 1, 1),
                average_score=7.5,
                comment="Good candidate",
            )
        )

    with pytest.raises(ValidationError, match="Comment cannot be empty"):
        service.create_result(
            SimpleNamespace(
                candidate_full_name="Ivan Ivanov",
                interview_date=date(2026, 1, 1),
                average_score=7.5,
                comment="   ",
            )
        )


def test_get_result_missing_raises_not_found(monkeypatch):
    repo = DummyRepo(get_result=None)
    monkeypatch.setattr(module, "InterviewResultRepository", lambda db: repo)

    service = InterviewResultService(DummySession())

    with pytest.raises(NotFoundError, match="Interview result not found"):
        service.get_result(1)


def test_list_results_passes_filters(monkeypatch):
    repo = DummyRepo(list_result=[make_result()])
    monkeypatch.setattr(module, "InterviewResultRepository", lambda db: repo)

    service = InterviewResultService(DummySession())
    items = service.list_results(
        candidate_full_name="Ivan",
        date_from=date(2026, 1, 1),
        date_to=date(2026, 12, 31),
    )

    assert len(items) == 1
    assert repo.list_calls == [
        {
            "candidate_full_name": "Ivan",
            "date_from": date(2026, 1, 1),
            "date_to": date(2026, 12, 31),
        }
    ]
