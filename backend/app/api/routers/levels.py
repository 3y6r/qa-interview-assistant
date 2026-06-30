from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.levels import LevelRead
from app.services.level_service import LevelService

router = APIRouter(tags=["levels"])


@router.get("/levels", response_model=list[LevelRead])
def list_levels(db: Session = Depends(get_db)):
    return LevelService(db).list_levels()
