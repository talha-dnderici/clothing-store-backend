#!/bin/sh

set -eu

export NODE_ENV=production
export PORT="${PORT:-7860}"
export GATEWAY_PORT="${GATEWAY_PORT:-$PORT}"
export GATEWAY_HOST="${GATEWAY_HOST:-0.0.0.0}"

export LOGIN_SERVICE_HOST="${LOGIN_SERVICE_HOST:-127.0.0.1}"
export LOGIN_SERVICE_PORT="${LOGIN_SERVICE_PORT:-4001}"

export REGISTER_SERVICE_HOST="${REGISTER_SERVICE_HOST:-127.0.0.1}"
export REGISTER_SERVICE_PORT="${REGISTER_SERVICE_PORT:-4002}"

export MAIN_SERVICE_HOST="${MAIN_SERVICE_HOST:-127.0.0.1}"
export MAIN_SERVICE_PORT="${MAIN_SERVICE_PORT:-4003}"

export CARD_SERVICE_HOST="${CARD_SERVICE_HOST:-127.0.0.1}"
export CARD_SERVICE_PORT="${CARD_SERVICE_PORT:-4004}"

cleanup() {
  kill "$REGISTER_PID" "$LOGIN_PID" "$MAIN_PID" "$CARD_PID" "$GATEWAY_PID" 2>/dev/null || true
}

trap cleanup INT TERM

node dist/apps/register-service/src/main.js &
REGISTER_PID=$!

node dist/apps/login-service/src/main.js &
LOGIN_PID=$!

node dist/apps/main-service/src/main.js &
MAIN_PID=$!

node dist/apps/card-service/src/main.js &
CARD_PID=$!

node dist/apps/api-gateway/src/main.js &
GATEWAY_PID=$!

wait -n "$REGISTER_PID" "$LOGIN_PID" "$MAIN_PID" "$CARD_PID" "$GATEWAY_PID"
EXIT_CODE=$?

cleanup
wait || true

exit "$EXIT_CODE"
