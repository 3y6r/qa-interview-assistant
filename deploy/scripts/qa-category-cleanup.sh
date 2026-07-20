#!/usr/bin/env bash
set -Eeuo pipefail

CONTAINER_NAME="qa_interview_postgres_prod"

if ! docker inspect -f '{{.State.Running}}' "${CONTAINER_NAME}" 2>/dev/null | grep -qx 'true'; then
    echo "Ошибка: контейнер ${CONTAINER_NAME} не запущен." >&2
    exit 1
fi

docker exec "${CONTAINER_NAME}" sh -c '
  psql -X -v ON_ERROR_STOP=1     -U "$POSTGRES_USER"     -d "$POSTGRES_DB"     -c "SELECT * FROM public.cleanup_unused_archived_categories();"
'
