#!/usr/bin/env bash
# ==============================================================================
# Fortune Anukposi Quantitative Macro Terminal - Application Launcher
# ==============================================================================

set -e

PROJECT_DIR="/home/fortune/Documents/fx fundamentals"
PORT=8080
TARGET_URL="http://127.0.0.1:${PORT}/"
HEALTH_URL="http://127.0.0.1:${PORT}/api/v1/info"
LOG_FILE="${PROJECT_DIR}/terminal.log"

cd "${PROJECT_DIR}"

# Function to check if server is responsive
is_server_running() {
    python3 -c "
import urllib.request, sys
try:
    resp = urllib.request.urlopen('${HEALTH_URL}', timeout=1)
    if resp.status == 200:
        sys.exit(0)
    sys.exit(1)
except Exception:
    sys.exit(1)
" >/dev/null 2>&1
}

# 1. Check if server is already running
if is_server_running; then
    echo "[INFO] Terminal server is already active on port ${PORT}."
else
    echo "[INFO] Starting Macro Fundamental Intelligence Terminal server..."
    
    # Ensure frontend dist is ready
    if [ ! -d "${PROJECT_DIR}/frontend/dist" ]; then
        echo "[INFO] Building frontend distribution assets..."
        (cd "${PROJECT_DIR}/frontend" && npm run build)
    fi

    # Launch uvicorn server fully detached with setsid
    setsid python3 -m uvicorn backend.app.main:app --host 127.0.0.1 --port ${PORT} </dev/null > "${LOG_FILE}" 2>&1 &
    SERVER_PID=$!
    echo "[INFO] Server spawned (PID $SERVER_PID). Waiting for health check..."

    # Wait for server to become responsive (up to 15 seconds)
    READY=0
    for i in $(seq 1 30); do
        if is_server_running; then
            READY=1
            echo "[INFO] Terminal server is online and ready!"
            break
        fi
        sleep 0.5
    done

    if [ $READY -eq 0 ]; then
        echo "[ERROR] Terminal server failed to respond within 15 seconds. Check ${LOG_FILE}"
        # Still attempt to open browser in case it's slowly spinning up
    fi
fi

# 2. Launch browser client
echo "[INFO] Launching Terminal interface at ${TARGET_URL}..."
if [ -x "/home/fortune/.local/bin/google-chrome" ] || command -v google-chrome >/dev/null 2>&1; then
    CHROME_BIN="$(which google-chrome 2>/dev/null || echo '/home/fortune/.local/bin/google-chrome')"
    "${CHROME_BIN}" --app="${TARGET_URL}" >/dev/null 2>&1 &
elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "${TARGET_URL}" >/dev/null 2>&1 &
else
    python3 -m webbrowser "${TARGET_URL}" >/dev/null 2>&1 &
fi

echo "[SUCCESS] Fortune Anukposi Quantitative Macro Terminal launched."
