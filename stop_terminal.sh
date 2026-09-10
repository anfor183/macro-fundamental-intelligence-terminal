#!/usr/bin/env bash
# ==============================================================================
# Fortune Anukposi Quantitative Macro Terminal - Application Stopper
# ==============================================================================

PORT=8080
echo "[INFO] Terminating processes running on port ${PORT}..."

PIDS=$(lsof -ti :${PORT} 2>/dev/null || fuser ${PORT}/tcp 2>/dev/null || true)
if [ -n "${PIDS}" ]; then
    kill -15 ${PIDS} 2>/dev/null || true
    sleep 1
    kill -9 ${PIDS} 2>/dev/null || true
    echo "[SUCCESS] Macro Terminal server stopped."
else
    echo "[INFO] No server active on port ${PORT}."
fi
