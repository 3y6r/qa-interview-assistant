from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Text, func, text as sa_text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.question_tag import question_tags


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    expected_answer: Mapped[str] = mapped_column(Text, nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    level_id: Mapped[int] = mapped_column(ForeignKey("levels.id"), nullable=False, index=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default=sa_text("0"))
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    category = relationship("Category", back_populates="questions")
    level = relationship("Level", back_populates="questions")
    tags = relationship("Tag", secondary=question_tags, back_populates="questions")
