from fastapi import APIRouter, Depends
from fastapi import Query
from sqlalchemy.orm import Session

from app.exceptions.base import ValidationError
from app.core.database import get_db
from app.schemas.questions import QuestionArchiveResponse, QuestionCreate, QuestionRead, QuestionUpdate
from app.services.question_service import QuestionService

router = APIRouter(tags=["questions"])


def _parse_tag_ids(raw_tag_ids: str | None) -> list[int] | None:
    if raw_tag_ids is None:
        return None
    parts = [part.strip() for part in raw_tag_ids.split(",") if part.strip()]
    if not parts:
        return None
    try:
        return [int(part) for part in parts]
    except ValueError as exc:
        raise ValidationError("Invalid tag_ids") from exc


@router.get("/questions", response_model=list[QuestionRead])
def list_questions(
    text: str | None = None,
    category_id: int | None = None,
    level_id: int | None = None,
    is_archived: bool | None = None,
    tag_ids: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return QuestionService(db).list_questions(
        text=text,
        category_id=category_id,
        level_id=level_id,
        is_archived=is_archived,
        tag_ids=_parse_tag_ids(tag_ids),
        limit=limit,
        offset=offset,
    )


@router.post("/questions", response_model=QuestionRead, status_code=201)
def create_question(payload: QuestionCreate, db: Session = Depends(get_db)):
    return QuestionService(db).create_question(payload)


@router.get("/questions/{question_id}", response_model=QuestionRead)
def get_question(question_id: int, db: Session = Depends(get_db)):
    return QuestionService(db).get_question(question_id)


@router.put("/questions/{question_id}", response_model=QuestionRead)
def update_question(question_id: int, payload: QuestionUpdate, db: Session = Depends(get_db)):
    return QuestionService(db).update_question(question_id, payload)


@router.patch("/questions/{question_id}/archive", response_model=QuestionArchiveResponse)
def archive_question(question_id: int, db: Session = Depends(get_db)):
    return QuestionService(db).archive_question(question_id)


@router.delete("/questions/{question_id}", status_code=204)
def delete_question(question_id: int, db: Session = Depends(get_db)):
    QuestionService(db).delete_question(question_id)
