from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class InterviewResult(Base):
    __tablename__ = "interview_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    candidate_full_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    interview_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    average_score: Mapped[float] = mapped_column(Float, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
