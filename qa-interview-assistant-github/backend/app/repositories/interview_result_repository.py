from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.interview_result import InterviewResult


class InterviewResultRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        candidate_full_name: str | None = None,
        date_from=None,
        date_to=None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[InterviewResult]:
        query = select(InterviewResult).order_by(InterviewResult.id)
        if candidate_full_name:
            query = query.where(InterviewResult.candidate_full_name.ilike(f"%{candidate_full_name}%"))
        if date_from is not None:
            query = query.where(InterviewResult.interview_date >= date_from)
        if date_to is not None:
            query = query.where(InterviewResult.interview_date <= date_to)
        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        return list(self.db.scalars(query).all())

    def get(self, result_id: int) -> InterviewResult | None:
        return self.db.get(InterviewResult, result_id)

    def create(self, result: InterviewResult) -> InterviewResult:
        self.db.add(result)
        self.db.commit()
        self.db.refresh(result)
        return result
