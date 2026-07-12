from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.exceptions.base import AppError


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_: Request, exc: RequestValidationError):
        message = exc.errors()[0]["msg"] if exc.errors() else "Invalid request"
        return JSONResponse(status_code=422, content={"detail": message})

    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(_: Request, exc: IntegrityError):
        message = "Database constraint violation"
        if "UNIQUE constraint failed" in str(exc.orig):
            message = "Entity with this value already exists"
        return JSONResponse(status_code=409, content={"detail": message})

    @app.exception_handler(Exception)
    async def unexpected_error_handler(_: Request, __: Exception):
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})
