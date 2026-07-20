from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routers.categories import router as categories_router
from app.api.routers.health import router as health_router
from app.api.routers.interview_results import router as interview_results_router
from app.api.routers.levels import router as levels_router
from app.api.routers.questions import router as questions_router
from app.api.routers.tags import router as tags_router
from app.core.database import init_db
from app.exceptions.handlers import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="QA Interview Assistant Backend", lifespan=lifespan)
register_exception_handlers(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(categories_router, prefix="/api")
app.include_router(levels_router, prefix="/api")
app.include_router(tags_router, prefix="/api")
app.include_router(questions_router, prefix="/api")
app.include_router(interview_results_router, prefix="/api")
