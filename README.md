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




### Contributors

<table>
  <tbody>
    <tr>
      <!-- 1. Федор Зуенко (Project Manager) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/zubr1337">
          <img src="https://github.com/zubr1337.png" width="85px;" style="border-radius: 50%;" alt="Федор Зуенко"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Федор Зуенко</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-Project%20Manager-red" alt="Project Manager" />
      </td>
      <!-- 2. Романов Владимир (Frontend Developer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/LI0nelpeps1">
          <img src="https://github.com/LI0nelpeps1.png" width="85px;" style="border-radius: 50%;" alt="Романов Владимир"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Романов Владимир</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-Frontend%20Developer-00bcff" alt="Frontend Developer" />
      </td>
      <!-- 3. Иван Вишневский (Backend Developer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/ivanvishnevskii">
          <img src="https://github.com/ivanvishnevskii.png" width="85px;" style="border-radius: 50%;" alt="Иван Вишневский"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Иван Вишневский</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-Backend%20Developer-green" alt="Backend Developer" />
      </td>
      <!-- 4. Ефимов Аркадий (QA/AI Engineer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/Sugi-GRW">
          <img src="https://github.com/Sugi-GRW.png" width="85px;" style="border-radius: 50%;" alt="Ефимов Аркадий"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Ефимов Аркадий</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-QA%2FAI%20Engineer-4A148C" alt="QA/AI Engineer" />
      </td>
      <!-- 5. Лефанов Алексей (Analyst) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/reynamane">
          <img src="https://github.com/reynamane.png" width="85px;" style="border-radius: 50%;" alt="Лефанов Алексей"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Лефанов Алексей</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-Analyst-yellow" alt="Analyst" />
      </td>
      <!-- 6. Максим Карятников (DevOps) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/Choppaofme">
          <img src="https://github.com/Choppaofme.png" width="85px;" style="border-radius: 50%;" alt="Максим Карятников"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Максим Карятников</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-DevOps-2496ed" alt="DevOps" />
      </td>
      <!-- 7. Сосульников Кирилл (QA Tester) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/kyril2283337">
          <img src="https://github.com/kyril2283337.png" width="85px;" style="border-radius: 50%;" alt="Сосульников Кирилл"/><br />
          <div style="min-height: 48px; display: flex; align-items: center; justify-content: center;">
            <sub><b>Сосульников Кирилл</b></sub>
          </div>
        </a>
        <img src="https://img.shields.io/badge/Role-QA%20Tester-orange" alt="QA Tester" />
      </td>
    </tr>
  </tbody>
</table>
