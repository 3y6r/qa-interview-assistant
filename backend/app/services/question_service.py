from sqlalchemy.orm import Session

from app.exceptions.base import NotFoundError, ValidationError
from app.models.question import Question
from app.repositories.category_repository import CategoryRepository
from app.repositories.level_repository import LevelRepository
from app.repositories.question_repository import QuestionRepository
from app.repositories.tag_repository import TagRepository
from app.schemas.questions import GeneratedQuestionItem, GeneratedQuestionTag, QuestionGenerationResponse
from app.schemas.questions import QuestionCreate, QuestionUpdate
from app.services.gemini_question_generator import GeminiQuestionGenerator, GeminiQuestionItem


class QuestionService:
    def __init__(self, db: Session, question_generator: GeminiQuestionGenerator | None = None):
        self.repo = QuestionRepository(db)
        self.category_repo = CategoryRepository(db)
        self.level_repo = LevelRepository(db)
        self.tag_repo = TagRepository(db)
        self.question_generator = question_generator or GeminiQuestionGenerator()

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

    def generate_questions(self, payload) -> QuestionGenerationResponse:
        category = self._get_active_category(payload.category_id)
        level = self.level_repo.get(payload.level_id)
        if level is None:
            raise NotFoundError("Level not found")

        tags = self._load_tags(getattr(payload, "tag_ids", None) or [])
        tag_names = [tag.name for tag in tags]
        existing_questions = [
            question.text
            for question in self.repo.list(
                category_id=category.id,
                level_id=level.id,
                tag_ids=[tag.id for tag in tags] or None,
                is_archived=False,
                limit=100,
            )
        ]

        generated = self.question_generator.generate_questions(
            category=category.name,
            level=level.name,
            tags=tag_names,
            num_questions=payload.num_questions,
            existing_questions=existing_questions,
            additional_text=getattr(payload, "additional_text", None),
        )
        if len(generated.questions) != payload.num_questions:
            raise ValidationError("Gemini response questions count does not match request")

        return QuestionGenerationResponse(
            questions=[
                self._build_generated_question_response(
                    item,
                    category_id=category.id,
                    category_name=category.name,
                    level_id=level.id,
                    level_name=level.name,
                    tags=tags,
                    expected_tag_names=tag_names,
                )
                for item in generated.questions
            ]
        )

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

    def _get_active_category(self, category_id: int):
        category = self.category_repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found")
        if category.is_archived:
            raise ValidationError("Category is archived")
        return category

    def _load_tags(self, tag_ids: list[int]):
        if not tag_ids:
            return []
        tags = self.tag_repo.get_by_ids(tag_ids)
        if {tag.id for tag in tags} != set(tag_ids):
            raise NotFoundError("Tag not found")
        return tags

    def _build_generated_question_response(
        self,
        item: GeminiQuestionItem,
        *,
        category_id: int,
        category_name: str,
        level_id: int,
        level_name: str,
        tags,
        expected_tag_names: list[str],
    ) -> GeneratedQuestionItem:
        if item.category != category_name:
            raise ValidationError("Gemini response category does not match request")
        if item.level != level_name:
            raise ValidationError("Gemini response level does not match request")
        if expected_tag_names and item.tags != expected_tag_names:
            raise ValidationError("Gemini response tags do not match request")
        return GeneratedQuestionItem(
            text=item.question,
            expected_answer=item.answer,
            category_id=category_id,
            category_name=category_name,
            level_id=level_id,
            level_name=level_name,
            tags=[GeneratedQuestionTag(id=tag.id, name=tag.name) for tag in tags],
        )
