from sqlalchemy.orm import Session

from app.exceptions.base import ConflictError, NotFoundError, ValidationError
from app.models.category import Category
from app.repositories.category_repository import CategoryRepository
from app.schemas.categories import CategoryCreate, CategoryUpdate


class CategoryService:
    def __init__(self, db: Session):
        self.repo = CategoryRepository(db)

    def list_categories(self):
        return self.repo.list()

    def create_category(self, payload: CategoryCreate) -> Category:
        name = payload.name.strip()
        if not name:
            raise ValidationError("Category name cannot be empty")
        if self.repo.get_by_name(name):
            raise ConflictError("Category with this name already exists")
        return self.repo.create(Category(name=name))

    def update_category(self, category_id: int, payload: CategoryUpdate) -> Category:
        category = self.repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found")

        if payload.name is not None:
            name = payload.name.strip()
            if not name:
                raise ValidationError("Category name cannot be empty")
            existing = self.repo.get_by_name(name)
            if existing and existing.id != category.id:
                raise ConflictError("Category with this name already exists")
            category.name = name
        if payload.is_archived is not None:
            category.is_archived = payload.is_archived
        return self.repo.update(category)

    def archive_category(self, category_id: int) -> Category:
        category = self.repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found")
        category.is_archived = True
        return self.repo.update(category)

    def unarchive_category(self, category_id: int) -> Category:
        category = self.repo.get(category_id)
        if category is None:
            raise NotFoundError("Category not found")
        category.is_archived = False
        return self.repo.update(category)
