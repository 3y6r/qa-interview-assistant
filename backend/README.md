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

Gemini question generation uses `GEMINI_API_KEY` from the environment or `backend/.env`.
Optional model override:

```powershell
$env:GEMINI_MODEL="gemini-3.5-flash"
$env:GEMINI_TIMEOUT_SECONDS="60"
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
- `PATCH /api/categories/{id}/archive`
- `PATCH /api/categories/{id}/unarchive`
- `GET /api/levels`
- `GET /api/tags`
- `POST /api/tags`
- `PUT /api/tags/{id}`
- `PATCH /api/tags/{id}/archive`
- `PATCH /api/tags/{id}/unarchive`
- `GET /api/questions`
- `POST /api/questions`
- `POST /api/questions/generate`
- `GET /api/questions/{id}`
- `PUT /api/questions/{id}`
- `DELETE /api/questions/{id}`
- `PATCH /api/questions/{id}/archive`
- `PATCH /api/questions/{id}/unarchive`
- `GET /api/interview-results`
- `POST /api/interview-results`
- `GET /api/interview-results/{id}`
- `DELETE /api/interview-results/{id}`

## Notes

- The backend stores only the final interview result, not the interview process.
- `POST /api/interview-results` requires `candidate_full_name`, `position`, `interview_date`, `average_score`, and `comment`.
- Questions support many-to-many tags and can be filtered with `tag_ids=1,2`.
- `POST /api/questions/generate` requires `category_id` and `level_id`; `tag_ids`, `num_questions`, and `additional_text` are optional.
- `GET /api/categories`, `GET /api/tags`, and `GET /api/questions` support `is_archived=false` to return only non-archived items.
- `GET /api/questions` and `GET /api/interview-results` support `limit` and `offset` for pagination. Default `limit` is 20, maximum is 100.
- `PUT /api/tags/{id}` can update `name`, `color`, and `is_archived`.
- `PUT /api/questions/{id}` replaces tags only when `tag_ids` is provided.
- All errors are returned in the format:

```json
{ "detail": "Description of the error" }
```
