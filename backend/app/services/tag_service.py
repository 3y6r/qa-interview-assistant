import re

from sqlalchemy.orm import Session

from app.exceptions.base import ConflictError, NotFoundError, ValidationError
from app.models.tag import Tag
from app.repositories.tag_repository import TagRepository
from app.schemas.tags import TagCreate, TagUpdate

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class TagService:
    def __init__(self, db: Session):
        self.repo = TagRepository(db)

    def list_tags(self):
        return self.repo.get_all()

    def create_tag(self, payload: TagCreate) -> Tag:
        name = payload.name.strip()
        if not name:
            raise ValidationError("Tag name cannot be empty")
        if self.repo.get_by_name(name):
            raise ConflictError("Tag with this name already exists")
        color = self._normalize_color(payload.color)
        return self.repo.create(Tag(name=name, color=color, is_archived=False))

    def update_tag(self, tag_id: int, payload: TagUpdate) -> Tag:
        tag = self.repo.get_by_id(tag_id)
        if tag is None:
            raise NotFoundError("Tag not found")

        if payload.name is not None:
            name = payload.name.strip()
            if not name:
                raise ValidationError("Tag name cannot be empty")
            existing = self.repo.get_by_name(name)
            if existing and existing.id != tag.id:
                raise ConflictError("Tag with this name already exists")
            tag.name = name

        if payload.color is not None:
            tag.color = self._normalize_color(payload.color)
        is_archived = getattr(payload, "is_archived", None)
        if is_archived is not None:
            tag.is_archived = is_archived
        return self.repo.update(tag)

    def archive_tag(self, tag_id: int) -> Tag:
        tag = self.repo.get_by_id(tag_id)
        if tag is None:
            raise NotFoundError("Tag not found")
        tag.is_archived = True
        return self.repo.update(tag)

    def _normalize_color(self, color: str | None) -> str:
        if color is None:
            return "#808080"
        normalized = color.strip()
        if not HEX_COLOR_RE.match(normalized):
            raise ValidationError("Invalid HEX color")
        return normalized
