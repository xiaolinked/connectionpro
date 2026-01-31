#!/bin/bash
# Start server with production credentials

export FIREBASE_CREDENTIALS="service-account.prod.json"
export FIREBASE_PROJECT_ID="connectionpro-prod"
# Add other production env vars here if needed, e.g. FRONTEND_URL

echo "Starting server in PRODUCTION mode with:"
echo "  Credentials: $FIREBASE_CREDENTIALS"
echo "  Project ID: $FIREBASE_PROJECT_ID"

alembic upgrade head
uvicorn main:app --host 0.0.0.0 --port 8000
