from datetime import date

from fastapi import APIRouter, Depends
from fastapi import Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.interview_results import InterviewResultCreate, InterviewResultRead
from app.services.interview_result_service import InterviewResultService

router = APIRouter(tags=["interview-results"])


@router.get("/interview-results", response_model=list[InterviewResultRead])
def list_interview_results(
    candidate_full_name: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    return InterviewResultService(db).list_results(
        candidate_full_name=candidate_full_name,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )


@router.post("/interview-results", response_model=InterviewResultRead, status_code=201)
def create_interview_result(payload: InterviewResultCreate, db: Session = Depends(get_db)):
    return InterviewResultService(db).create_result(payload)


@router.get("/interview-results/{result_id}", response_model=InterviewResultRead)
def get_interview_result(result_id: int, db: Session = Depends(get_db)):
    return InterviewResultService(db).get_result(result_id)
