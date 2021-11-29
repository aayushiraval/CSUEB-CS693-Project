#!/usr/bin/env bash

echo "Starting API server..."
gunicorn --reload --workers=1 --timeout=60 --access-logfile=- --worker-class=gevent --bind=0.0.0.0:80 app.services.api.wsgi
