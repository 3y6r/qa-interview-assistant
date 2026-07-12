from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class InterviewResultCreate(BaseModel):
    candidate_full_name: str = Field(min_length=1, max_length=255)
    position: str = Field(min_length=1, max_length=255)
    interview_date: date
    average_score: float
    comment: str = Field(min_length=1)


class InterviewResultRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    candidate_full_name: str
    position: str
    interview_date: date
    average_score: float
    comment: str
    created_at: datetime
