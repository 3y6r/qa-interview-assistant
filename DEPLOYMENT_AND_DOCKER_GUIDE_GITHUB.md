# QA Interview Assistant — Docker, PostgreSQL и развёртывание на VPS

> Актуализировано: 13 июля 2026 года  
> Актуальная ветка инфраструктуры: `feature/PB-7-PB-9-postgresql-docker`

Документ описывает текущую Docker-архитектуру QA Interview Assistant, локальный запуск, production-развёртывание на VPS, работу с PostgreSQL, подключение pgAdmin, загрузку тестовых данных, резервное копирование и обслуживание базы.

---

## 1. Актуальная архитектура проекта

Проект состоит из трёх основных сервисов:

```text
Frontend   — React 19 + TypeScript + Vite + Ant Design
Backend    — FastAPI + SQLAlchemy 2 + Python 3.12
Database   — PostgreSQL 16
```

AI-генерация вопросов выполняется на backend через Gemini API.

### 1.1. Локальные контейнеры

```text
qa_interview_frontend
qa_interview_backend
qa_interview_postgres
```

### 1.2. Production-контейнеры

```text
qa_interview_frontend_prod
qa_interview_backend_prod
qa_interview_postgres_prod
```

### 1.3. Production-схема

```text
Браузер
   ↓
http://<SERVER_IP>:8080
   ↓
Nginx внутри frontend-контейнера
   ├── статические файлы React
   └── /api/* → backend:8000
                       ↓
                 PostgreSQL:5432
```

В production:

- наружу публикуется только frontend;
- backend доступен только внутри Docker-сети;
- PostgreSQL доступен контейнерам по `db:5432`;
- для pgAdmin PostgreSQL привязан только к `127.0.0.1:15432` на VPS;
- Docker-логи ограничены до трёх файлов по 10 МБ на контейнер;
- backend и PostgreSQL имеют healthcheck.

---

## 2. Структура репозитория

Актуальная структура:

```text
qa-interview-assistant/
├── backend/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── poetry.lock
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── Dockerfile.prod
│   ├── nginx.conf
│   ├── package.json
│   └── package-lock.json
├── deploy/
│   ├── scripts/
│   │   └── qa-category-cleanup.sh
│   └── systemd/
│       ├── qa-category-cleanup.service
│       └── qa-category-cleanup.timer
├── sql/
│   └── cleanup_unused_archived_categories.sql
├── seed_mock_data.sql
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

В репозитории не должно быть:

```text
.env
дампов PostgreSQL
реальных данных кандидатов
Gemini API key
паролей
node_modules
.venv
dist
Docker volumes
серверных экспортов
```

---

## 3. Актуальная модель данных

Основные таблицы:

```text
levels
categories
tags
questions
question_tags
interview_results
```

### 3.1. Уровни

При запуске backend автоматически создаются:

```text
Trainee
Junior
Middle
Senior
Lead
```

### 3.2. Категории

Таблица `categories` содержит:

```text
id
name
is_archived
created_at
```

Удаление категории в пользовательском интерфейсе является логическим: категория архивируется через `is_archived = true`.

### 3.3. Теги

Таблица `tags` содержит:

```text
id
name
color
is_archived
created_at
```

Связь вопросов и тегов — многие-ко-многим через `question_tags`.

### 3.4. Вопросы

Таблица `questions` содержит:

```text
id
text
expected_answer
category_id
level_id
is_archived
created_at
updated_at
```

### 3.5. Результаты интервью

Таблица `interview_results` содержит:

```text
id
candidate_full_name
position
interview_date
average_score
comment
created_at
```

Backend сохраняет итог интервью, а не промежуточный процесс его прохождения.

---

## 4. Инициализация схемы базы

Alembic в текущей версии не используется.

При запуске FastAPI выполняются:

```python
Base.metadata.create_all(bind=engine)
sync_schema()
seed_levels(db)
```

Это означает:

1. отсутствующие таблицы создаются автоматически;
2. отдельные недостающие колонки добавляются через `sync_schema()`;
3. стандартные уровни добавляются автоматически.

`create_all()` не заменяет полноценную систему миграций. При дальнейшем развитии схемы рекомендуется подключить Alembic.

---

## 5. Переменные окружения

В корне проекта создаётся `.env` на основе `.env.example`.

### 5.1. Актуальный `.env.example`

```env
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=change_me_strong_password

DATABASE_URL=postgresql+psycopg://qa_user:change_me_strong_password@db:5432/qa_interview_db

BACKEND_PORT=8000
FRONTEND_PORT=3001

VITE_API_BASE_URL=http://localhost:8000/api

GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_SECONDS=60
```

Для production обычно используется:

```env
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=<СЛОЖНЫЙ_ПАРОЛЬ>

FRONTEND_PORT=8080

GEMINI_API_KEY=<GEMINI_API_KEY>
GEMINI_MODEL=gemini-3.5-flash
GEMINI_TIMEOUT_SECONDS=60
```

### 5.2. Важное замечание

Backend использует именно:

```text
GEMINI_API_KEY
```

Переменная:

```text
AI_API_KEY
```

устарела и не должна использоваться в `.env`, `.env.example` и Docker Compose.

### 5.3. Защита `.env`

```bash
chmod 600 .env
```

Нельзя выводить `.env` в публичный лог, демонстрировать его на экране или загружать в GitHub.

---

## 6. Локальный запуск через Docker Compose

### 6.1. Требования

```text
Docker Desktop
Docker Compose v2
Git
```

На Windows Docker Desktop должен быть запущен.

Проверка:

```bash
docker --version
docker compose version
```

### 6.2. Подготовка

Перейдите в корень репозитория:

```bash
cd <PROJECT_DIR>
```

Создайте `.env`:

```bash
cp .env.example .env
```

В Windows CMD:

```cmd
copy .env.example .env
```

Проверьте Compose:

```bash
docker compose --env-file .env -f docker-compose.yml config
```

### 6.3. Сборка и запуск

```bash
docker compose --env-file .env -f docker-compose.yml up --build -d
```

Проверка:

```bash
docker compose --env-file .env -f docker-compose.yml ps
```

### 6.4. Локальные адреса

```text
Frontend:        http://localhost:3001
Backend Swagger: http://localhost:8000/docs
OpenAPI:         http://localhost:8000/openapi.json
API health:      http://localhost:8000/api/health
PostgreSQL:      127.0.0.1:15432
```

### 6.5. Логи

```bash
docker compose logs frontend
docker compose logs backend
docker compose logs db
```

Последние 100 строк backend:

```bash
docker compose logs --tail=100 backend
```

Следить за логами:

```bash
docker compose logs -f backend
```

### 6.6. Остановка

Без удаления базы:

```bash
docker compose down
```

С удалением PostgreSQL volume:

```bash
docker compose down -v
```

> `down -v` полностью удаляет данные локальной базы. Используйте только при намеренном пересоздании БД.

---

## 7. Запуск без Docker

### 7.1. Backend

Требования:

```text
Python 3.12
Poetry
```

Запуск:

```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```

По умолчанию без `DATABASE_URL` backend использует:

```text
sqlite:///./app.db
```

Для PostgreSQL задайте `DATABASE_URL`.

PowerShell:

```powershell
$env:DATABASE_URL="postgresql+psycopg://qa_user:qa_password@localhost:15432/qa_interview_db"
poetry run uvicorn app.main:app --reload
```

### 7.2. Frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend:

```text
http://localhost:3001
```

---

## 8. Production Docker Compose

Актуальная production-конфигурация:

```yaml
name: qa_interview_assistant

x-default-logging: &default-logging
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"

services:
  db:
    image: postgres:16-alpine
    container_name: qa_interview_postgres_prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "127.0.0.1:15432:5432"
    volumes:
      - qa_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 12
    logging: *default-logging
    stop_grace_period: 30s

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    image: qa-interview-assistant-backend:latest
    container_name: qa_interview_backend_prod
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GEMINI_MODEL: ${GEMINI_MODEL:-gemini-3.5-flash}
      GEMINI_TIMEOUT_SECONDS: ${GEMINI_TIMEOUT_SECONDS:-60}
    depends_on:
      db:
        condition: service_healthy
    expose:
      - "8000"
    healthcheck:
      test:
        [
          "CMD",
          "python",
          "-c",
          "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)"
        ]
      interval: 10s
      timeout: 5s
      retries: 12
      start_period: 10s
    logging: *default-logging

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: /api
    image: qa-interview-assistant-frontend:latest
    container_name: qa_interview_frontend_prod
    restart: unless-stopped
    ports:
      - "${FRONTEND_PORT:-8080}:80"
    depends_on:
      backend:
        condition: service_healthy
    logging: *default-logging

volumes:
  qa_postgres_data:
```

---

## 9. Production Dockerfile

### 9.1. Backend

Файл:

```text
backend/Dockerfile
```

Используется:

- Python 3.12 slim;
- Poetry 2.4.1;
- непривилегированный пользователь `appuser`;
- Uvicorn на порту `8000`;
- драйвер `psycopg`.

Сейчас `psycopg` устанавливается в Dockerfile отдельной командой. Для полной согласованности зависимостей рекомендуется добавить его также в `backend/pyproject.toml`.

### 9.2. Frontend

Файл:

```text
frontend/Dockerfile.prod
```

Production-сборка выполняется на Node.js 22, после чего файлы передаются Nginx.

```dockerfile
FROM node:22-alpine AS build
```

Frontend-контейнер содержит собственный healthcheck.

### 9.3. Nginx

Файл:

```text
frontend/nginx.conf
```

Ключевая маршрутизация:

```nginx
location /api/ {
    proxy_pass http://backend:8000;
}
```

SPA-маршруты обслуживаются через:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

---

## 10. Первичное развёртывание на VPS

### 10.1. Подключение

```bash
ssh <SSH_USER>@<SERVER_IP>
```

### 10.2. Актуальный каталог проекта

На текущем VPS проект размещён в:

```text
/opt/qa-interview-assistant-develop
```

Перейдите в него:

```bash
cd /opt/qa-interview-assistant-develop
```

### 10.3. Проверка файлов

```bash
ls -lh \
  docker-compose.prod.yml \
  backend/Dockerfile \
  frontend/Dockerfile.prod \
  frontend/nginx.conf
```

### 10.4. Создание `.env`

```bash
cp .env.example .env
nano .env
chmod 600 .env
```

В production обязательно замените:

```text
POSTGRES_PASSWORD
GEMINI_API_KEY
```

### 10.5. Проверка Compose

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  config >/dev/null && echo "Compose OK"
```

### 10.6. Сборка

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  build --pull --no-cache
```

### 10.7. Запуск

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d --force-recreate
```

### 10.8. Проверка

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  ps
```

Ожидаемые контейнеры:

```text
qa_interview_postgres_prod
qa_interview_backend_prod
qa_interview_frontend_prod
```

PostgreSQL и backend должны иметь статус `healthy`.

---

## 11. Проверка production после запуска

### 11.1. Проверка API

На VPS:

```bash
curl -sS http://127.0.0.1:8080/api/health
```

Ожидаемый ответ:

```json
{"status":"ok"}
```

### 11.2. Проверка frontend

```bash
curl -I http://127.0.0.1:8080/
```

Ожидается:

```text
HTTP/1.1 200 OK
```

### 11.3. Адрес сайта

```text
http://<SERVER_IP>:8080
```

### 11.4. Проверка портов

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Ожидаемо:

```text
qa_interview_frontend_prod   0.0.0.0:8080->80/tcp
qa_interview_backend_prod    8000/tcp
qa_interview_postgres_prod   127.0.0.1:15432->5432/tcp
```

Backend не должен иметь внешний mapping вида:

```text
0.0.0.0:8000->8000/tcp
```

PostgreSQL не должен иметь внешний mapping вида:

```text
0.0.0.0:5432->5432/tcp
```

---

## 12. Обновление production без удаления базы

Перед обновлением желательно сделать дамп PostgreSQL.

```bash
cd /opt/qa-interview-assistant-develop
```

Получить изменения:

```bash
git pull
```

Проверить конфигурацию:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  config >/dev/null
```

Пересобрать:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  build --pull
```

Пересоздать контейнеры:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d --force-recreate
```

Проверить:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  ps
```

При обычном обновлении не выполняйте:

```bash
docker compose down -v
```

Флаг `-v` удалит volume PostgreSQL.

---

## 13. Подключение к PostgreSQL через терминал

Подключение с использованием переменных контейнера:

```bash
docker exec -it qa_interview_postgres_prod sh -c \
'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

Полезные команды:

```sql
\l
\dt
\d categories
\d questions
SELECT * FROM levels;
SELECT * FROM categories ORDER BY id;
SELECT * FROM tags ORDER BY id;
SELECT * FROM questions ORDER BY id LIMIT 20;
SELECT * FROM interview_results ORDER BY id DESC LIMIT 20;
\q
```

Узнать имя БД и пользователя:

```bash
docker exec qa_interview_postgres_prod sh -c \
'printf "POSTGRES_DB=%s\nPOSTGRES_USER=%s\n" "$POSTGRES_DB" "$POSTGRES_USER"'
```

---

## 14. Подключение pgAdmin к production-БД

PostgreSQL привязан на VPS к:

```text
127.0.0.1:15432
```

Он не доступен напрямую из интернета.

### 14.1. Проверка порта на VPS

```bash
docker port qa_interview_postgres_prod 5432
```

Ожидаемо:

```text
127.0.0.1:15432
```

### 14.2. Вариант 1: ручной SSH-туннель

На локальном компьютере:

```bash
ssh -N -L 15433:127.0.0.1:15432 <SSH_USER>@<SERVER_IP>
```

Окно терминала останется занятым — это нормально.

Настройки pgAdmin:

```text
Host name/address: 127.0.0.1
Port:              15433
Maintenance DB:    значение POSTGRES_DB
Username:          значение POSTGRES_USER
Password:          значение POSTGRES_PASSWORD
```

### 14.3. Вариант 2: встроенный SSH Tunnel pgAdmin

Вкладка `Connection`:

```text
Host name/address: 127.0.0.1
Port:              15432
Maintenance DB:    значение POSTGRES_DB
Username:          значение POSTGRES_USER
Password:          значение POSTGRES_PASSWORD
```

Вкладка `SSH Tunnel`:

```text
Use SSH tunneling: Yes
Tunnel host:       <SERVER_IP>
Tunnel port:       22
Username:          <SSH_USER>
Authentication:    Password или Identity file
```

---

## 15. Загрузка тестовых данных

В репозитории находится минимальный seed:

```text
seed_mock_data.sql
```

Он добавляет демонстрационные категории, теги, вопросы и связи вопрос–тег.

Перед загрузкой рекомендуется сделать резервную копию.

Загрузка на VPS:

```bash
docker exec -i qa_interview_postgres_prod sh -c \
'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
< seed_mock_data.sql
```

Проверка:

```bash
docker exec qa_interview_postgres_prod sh -c \
'psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
SELECT
    l.name AS level,
    COUNT(q.id) AS questions
FROM levels l
LEFT JOIN questions q ON q.level_id = l.id
GROUP BY l.id, l.name
ORDER BY l.id;
"'
```

Seed построен так, чтобы не дублировать вопросы с тем же текстом при повторном запуске.

---

## 16. Архивирование и физическое удаление категорий

При удалении категории через API выполняется архивирование:

```text
is_archived = true
```

Категория остаётся в БД, если на неё ссылается хотя бы один вопрос.

Физически можно удалить только архивированную категорию без связанных вопросов.

### 16.1. Просмотр кандидатов на удаление

```bash
docker exec qa_interview_postgres_prod sh -c '
psql -X -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "
SELECT c.id, c.name
FROM categories c
WHERE c.is_archived IS TRUE
  AND NOT EXISTS (
      SELECT 1
      FROM questions q
      WHERE q.category_id = c.id
  )
ORDER BY c.id;
"'
```

### 16.2. Ручное удаление

Если функция уже установлена:

```bash
docker exec qa_interview_postgres_prod sh -c '
psql -X -v ON_ERROR_STOP=1 \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  -c "SELECT * FROM public.cleanup_unused_archived_categories();"
'
```

---

## 17. Автоматическая очистка категорий раз в 30 дней

В репозитории находятся:

```text
sql/cleanup_unused_archived_categories.sql
deploy/scripts/qa-category-cleanup.sh
deploy/systemd/qa-category-cleanup.service
deploy/systemd/qa-category-cleanup.timer
```

### 17.1. Установка SQL-функции

```bash
docker exec -i qa_interview_postgres_prod sh -c \
'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
< sql/cleanup_unused_archived_categories.sql
```

### 17.2. Установка скрипта

```bash
install -m 700 \
  deploy/scripts/qa-category-cleanup.sh \
  /usr/local/sbin/qa-category-cleanup.sh
```

### 17.3. Установка systemd unit и timer

```bash
install -m 644 \
  deploy/systemd/qa-category-cleanup.service \
  /etc/systemd/system/qa-category-cleanup.service

install -m 644 \
  deploy/systemd/qa-category-cleanup.timer \
  /etc/systemd/system/qa-category-cleanup.timer
```

### 17.4. Включение

```bash
systemctl daemon-reload
systemctl enable --now qa-category-cleanup.timer
```

Проверка:

```bash
systemctl status qa-category-cleanup.timer --no-pager
systemctl list-timers --all | grep qa-category-cleanup
```

Ручной запуск:

```bash
systemctl start qa-category-cleanup.service
```

Логи:

```bash
journalctl -u qa-category-cleanup.service -n 50 --no-pager
```

Таймер удаляет только категории, для которых одновременно выполняются условия:

```text
is_archived = true
и
нет ни одного вопроса с таким category_id
```

Архивированные вопросы также считаются связанными. Пока существует хотя бы один вопрос, категория сохраняется.

---

## 18. Резервное копирование PostgreSQL

### 18.1. Custom-формат

```bash
docker exec qa_interview_postgres_prod sh -c \
'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
> "/root/qa_interview_$(date +%F_%H-%M-%S).dump"
```

### 18.2. SQL-формат

```bash
docker exec qa_interview_postgres_prod sh -c \
'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
> "/root/qa_interview_$(date +%F_%H-%M-%S).sql"
```

### 18.3. Проверка

```bash
ls -lh /root/qa_interview_*
```

Файл не должен иметь размер `0`.

### 18.4. Восстановление SQL-дампа

```bash
docker exec -i qa_interview_postgres_prod sh -c \
'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
< /root/qa_interview_backup.sql
```

### 18.5. Восстановление custom-дампа

```bash
cat /root/qa_interview_backup.dump | \
docker exec -i qa_interview_postgres_prod sh -c \
'pg_restore --clean --if-exists --no-owner \
-U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

---

## 19. Docker-логи и место на диске

В production Compose настроено:

```yaml
logging:
  driver: json-file
  options:
    max-size: "10m"
    max-file: "3"
```

На каждый контейнер хранится не более трёх файлов примерно по 10 МБ.

Проверка:

```bash
docker inspect \
  qa_interview_backend_prod \
  qa_interview_frontend_prod \
  qa_interview_postgres_prod \
  --format '{{.Name}} -> {{json .HostConfig.LogConfig}}'
```

Ожидаемо:

```text
{"Type":"json-file","Config":{"max-file":"3","max-size":"10m"}}
```

Проверка диска:

```bash
df -h /
docker system df
```

Размер логов:

```bash
docker ps -q | xargs -r docker inspect \
  --format '{{.Name}} {{.LogPath}}'
```

На сервере с другими сервисами не используйте без проверки:

```bash
docker system prune -a --volumes
```

Эта команда может удалить ресурсы других проектов.

---

## 20. Основные API endpoints

```text
GET    /api/health

GET    /api/categories
POST   /api/categories
PUT    /api/categories/{id}
PATCH  /api/categories/{id}/archive
PATCH  /api/categories/{id}/unarchive

GET    /api/levels

GET    /api/tags
POST   /api/tags
PUT    /api/tags/{id}
PATCH  /api/tags/{id}/archive
PATCH  /api/tags/{id}/unarchive

GET    /api/questions
POST   /api/questions
POST   /api/questions/generate
GET    /api/questions/{id}
PUT    /api/questions/{id}
DELETE /api/questions/{id}
PATCH  /api/questions/{id}/archive
PATCH  /api/questions/{id}/unarchive

GET    /api/interview-results
POST   /api/interview-results
GET    /api/interview-results/{id}
DELETE /api/interview-results/{id}
```

Фильтрация вопросов поддерживает:

```text
text
category_id
level_id
is_archived
tag_ids=1,2
limit
offset
```

---

## 21. AI-генерация вопросов

Endpoint:

```text
POST /api/questions/generate
```

Используются:

```text
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_TIMEOUT_SECONDS
```

Обязательные параметры запроса:

```text
category_id
level_id
```

Опциональные:

```text
tag_ids
num_questions
additional_text
```

Сгенерированные вопросы сначала возвращаются frontend как черновики. В текущей версии пользователь может выбрать вопросы для сохранения, но редактирование AI-черновика непосредственно до сохранения не реализовано.

После сохранения вопрос можно редактировать обычным механизмом редактирования вопроса.

---

## 22. CI в GitHub Actions

Workflow запускается для Pull Request в:

```text
main
develop
```

Backend:

```text
Python 3.12
Poetry
Ruff
Pytest
```

Frontend:

```text
Node.js 22
npm ci
npm run build
```

Текущий CI проверяет backend преимущественно на SQLite. Отдельная интеграционная проверка PostgreSQL пока не настроена.

---

## 23. Текущие ограничения безопасности

На текущем production-развёртывании:

- сайт доступен по HTTP на порту `8080`;
- HTTPS пока не настроен;
- обязательная авторизация пользователей не реализована;
- rate limit для Gemini endpoint не реализован;
- CORS backend разрешает все origin;
- backend и PostgreSQL не опубликованы напрямую в интернет;
- PostgreSQL для pgAdmin доступен только через loopback VPS и SSH-туннель.

HTTPS защищает канал связи, но не заменяет авторизацию и контроль доступа.

---

## 24. Что можно и нельзя загружать в GitHub

Можно:

```text
backend/
frontend/
deploy/
sql/
docker-compose.yml
docker-compose.prod.yml
backend/Dockerfile
frontend/Dockerfile
frontend/Dockerfile.prod
frontend/nginx.conf
.env.example
seed_mock_data.sql
README.md
DEPLOYMENT_AND_DOCKER_GUIDE_GITHUB.md
```

Нельзя:

```text
.env
*.dump
*.backup
реальные *.sql с данными кандидатов
database/
manifest/
backups/
qa-interview-export-*.tar.gz
node_modules/
dist/
.venv/
app.db
*.sqlite
SSH-ключи
Gemini API key
пароли PostgreSQL и VPS
```

Перед коммитом:

```bash
git status
git diff --cached --name-only
git check-ignore -v .env
```

---

## 25. Частые проблемы

### 25.1. `no configuration file provided`

Команда выполняется не из каталога проекта либо не указан файл:

```bash
cd /opt/qa-interview-assistant-develop
docker compose -f docker-compose.prod.yml ps
```

### 25.2. `open Dockerfile: no such file or directory`

Проверьте:

```bash
ls -lh \
  backend/Dockerfile \
  frontend/Dockerfile.prod \
  frontend/nginx.conf
```

### 25.3. Backend `unhealthy`

```bash
docker logs --tail=200 qa_interview_backend_prod
```

Проверьте:

```text
DATABASE_URL
PostgreSQL health
наличие psycopg
ошибки создания схемы
GEMINI_API_KEY не влияет на /api/health
```

### 25.4. Frontend не запускается

Frontend зависит от healthy backend:

```bash
docker logs --tail=200 qa_interview_frontend_prod
docker logs --tail=200 qa_interview_backend_prod
```

### 25.5. PostgreSQL показывает только `5432/tcp`

Это означает, что порт не опубликован на VPS.

В production Compose должен быть:

```yaml
ports:
  - "127.0.0.1:15432:5432"
```

После изменения:

```bash
docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d --force-recreate --no-deps db
```

### 25.6. AI-генерация не работает

Проверьте:

```bash
docker exec qa_interview_backend_prod printenv GEMINI_API_KEY
docker exec qa_interview_backend_prod printenv GEMINI_MODEL
```

Не используйте `AI_API_KEY`.

### 25.7. `No space left on device`

```bash
df -h /
docker system df
du -sh /var/lib/docker/* 2>/dev/null | sort -h
```

Проверьте ротацию Docker-логов. Не удаляйте volumes без резервной копии.

### 25.8. В базе нет вопросов

```bash
docker exec qa_interview_postgres_prod sh -c \
'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
-c "SELECT COUNT(*) FROM questions;"'
```

При необходимости загрузите seed.

---

## 26. Краткая шпаргалка

### Локальный запуск

```bash
cp .env.example .env
docker compose --env-file .env up --build -d
docker compose ps
```

### Production

```bash
cd /opt/qa-interview-assistant-develop

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  config >/dev/null

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  build --pull

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  up -d --force-recreate

docker compose \
  --env-file .env \
  -f docker-compose.prod.yml \
  ps
```

### Проверка

```bash
curl -sS http://127.0.0.1:8080/api/health
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### PostgreSQL

```bash
docker exec -it qa_interview_postgres_prod sh -c \
'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
```

### Резервная копия

```bash
docker exec qa_interview_postgres_prod sh -c \
'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"' \
> "/root/qa_interview_$(date +%F_%H-%M-%S).sql"
```

### Логи

```bash
docker logs --tail=200 qa_interview_backend_prod
docker logs --tail=200 qa_interview_frontend_prod
docker logs --tail=200 qa_interview_postgres_prod
```

---

## 27. Итог

Актуальная production-конфигурация обеспечивает:

```text
PostgreSQL 16
FastAPI backend
React production build
Nginx reverse proxy
healthcheck PostgreSQL и backend
локальный порт PostgreSQL для SSH-туннеля
сохранение данных в Docker volume
ротацию Docker-логов
Gemini-генерацию вопросов
автоматическую очистку неиспользуемых архивированных категорий
```

Для дальнейшего приближения к полноценному production рекомендуется отдельно реализовать:

```text
HTTPS
авторизацию
ограничение CORS
rate limiting
Alembic-миграции
PostgreSQL integration tests в CI
мониторинг и автоматические резервные копии
```
