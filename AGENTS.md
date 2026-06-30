# Repository Guide

## Scope

This repository contains three main parts:

- `backend/` - FastAPI MVP backend for QA interview data
- `frontend/` - frontend application
- `mock-server/` - lightweight Node-based mock server

## Working Rules

- Prefer small, local changes that match the existing code style.
- Do not rename or move files unless the task explicitly requires it.
- Never use destructive git or filesystem commands unless explicitly requested.
- Keep backend business logic in the service layer, persistence in repositories, and request handling in routers.
- Preserve the current API contract unless the user asks for a breaking change.

## Backend

Backend is the source of truth for the MVP interview domain.

Current backend stack:

- Python 3.12
- FastAPI
- SQLAlchemy
- Pydantic
- Poetry
- SQLite by default through `DATABASE_URL`

Backend layout:

- `app/main.py` - FastAPI app entrypoint
- `app/api/routers/` - REST endpoints
- `app/services/` - business logic
- `app/repositories/` - database access
- `app/models/` - SQLAlchemy models
- `app/schemas/` - Pydantic schemas
- `app/core/` - config and database setup
- `tests/` - unit tests and lightweight API checks

Backend run:

```powershell
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

Backend tests:

```powershell
cd backend
poetry run pytest -q
```

Backend notes:

- Default levels are seeded on startup.
- Swagger UI is available at `/docs`.
- Errors should return `{ "detail": "..." }`.
- The MVP stores only the final interview result, not the interview process.

## Mock Server

The mock server is a separate Node project and should be treated independently from the FastAPI backend.

Typical run:

```powershell
cd mock-server
npm install
npm start
```

## Frontend

The frontend is a separate app under `frontend/`. When editing it, follow the existing frontend conventions and avoid changing backend contracts unless necessary.

## Documentation

- Update `README.md` files when commands, endpoints, or project structure change.
- Keep instructions portable. Avoid machine-specific absolute paths in docs.

## Validation

Before finishing backend changes, verify:

- the code still starts
- relevant unit tests pass
- API responses match the documented contract
