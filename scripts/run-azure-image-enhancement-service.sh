#!/usr/bin/env bash
set -euo pipefail

cd /home/jinxlo/iroselectronics

PYTHON="/home/jinxlo/iroselectronics/.venv-image-enhancement/bin/python"
LOG_DIR="/home/jinxlo/iroselectronics/public/azure-images"
STATUS_SCRIPT="/home/jinxlo/iroselectronics/scripts/azure-image-enhancement-status.py"
ENHANCE_SCRIPT="/home/jinxlo/iroselectronics/scripts/enhance-product-images-azure.py"

mkdir -p "$LOG_DIR"

exec 9>"$LOG_DIR/service.lock"
if ! flock -n 9; then
  echo "[$(date -Is)] Azure image enhancement is already running; exiting."
  exit 0
fi

while true; do
  echo "[$(date -Is)] Starting Azure image enhancement pass"
  "$PYTHON" "$ENHANCE_SCRIPT" --all --size 2048x2048 --batch-size 25
  echo "[$(date -Is)] Enhancement pass finished"

  STATUS_JSON="$($PYTHON "$STATUS_SCRIPT" --json)"
  echo "$STATUS_JSON"
  REMAINING="$($PYTHON -c 'import json,sys; print(json.load(sys.stdin)["remaining"])' <<<"$STATUS_JSON")"

  if [ "$REMAINING" = "0" ]; then
    echo "[$(date -Is)] All Supabase product images have generated PNGs. Service exiting."
    exit 0
  fi

  echo "[$(date -Is)] $REMAINING images remaining; sleeping 60s before retrying failed/remaining images"
  sleep 60
done
