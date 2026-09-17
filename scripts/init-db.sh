#!/usr/bin/env sh
set -eu

database_name="${POSTGRES_DB:-medibook}"
database_user="${POSTGRES_USER:-medibook}"

docker compose up -d db

attempt=1
until docker compose exec -T db pg_isready -U "$database_user" -d "$database_name" >/dev/null 2>&1; do
  if [ "$attempt" -ge 30 ]; then
    echo "PostgreSQL did not become ready in time." >&2
    exit 1
  fi
  attempt=$((attempt + 1))
  sleep 2
done

docker compose run --rm backend python manage.py migrate
docker compose exec -T db psql -U "$database_user" -d "$database_name" -c "SELECT current_database(), current_user;"

echo "MediBook database is initialized."

