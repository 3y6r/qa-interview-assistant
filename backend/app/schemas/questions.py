from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.tags import TagResponse


class QuestionCreate(BaseModel):
    text: str = Field(min_length=1)
    expected_answer: str = Field(min_length=1)
    category_id: int
    level_id: int
    tag_ids: list[int] | None = None


class QuestionUpdate(BaseModel):
    text: str | None = Field(default=None, min_length=1)
    expected_answer: str | None = Field(default=None, min_length=1)
    category_id: int | None = None
    level_id: int | None = None
    is_archived: bool | None = None
    tag_ids: list[int] | None = None


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    text: str
    expected_answer: str
    category_id: int
    level_id: int
    is_archived: bool
    created_at: datetime
    updated_at: datetime
    tags: list[TagResponse] = Field(default_factory=list)


class QuestionArchiveResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_archived: bool
