from sqlalchemy.orm import Session

from app.repositories.level_repository import LevelRepository


class LevelService:
    def __init__(self, db: Session):
        self.repo = LevelRepository(db)

    def list_levels(self):
        return self.repo.list()
