# QA Interview Assistant

Репозиторий для проведения QA-собеседований.

## Структура

- `frontend/` - фронтенд приложения
- `backend/` - FastAPI backend для справочников, тегов и итогов интервью

## Требования

- Node.js 20+
- Python 3.12 для backend
- Poetry для backend

## Быстрый старт

### Frontend

```bash
git clone -b develop https://github.com/3y6r/qa-interview-assistant.git
cd qa-interview-assistant
cd frontend
npm install && npm run dev
```

- Фронтенд: http://localhost:3001

### Backend

Подробная инструкция находится в [`backend/README.md`](backend/README.md).

Краткий запуск:

```powershell
cd qa-interview-assistant
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

Backend Swagger UI:

```text
http://127.0.0.1:8000/docs
```

## Примечания

- Backend хранит только итог интервью, а не процесс прохождения.
- SQLite используется по умолчанию через `DATABASE_URL=sqlite:///./app.db`.
- Уровни создаются автоматически при старте backend.
