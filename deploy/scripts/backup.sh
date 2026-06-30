#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — PostgreSQL backup (sıxılmış + rotasiya)
#
# Gündəlik cron ilə işlədilir (install-cron.sh qurur). Son 14 günü saxlayır.
#
# Əl ilə:  bash deploy/scripts/backup.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

set -a; source .env; set +a
BACKUP_DIR="${BACKUP_DIR:-/opt/tour-planner/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"

mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$BACKUP_DIR/tourist_manager-$STAMP.sql.gz"

echo "Backup yaradılır: $OUT"
$COMPOSE exec -T db pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" --clean --if-exists \
  | gzip > "$OUT"

# Boş/uğursuz backup-ı sil.
if [[ ! -s "$OUT" ]]; then
  echo "XƏTA: backup boşdur, silinir." >&2
  rm -f "$OUT"
  exit 1
fi

echo "✓ Backup hazırdır ($(du -h "$OUT" | cut -f1))."

# Rotasiya: köhnələri sil.
find "$BACKUP_DIR" -name 'tourist_manager-*.sql.gz' -type f -mtime +"$RETENTION_DAYS" -delete
echo "Saxlanan backuplar:"
ls -1t "$BACKUP_DIR"/tourist_manager-*.sql.gz 2>/dev/null | head -n 20
