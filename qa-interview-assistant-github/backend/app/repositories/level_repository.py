from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.level import Level


class LevelRepository:
    def __init__(self, db: Session):
        self.db = db

    def list(self) -> list[Level]:
        return list(self.db.scalars(select(Level).order_by(Level.id)).all())

    def get(self, level_id: int) -> Level | None:
        return self.db.get(Level, level_id)
