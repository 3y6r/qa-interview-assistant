# Обновление ветки feature/PB-7-PB-9-postgresql-docker

В комплект включены:

- актуальные backend и frontend из версии, развёрнутой на VPS;
- глобальная серверная сортировка вопросов до LIMIT/OFFSET;
- редактирование AI-черновиков перед сохранением;
- PostgreSQL-совместимые BOOLEAN DEFAULT false;
- production Dockerfile и Nginx-конфигурация;
- docker-compose.prod.yml с healthcheck и ротацией логов;
- systemd-очистка архивированных категорий;
- обновлённый deployment guide;
- безопасный .env.example без секретов.

Не включены:

- рабочий .env;
- дампы PostgreSQL;
- реальные данные кандидатов;
- Docker volumes;
- node_modules, dist, .vite и Python-кэши.
