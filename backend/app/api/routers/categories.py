from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.categories import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.category_service import CategoryService

router = APIRouter(tags=["categories"])


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(is_archived: bool | None = None, db: Session = Depends(get_db)):
    return CategoryService(db).list_categories(is_archived=is_archived)


@router.post("/categories", response_model=CategoryRead, status_code=201)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return CategoryService(db).create_category(payload)


@router.put("/categories/{category_id}", response_model=CategoryRead)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db)):
    return CategoryService(db).update_category(category_id, payload)


@router.patch("/categories/{category_id}/archive", response_model=CategoryRead)
def archive_category(category_id: int, db: Session = Depends(get_db)):
    return CategoryService(db).archive_category(category_id)


@router.patch("/categories/{category_id}/unarchive", response_model=CategoryRead)
def unarchive_category(category_id: int, db: Session = Depends(get_db)):
    return CategoryService(db).unarchive_category(category_id)
