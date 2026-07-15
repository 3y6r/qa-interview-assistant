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
          <p style="margin-bottom: 14px;"><sub><b>Федор Зуенко</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-Project%20Manager-red" alt="Project Manager" />
      </td>
      <!-- 2. Романов Владимир (Frontend Developer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/LI0nelpeps1">
          <img src="https://github.com/LI0nelpeps1.png" width="85px;" style="border-radius: 50%;" alt="Романов Владимир"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Романов Владимир</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-Frontend%20Developer-00bcff" alt="Frontend Developer" />
      </td>
      <!-- 3. Иван Вишневский (Backend Developer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/ivanvishnevskii">
          <img src="https://github.com/ivanvishnevskii.png" width="85px;" style="border-radius: 50%;" alt="Иван Вишневский"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Иван Вишневский</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-Backend%20Developer-green" alt="Backend Developer" />
      </td>
      <!-- 4. Ефимов Аркадий (QA/AI Engineer) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/Sugi-GRW">
          <img src="https://github.com/Sugi-GRW.png" width="85px;" style="border-radius: 50%;" alt="Ефимов Аркадий"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Ефимов Аркадий</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-QA%2FAI%20Engineer-4A148C" alt="QA/AI Engineer" />
      </td>
       <!-- 5. Максим Карятников (DevOps) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/choppaofme-boop">
          <img src="https://github.com/choppaofme-boop.png" width="85px;" style="border-radius: 50%;" alt="Максим Карятников"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Максим Карятников</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-DevOps-2496ed" alt="DevOps" />
      </td>
      <!-- 6. Лефанов Алексей (Analyst) -->
      <td align="center" valign="top" width="14.2%">
        <a href="https://github.com/Lefan-ov">
          <img src="https://github.com/Lefan-ov.png" width="85px;" style="border-radius: 50%;" alt="Лефанов Алексей"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Лефанов Алексей</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-Analyst-yellow" alt="Analyst" />
      </td>
      <!-- 7. Сосульников Кирилл (QA Tester) -->
      <td align="center" valign="top" width="14.8%">
        <a href="https://github.com/Makyan228">
          <img src="https://github.com/Makyan228.png" width="85px;" style="border-radius: 50%;" alt="Сосульников Кирилл"/><br />
          <p style="margin-bottom: 14px;"><sub><b>Сосульников Кирилл</b></sub></p>
        </a>
        <img src="https://img.shields.io/badge/Role-QA%20Tester-orange" alt="QA Tester" />
      </td>
    </tr>
  </tbody>
</table>
