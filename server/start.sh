#!/bin/bash
# Wait for DB? (Docker depends_on handles start, but not readiness)
# For now, just run migrations and start
alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
