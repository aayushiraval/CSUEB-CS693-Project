#!/usr/bin/env bash

echo "Starting API server..."
gunicorn app.services.api.wsgi
