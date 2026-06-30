# Backend Quick Start

FastAPI backend for QA interview assistant MVP.

## Requirements

- Python 3.12
- Poetry

This project uses an in-project virtual environment at `backend/.venv`.

## Install

```powershell
cd backend
poetry install
```

If Poetry is not available in `PATH`, install it with the official Poetry installer or make sure the Poetry executable is added to your shell `PATH`.

## Run

```powershell
poetry run uvicorn app.main:app --reload
```

## Swagger UI

- Swagger UI: `http://127.0.0.1:8000/docs`
- OpenAPI JSON: `http://127.0.0.1:8000/openapi.json`
- Health check: `http://127.0.0.1:8000/api/health`

## Database

Default database:

```text
sqlite:///./app.db
```

You can override it with `DATABASE_URL`:

```powershell
$env:DATABASE_URL="sqlite:///./app.db"
poetry run uvicorn app.main:app --reload
```

## Seed Data

On startup the app creates default levels:

- Trainee
- Junior
- Middle
- Senior
- Lead

## Main Endpoints

- `GET /api/health`
- `GET /api/categories`
- `POST /api/categories`
- `PUT /api/categories/{id}`
- `GET /api/levels`
- `GET /api/tags`
- `POST /api/tags`
- `PUT /api/tags/{id}`
- `PATCH /api/tags/{id}/archive`
- `GET /api/questions`
- `POST /api/questions`
- `GET /api/questions/{id}`
- `PUT /api/questions/{id}`
- `DELETE /api/questions/{id}`
- `PATCH /api/questions/{id}/archive`
- `GET /api/interview-results`
- `POST /api/interview-results`
- `GET /api/interview-results/{id}`

## Notes

- The backend stores only the final interview result, not the interview process.
- Questions support many-to-many tags and can be filtered with `tag_ids=1,2`.
- `PUT /api/tags/{id}` can update `name`, `color`, and `is_archived`.
- `PUT /api/questions/{id}` replaces tags only when `tag_ids` is provided.
- All errors are returned in the format:

```json
{ "detail": "Description of the error" }
```
