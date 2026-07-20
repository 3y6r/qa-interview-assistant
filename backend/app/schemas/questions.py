from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator

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


class QuestionGenerationRequest(BaseModel):
    category_id: int
    level_id: int
    tag_ids: list[int] | None = None
    num_questions: int = Field(default=1, ge=1, le=10)
    additional_text: str | None = Field(default=None, max_length=2000)

    @model_validator(mode="after")
    def normalize_tag_ids(self):
        if self.tag_ids is not None:
            self.tag_ids = list(dict.fromkeys(self.tag_ids))
        if self.additional_text is not None:
            self.additional_text = self.additional_text.strip() or None
        return self


class GeneratedQuestionTag(BaseModel):
    id: int
    name: str


class GeneratedQuestionItem(BaseModel):
    text: str = Field(min_length=1, max_length=500)
    expected_answer: str = Field(min_length=1, max_length=2000)
    category_id: int
    category_name: str
    level_id: int
    level_name: str
    tags: list[GeneratedQuestionTag] = Field(default_factory=list)


class QuestionGenerationResponse(BaseModel):
    questions: list[GeneratedQuestionItem]
