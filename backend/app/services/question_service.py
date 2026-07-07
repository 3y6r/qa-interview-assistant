from sqlalchemy.orm import Session

from app.exceptions.base import NotFoundError, ValidationError
from app.models.question import Question
from app.repositories.category_repository import CategoryRepository
from app.repositories.level_repository import LevelRepository
from app.repositories.question_repository import QuestionRepository
from app.schemas.questions import QuestionCreate, QuestionUpdate


class QuestionService:
    def __init__(self, db: Session):
        self.repo = QuestionRepository(db)
        self.category_repo = CategoryRepository(db)
        self.level_repo = LevelRepository(db)

    def list_questions(
        self,
        *,
        text=None,
        category_id=None,
        level_id=None,
        is_archived=None,
        tag_ids=None,
        limit=None,
        offset=None,
    ):
        kwargs = dict(
            text=text,
            category_id=category_id,
            level_id=level_id,
            is_archived=is_archived,
        )
        if tag_ids is not None:
            kwargs["tag_ids"] = tag_ids
        if limit is not None:
            kwargs["limit"] = limit
        if offset is not None:
            kwargs["offset"] = offset
        return self.repo.list(**kwargs)

    def get_question(self, question_id: int) -> Question:
        question = self.repo.get(question_id)
        if question is None:
            raise NotFoundError("Question not found")
        return question

    def create_question(self, payload: QuestionCreate) -> Question:
        text = payload.text.strip()
        expected_answer = payload.expected_answer.strip()
        if not text:
            raise ValidationError("Question text cannot be empty")
        if not expected_answer:
            raise ValidationError("Expected answer cannot be empty")
        self._validate_foreign_keys(payload.category_id, payload.level_id)
        return self.repo.create(
            Question(
                text=text,
                expected_answer=expected_answer,
                category_id=payload.category_id,
                level_id=payload.level_id,
            ),
            tag_ids=getattr(payload, "tag_ids", None),
        )

    def update_question(self, question_id: int, payload: QuestionUpdate) -> Question:
        question = self.get_question(question_id)
        if payload.text is not None:
            text = payload.text.strip()
            if not text:
                raise ValidationError("Question text cannot be empty")
            question.text = text
        if payload.expected_answer is not None:
            expected_answer = payload.expected_answer.strip()
            if not expected_answer:
                raise ValidationError("Expected answer cannot be empty")
            question.expected_answer = expected_answer
        if payload.category_id is not None:
            self._ensure_category_active(payload.category_id)
            question.category_id = payload.category_id
        if payload.level_id is not None:
            self._ensure_level_exists(payload.level_id)
            question.level_id = payload.level_id
        if payload.is_archived is not None:
            question.is_archived = payload.is_archived
        return self.repo.update(question, tag_ids=getattr(payload, "tag_ids", None))

    def archive_question(self, question_id: int) -> Question:
        question = self.get_question(question_id)
        question.is_archived = True
        return self.repo.update(question)

    def unarchive_question(self, question_id: int) -> Question:
        question = self.get_question(question_id)
        question.is_archived = False
        return self.repo.update(question)

    def delete_question(self, question_id: int) -> None:
        question = self.repo.get(question_id)
        if question is None:
            raise NotFoundError("Question not found")
        self.repo.delete(question)

    def _validate_foreign_keys(self, category_id: int, level_id: int) -> None:
        self._ensure_category_active(category_id)
        self._ensure_level_exists(level_id)

    def _ensure_category_exists(self, category_id: int) -> None:
        if self.category_repo.get(category_id) is None:
            raise NotFoundError("Category not found")

    def _ensure_category_active(self, category_id: int) -> None:
        category = self.category_repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found")
        if category.is_archived:
            raise ValidationError("Category is archived")

    def _ensure_level_exists(self, level_id: int) -> None:
        if self.level_repo.get(level_id) is None:
            raise NotFoundError("Level not found")
