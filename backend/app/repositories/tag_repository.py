from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.tag import Tag


class TagRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, tag: Tag) -> Tag:
        self.db.add(tag)
        self.db.commit()
        self.db.refresh(tag)
        return tag

    def get_all(self) -> list[Tag]:
        return list(self.db.scalars(select(Tag).order_by(Tag.id)).all())

    def get_by_id(self, tag_id: int) -> Tag | None:
        return self.db.get(Tag, tag_id)

    def get_by_name(self, name: str) -> Tag | None:
        return self.db.scalar(select(Tag).where(Tag.name == name))

    def get_by_ids(self, tag_ids: list[int]) -> list[Tag]:
        unique_ids = list(dict.fromkeys(tag_ids))
        if not unique_ids:
            return []
        return list(self.db.scalars(select(Tag).where(Tag.id.in_(unique_ids))).all())

    def update(self, tag: Tag) -> Tag:
        self.db.commit()
        self.db.refresh(tag)
        return tag
