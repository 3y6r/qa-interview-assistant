from sqlalchemy import Column, ForeignKey, Table

from app.models.base import Base


question_tags = Table(
    "question_tags",
    Base.metadata,
    Column(
        "question_id", ForeignKey("questions.id", ondelete="CASCADE"), primary_key=True
    ),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)
