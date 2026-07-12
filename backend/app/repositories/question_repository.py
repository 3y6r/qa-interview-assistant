from __future__ import annotations

from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.exceptions.base import NotFoundError
from app.models.question import Question
from app.models.question_tag import question_tags
from app.models.tag import Tag


class QuestionRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(
        self,
        *,
        text: str | None = None,
        category_id: int | None = None,
        level_id: int | None = None,
        is_archived: bool | None = None,
        tag_ids: list[int] | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> list[Question]:
        query = select(Question).order_by(Question.id)
        if text:
            query = query.where(Question.text.ilike(f"%{text}%"))
        if category_id is not None:
            query = query.where(Question.category_id == category_id)
        if level_id is not None:
            query = query.where(Question.level_id == level_id)
        if is_archived is not None:
            query = query.where(Question.is_archived == is_archived)
        if tag_ids:
            unique_ids = list(dict.fromkeys(tag_ids))
            tag_match_ids = (
                select(question_tags.c.question_id)
                .where(question_tags.c.tag_id.in_(unique_ids))
                .group_by(question_tags.c.question_id)
                .having(
                    func.count(func.distinct(question_tags.c.tag_id)) == len(unique_ids)
                )
            )
            query = query.where(Question.id.in_(tag_match_ids))
        if offset is not None:
            query = query.offset(offset)
        if limit is not None:
            query = query.limit(limit)
        return list(self.db.scalars(query).all())

    def get(self, question_id: int) -> Question | None:
        return self.db.get(Question, question_id)

    def create(self, question: Question, tag_ids: list[int] | None = None) -> Question:
        if tag_ids is not None:
            question.tags = self._load_tags(tag_ids)
        self.db.add(question)
        self.db.commit()
        self.db.refresh(question)
        return question

    def update(self, question: Question, tag_ids: list[int] | None = None) -> Question:
        if tag_ids is not None:
            question.tags = self._load_tags(tag_ids)
        self.db.commit()
        self.db.refresh(question)
        return question

    def delete(self, question: Question) -> None:
        self.db.execute(
            delete(question_tags).where(question_tags.c.question_id == question.id)
        )
        self.db.delete(question)
        self.db.commit()

    def _load_tags(self, tag_ids: list[int]) -> list[Tag]:
        unique_ids = list(dict.fromkeys(tag_ids))
        if not unique_ids:
            return []
        tags = list(self.db.scalars(select(Tag).where(Tag.id.in_(unique_ids))).all())
        if {tag.id for tag in tags} != set(unique_ids):
            raise NotFoundError("Tag not found")
        return tags
