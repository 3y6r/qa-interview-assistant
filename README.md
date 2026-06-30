# QA Interview Assistant

Monorepo for the QA interview assistant MVP.

## Project Structure

- `backend/` - FastAPI backend for categories, levels, questions, tags, and interview results
- `frontend-v2/` - frontend application
- `mock-server-v2/` - mock server for local development

## Backend Quick Start

See [`backend/README.md`](backend/README.md) for full backend setup and API details.

Minimal backend run:

```powershell
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

Backend Swagger UI:

```text
http://127.0.0.1:8000/docs
```

## Notes

- The backend stores only the final interview result, not interview progress.
- SQLite is used by default through `DATABASE_URL=sqlite:///./app.db`.
- Default levels are seeded on startup.
