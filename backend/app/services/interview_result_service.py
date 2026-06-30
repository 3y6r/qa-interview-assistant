from datetime import date

from sqlalchemy.orm import Session

from app.exceptions.base import NotFoundError, ValidationError
from app.models.interview_result import InterviewResult
from app.repositories.interview_result_repository import InterviewResultRepository
from app.schemas.interview_results import InterviewResultCreate


class InterviewResultService:
    def __init__(self, db: Session):
        self.repo = InterviewResultRepository(db)

    def list_results(self, *, candidate_full_name=None, date_from=None, date_to=None):
        return self.repo.list(candidate_full_name=candidate_full_name, date_from=date_from, date_to=date_to)

    def get_result(self, result_id: int) -> InterviewResult:
        result = self.repo.get(result_id)
        if result is None:
            raise NotFoundError("Interview result not found")
        return result

    def create_result(self, payload: InterviewResultCreate) -> InterviewResult:
        candidate_full_name = payload.candidate_full_name.strip()
        comment = payload.comment.strip()
        if not candidate_full_name:
            raise ValidationError("Candidate full name cannot be empty")
        if not comment:
            raise ValidationError("Comment cannot be empty")
        return self.repo.create(
            InterviewResult(
                candidate_full_name=candidate_full_name,
                interview_date=payload.interview_date,
                average_score=payload.average_score,
                comment=comment,
            )
        )
