from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.tags import TagCreate, TagResponse, TagUpdate
from app.services.tag_service import TagService

router = APIRouter(tags=["tags"])


@router.get("/tags", response_model=list[TagResponse])
def list_tags(db: Session = Depends(get_db)):
    return TagService(db).list_tags()


@router.post("/tags", response_model=TagResponse, status_code=201)
def create_tag(payload: TagCreate, db: Session = Depends(get_db)):
    return TagService(db).create_tag(payload)


@router.put("/tags/{tag_id}", response_model=TagResponse)
def update_tag(tag_id: int, payload: TagUpdate, db: Session = Depends(get_db)):
    return TagService(db).update_tag(tag_id, payload)


@router.patch("/tags/{tag_id}/archive", response_model=TagResponse)
def archive_tag(tag_id: int, db: Session = Depends(get_db)):
    return TagService(db).archive_tag(tag_id)


@router.patch("/tags/{tag_id}/unarchive", response_model=TagResponse)
def unarchive_tag(tag_id: int, db: Session = Depends(get_db)):
    return TagService(db).unarchive_tag(tag_id)
