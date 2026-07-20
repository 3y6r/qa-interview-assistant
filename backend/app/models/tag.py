from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func, text as sa_text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.question_tag import question_tags


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    is_archived: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default=sa_text("false")
    )
    color: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        default="#808080",
        server_default=sa_text("'#808080'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.now()
    )

    questions = relationship("Question", secondary=question_tags, back_populates="tags")
