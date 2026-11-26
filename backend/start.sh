#!/bin/sh
set -eu

# Startup migrations work on Render's free service without shell or pre-deploy jobs.
python manage.py wait_for_db --attempts 10 --delay 2
python manage.py migrate --noinput

exec gunicorn config.wsgi:application \
  --bind "0.0.0.0:${PORT:-8000}" \
  --workers 1 \
  --threads 2 \
  --worker-class gthread \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
