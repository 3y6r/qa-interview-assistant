# QA Interview Assistant — запуск через Docker и деплой на VPS

Документ описывает локальный запуск проекта через Docker Compose, работу с PostgreSQL, наполнение базы тестовыми данными и production-развёртывание на VPS.

## 1. Состав проекта

Проект состоит из трёх основных частей:

```text
frontend    — React / Vite / TypeScript приложение
backend     — FastAPI приложение
PostgreSQL  — база данных проекта
```

В локальном Docker-окружении обычно используются контейнеры:

```text
qa_interview_frontend
qa_interview_backend
qa_interview_postgres
```

В production-окружении на VPS обычно используются контейнеры:

```text
qa_interview_frontend_prod
qa_interview_backend_prod
qa_interview_postgres_prod
```

Основная таблица с историей завершённых собеседований:

```text
interview_results
```

В ней хранится минимальный итог интервью:

```text
candidate_full_name  — ФИО кандидата
interview_date       — дата собеседования
average_score        — средний балл
comment              — общий комментарий
```

## 2. Переменные окружения

В корне проекта должен быть файл `.env`.

Пример для локального запуска:

```env
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=qa_password

DATABASE_URL=postgresql+psycopg://qa_user:qa_password@db:5432/qa_interview_db

BACKEND_PORT=8000
FRONTEND_PORT=3001

VITE_API_BASE_URL=http://localhost:8000/api

AI_API_KEY=
```

Для GitHub нужно хранить только `.env.example`, а реальный `.env` добавлять в `.gitignore`.

Пример `.env.example`:

```env
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=change_me_strong_password

DATABASE_URL=postgresql+psycopg://qa_user:change_me_strong_password@db:5432/qa_interview_db

BACKEND_PORT=8000
FRONTEND_PORT=3001

VITE_API_BASE_URL=http://localhost:8000/api

AI_API_KEY=
```

На VPS пароль от PostgreSQL должен быть сложным. Не используйте `qa_password` в production.

## 3. Локальный запуск через Docker

### 3.1. Требования

Для локального запуска нужны:

```text
Docker Desktop
Docker Compose
Git
```

На Windows Docker Desktop должен быть запущен до выполнения команд.

Проверка:

```bash
docker --version
docker compose version
```

### 3.2. Запуск проекта

Перейдите в корень проекта:

```bash
cd <PROJECT_DIR>
```

Запустите контейнеры:

```bash
docker compose up --build -d
```

Проверьте статус:

```bash
docker compose ps
```

Ожидаемый результат:

```text
qa_interview_frontend   Up
qa_interview_backend    Up
qa_interview_postgres   Up healthy
```

### 3.3. Локальные адреса

Обычно приложение доступно по адресам:

```text
Frontend:        http://localhost:3001
Backend Swagger: http://localhost:8000/docs
API health:      http://localhost:8000/api/health
```

PostgreSQL не открывается в браузере. Для подключения к базе используется `psql`, pgAdmin или другой SQL-клиент.

Внешний порт PostgreSQL зависит от `docker-compose.yml`. Его можно посмотреть командой:

```bash
docker compose ps
```

Пример:

```text
0.0.0.0:15432->5432/tcp
```

В этом случае внешний порт для pgAdmin — `15432`.

### 3.4. Логи контейнеров

```bash
docker compose logs frontend
docker compose logs backend
docker compose logs db
```

Последние строки логов backend:

```bash
docker compose logs --tail=100 backend
```

### 3.5. Остановка проекта

Остановить контейнеры без удаления данных:

```bash
docker compose down
```

Остановить контейнеры и удалить volume PostgreSQL:

```bash
docker compose down -v
```

Команда `down -v` удаляет данные базы. Используйте её только если точно нужно пересоздать PostgreSQL с нуля.

## 4. Работа с PostgreSQL локально

### 4.1. Подключение через терминал

```bash
docker exec -it qa_interview_postgres psql -U qa_user -d qa_interview_db
```

Полезные команды внутри `psql`:

```sql
\dt
SELECT * FROM levels;
SELECT * FROM categories;
SELECT * FROM tags;
SELECT * FROM questions;
SELECT * FROM interview_results;
\q
```

### 4.2. Подключение через pgAdmin

Создайте новое подключение:

```text
Servers → Register → Server...
```

Вкладка `General`:

```text
Name: QA Interview Local
```

Вкладка `Connection`:

```text
Host name/address: 127.0.0.1
Port: <POSTGRES_EXTERNAL_PORT>
Maintenance database: qa_interview_db
Username: qa_user
Password: <POSTGRES_PASSWORD>
```

`POSTGRES_EXTERNAL_PORT` берётся из `docker compose ps`.

## 5. Наполнение базы тестовыми данными

Если после запуска приложение открывается, но в таблице нет вопросов, значит PostgreSQL пустой.

Для первичного наполнения используется файл:

```text
seed_mock_data.sql
```

Запуск seed-файла локально:

```bash
docker exec -i qa_interview_postgres psql -U qa_user -d qa_interview_db < seed_mock_data.sql
```

Проверка количества вопросов:

```bash
docker exec -it qa_interview_postgres psql -U qa_user -d qa_interview_db -c "SELECT COUNT(*) FROM questions;"
```

Проверка данных:

```bash
docker exec -it qa_interview_postgres psql -U qa_user -d qa_interview_db -c "SELECT q.id, q.text, c.name AS category, l.name AS level FROM questions q JOIN categories c ON c.id = q.category_id JOIN levels l ON l.id = q.level_id ORDER BY q.id;"
```

После загрузки данных обновите страницу frontend через `Ctrl + F5`.

## 6. Production-запуск на VPS

### 6.1. Схема работы

В production-окружении frontend отдаётся через Nginx-контейнер, а все запросы `/api/...` проксируются на backend:

```text
Browser
  ↓
http://<SERVER_IP>:8080
  ↓
frontend nginx container
  ↓
/api/... → backend FastAPI
  ↓
PostgreSQL
```

PostgreSQL не должен быть открыт в интернет.

### 6.2. Проверка сервера

Подключитесь к VPS:

```bash 
ssh <SSH_USER>@<SERVER_IP>
```

Проверьте ОС:

```bash
cat /etc/os-release
```

Проверьте занятые порты:

```bash
ss -tulpn | grep -E ':80|:443|:3001|:8000|:5432|:51820|:8080'
```

Если на сервере уже работает VPN или другой сервис, не используйте занятые им порты.

### 6.3. Рекомендуемый путь проекта

```text
/opt/qa-interview-assistant
```

Перейти в проект:

```bash
cd /opt/qa-interview-assistant
```

### 6.4. Production `.env`

На VPS в корне проекта создайте `.env`:

```env
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=change_me_strong_password

AI_API_KEY=
```

Не добавляйте production `.env` в GitHub.

### 6.5. Production Docker Compose

Для production-запуска используется файл:

```text
docker-compose.prod.yml
```

Пример:

```yaml
services:
  db:
    image: postgres:16-alpine
    container_name: qa_interview_postgres_prod
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - qa_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: qa_interview_backend_prod
    restart: unless-stopped
    environment:
      DATABASE_URL: postgresql+psycopg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
      AI_API_KEY: ${AI_API_KEY}
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_BASE_URL: /api
    container_name: qa_interview_frontend_prod
    restart: unless-stopped
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  qa_postgres_data:
```

### 6.6. Production Dockerfile frontend

Файл:

```text
frontend/Dockerfile.prod
```

Пример:

```dockerfile
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
```

### 6.7. Nginx-конфигурация frontend

Файл:

```text
frontend/nginx.conf
```

Пример:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location /api/ {
        proxy_pass http://backend:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /docs {
        proxy_pass http://backend:8000/docs;
        proxy_set_header Host $host;
    }

    location /openapi.json {
        proxy_pass http://backend:8000/openapi.json;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri /index.html;
    }
}
```

### 6.8. Запуск на VPS

```bash
cd /opt/qa-interview-assistant
docker compose -f docker-compose.prod.yml up --build -d
```

Проверка:

```bash
docker compose -f docker-compose.prod.yml ps
```

или:

```bash
docker ps
```

Ожидаемые контейнеры:

```text
qa_interview_frontend_prod
qa_interview_backend_prod
qa_interview_postgres_prod
```

### 6.9. Адреса на VPS

```text
Frontend:        http://<SERVER_IP>:8080
Backend Swagger: http://<SERVER_IP>:8080/docs
API health:      http://<SERVER_IP>:8080/api/health
```

Backend и PostgreSQL напрямую наружу не открываются.

### 6.10. Логи на VPS

```bash
docker compose -f docker-compose.prod.yml logs frontend
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs db
```

Последние строки backend:

```bash
docker compose -f docker-compose.prod.yml logs --tail=100 backend
```

### 6.11. Перезапуск production

Пересобрать и запустить заново:

```bash
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up --build -d
```

Перезапустить без пересборки:

```bash
docker compose -f docker-compose.prod.yml restart
```

## 7. База данных на VPS

### 7.1. Где хранится база

PostgreSQL на VPS хранит данные в Docker volume.

Посмотреть volumes:

```bash
docker volume ls
```

Проверить, какой volume подключён к production-контейнеру:

```bash
docker inspect qa_interview_postgres_prod --format '{{ range .Mounts }}{{ .Name }} -> {{ .Destination }}{{ println }}{{ end }}'
```

Ожидаемый destination:

```text
/var/lib/postgresql/data
```

### 7.2. Подключение к PostgreSQL на VPS через терминал

```bash
docker exec -it qa_interview_postgres_prod psql -U qa_user -d qa_interview_db
```

Проверить историю собеседований:

```sql
SELECT id, candidate_full_name, interview_date, average_score, comment, created_at
FROM interview_results
ORDER BY id DESC;
```

Очистить историю собеседований:

```sql
TRUNCATE TABLE interview_results RESTART IDENTITY;
```

Выйти:

```sql
\q
```

То же самое одной командой:

```bash
docker exec -it qa_interview_postgres_prod psql -U qa_user -d qa_interview_db -c "TRUNCATE TABLE interview_results RESTART IDENTITY;"
```

### 7.3. Проверка API истории на VPS

```bash
curl http://localhost:8080/api/interview-results
```

Если история очищена, ответ должен быть:

```json
[]
```

## 8. Подключение pgAdmin к базе на VPS

Безопасный вариант — не открывать PostgreSQL через браузера, а подключаться через SSH-туннель.

### 8.1. Открыть PostgreSQL только для самого VPS

В `docker-compose.prod.yml` в блок `db` можно добавить:

```yaml
ports:
  - "127.0.0.1:15432:5432"
```

Именно `127.0.0.1`, чтобы база была доступна только с самого VPS.

После изменения:

```bash
docker compose -f docker-compose.prod.yml up -d
```

Проверка:

```bash
docker ps
```

У контейнера БД должно быть:

```text
127.0.0.1:15432->5432/tcp
```

### 8.2. Создать SSH-туннель с ПК

На локальном компьютере:

```bash
ssh -N -L 15433:127.0.0.1:15432 <SSH_USER>@<SERVER_IP>
```

Окно будет занято туннелем. Не закрывайте его, пока работаете с pgAdmin.

### 8.3. Подключение в pgAdmin

Создайте новое подключение:

```text
Servers → Register → Server...
```

Вкладка `General`:

```text
Name: QA Interview VPS
```

Вкладка `Connection`:

```text
Host name/address: 127.0.0.1
Port: 15433
Maintenance database: qa_interview_db
Username: qa_user
Password: <POSTGRES_PASSWORD_FROM_VPS_ENV>
```

После этого pgAdmin будет работать именно с VPS-базой, которую использует production-сайт.

## 9. Экспорт проекта с VPS на локальный компьютер

Чтобы скопировать актуальный проект с VPS на ПК без `.env` и временных файлов, сначала создайте экспортную папку на VPS:

```bash
cd /opt
rm -rf qa-interview-assistant-export
mkdir qa-interview-assistant-export
apt install -y rsync

rsync -av /opt/qa-interview-assistant/ /opt/qa-interview-assistant-export/ \
  --exclude '.env' \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'postgres_data' \
  --exclude '*.db' \
  --exclude '*.sqlite' \
  --exclude '*.sqlite3'
```

Создайте `.env.example`:

```bash
cat > /opt/qa-interview-assistant-export/.env.example <<'ENVEOF'
POSTGRES_DB=qa_interview_db
POSTGRES_USER=qa_user
POSTGRES_PASSWORD=change_me_strong_password

DATABASE_URL=postgresql+psycopg://qa_user:change_me_strong_password@db:5432/qa_interview_db

BACKEND_PORT=8000
FRONTEND_PORT=3001

VITE_API_BASE_URL=http://localhost:8000/api

AI_API_KEY=
ENVEOF
```

Скопируйте папку на ПК. Команда выполняется на локальном компьютере, а не внутри SSH-сессии VPS:

```bash
scp -r <SSH_USER>@<SERVER_IP>:/opt/qa-interview-assistant-export <LOCAL_TARGET_DIR>
```

Пример для Windows PowerShell:

```powershell
scp -r root@<SERVER_IP>:/opt/qa-interview-assistant-export "$env:USERPROFILE\Downloads\"
```

## 10. Бэкап и восстановление базы

### 10.1. Сделать дамп БД на VPS

```bash
cd /opt/qa-interview-assistant
docker exec qa_interview_postgres_prod pg_dump -U qa_user -d qa_interview_db --clean --if-exists > qa_interview_db_dump.sql
```

### 10.2. Восстановить дамп на VPS

```bash
docker exec -i qa_interview_postgres_prod psql -U qa_user -d qa_interview_db < qa_interview_db_dump.sql
```

### 10.3. Важно

Если в истории есть реальные ФИО кандидатов и комментарии, дамп базы нельзя заливать в публичный GitHub.

Для репозитория лучше использовать только `seed_mock_data.sql` с тестовыми данными.

## 11. Частые проблемы

### 11.1. `docker compose ps` пишет `no configuration file provided`

Команда запущена не из папки проекта.

Решение:

```bash
cd <PROJECT_DIR>
docker compose ps
```

На VPS:

```bash
cd /opt/qa-interview-assistant
docker compose -f docker-compose.prod.yml ps
```

### 11.2. Backend открывается, frontend нет

Проверьте логи frontend:

```bash
docker compose logs frontend
```

Для VPS:

```bash
docker compose -f docker-compose.prod.yml logs frontend
```

Для локального Vite frontend должен слушать `0.0.0.0`:

```dockerfile
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
```

### 11.3. Вопросы не отображаются

Проверьте количество вопросов в БД:

```bash
docker exec -it qa_interview_postgres_prod psql -U qa_user -d qa_interview_db -c "SELECT COUNT(*) FROM questions;"
```

Проверьте API:

```bash
curl http://localhost:8080/api/questions
```

Если база пустая, выполните seed:

```bash
docker exec -i qa_interview_postgres_prod psql -U qa_user -d qa_interview_db < seed_mock_data.sql
```

### 11.4. Кандидат остался в истории после очистки локальной БД

Если сайт открыт по адресу:

```text
http://<SERVER_IP>:8080
```

то он использует БД на VPS, а не локальную БД на ПК.

Чистить нужно VPS-БД:

```bash
docker exec -it qa_interview_postgres_prod psql -U qa_user -d qa_interview_db -c "TRUNCATE TABLE interview_results RESTART IDENTITY;"
```

Проверка:

```bash
curl http://localhost:8080/api/interview-results
```

### 11.5. На сайте отображается старое состояние

Если API уже отдаёт актуальные данные, но frontend показывает старое состояние, очистите данные сайта в браузере:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

Команда выполняется в браузере:

```text
F12 → Console
```

## 12. Что нельзя заливать в GitHub

Не добавляйте в репозиторий:

```text
.env
node_modules/
dist/
.venv/
__pycache__/
*.pyc
*.db
*.sqlite
*.sqlite3
postgres_data/
реальные дампы базы с ФИО кандидатов
```

Можно добавлять:

```text
.env.example
docker-compose.yml
docker-compose.prod.yml
backend/Dockerfile
frontend/Dockerfile
frontend/Dockerfile.prod
frontend/nginx.conf
seed_mock_data.sql
README.md
DEPLOYMENT_AND_DOCKER_GUIDE.md
```

## 13. Краткая шпаргалка

Локальный запуск:

```bash
cd <PROJECT_DIR>
docker compose up --build -d
docker compose ps
docker compose logs backend
```

VPS:

```bash
ssh <SSH_USER>@<SERVER_IP>
cd /opt/qa-interview-assistant
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml ps
```

Очистить историю на VPS:

```bash
docker exec -it qa_interview_postgres_prod psql -U qa_user -d qa_interview_db -c "TRUNCATE TABLE interview_results RESTART IDENTITY;"
```

Проверить историю через API:

```bash
curl http://localhost:8080/api/interview-results
```

Подключить pgAdmin к VPS через SSH-туннель:

```bash
ssh -N -L 15433:127.0.0.1:15432 <SSH_USER>@<SERVER_IP>
```

Настройки pgAdmin:

```text
Host: 127.0.0.1
Port: 15433
Database: qa_interview_db
User: qa_user
Password: пароль из .env на VPS
```
