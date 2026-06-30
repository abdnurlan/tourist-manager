#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Cron qurğuları (gündəlik backup)
#
# Hər gecə 03:30-da DB backup-ı işlədir.
# İstifadə (server üzərində):  bash deploy/scripts/install-cron.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

REPO_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
CRON_LINE="30 3 * * * cd $REPO_DIR && /usr/bin/env bash deploy/scripts/backup.sh >> /var/log/tour-backup.log 2>&1"

# Mövcud eyni sətri çıxar, yenisini əlavə et (idempotent).
# `|| true`: ilk dəfə crontab boş olanda `crontab -l` xətası pipefail-i dağıtmasın.
{ crontab -l 2>/dev/null | grep -v 'deploy/scripts/backup.sh' || true ; echo "$CRON_LINE" ; } | crontab -

echo "✓ Cron quruldu (hər gün 03:30 backup):"
crontab -l | grep backup.sh
echo "Loglar: /var/log/tour-backup.log"
