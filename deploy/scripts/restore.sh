#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Backup-dan bərpa
#
# DİQQƏT: mövcud bazanın üstünə yazır. Əvvəlcə təsdiq istəyir.
#
# İstifadə:  bash deploy/scripts/restore.sh /opt/tour-planner/backups/tourist_manager-YYYYMMDD-HHMMSS.sql.gz
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

FILE="${1:?İstifadə: restore.sh <backup.sql.gz>}"
[[ -f "$FILE" ]] || { echo "Fayl tapılmadı: $FILE" >&2; exit 1; }

set -a; source .env; set +a
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"

echo "DİQQƏT: '$FILE' faylı '${POSTGRES_DB}' bazasının ÜSTÜNƏ yazılacaq."
read -r -p "Davam edilsin? (yes yaz): " confirm
[[ "$confirm" == "yes" ]] || { echo "Ləğv edildi."; exit 0; }

echo "Bərpa edilir ..."
gunzip -c "$FILE" | $COMPOSE exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
echo "✓ Bərpa tamamlandı. Backend restart edilir ..."
$COMPOSE restart backend
echo "✓ Hazırdır."
