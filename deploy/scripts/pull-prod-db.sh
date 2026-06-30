#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Production datasını LOKALA çək (snapshot)
#
# Production bazasının surətini götürüb sənin LOKAL bazana yükləyir.
# Beləliklə lokalda real data ilə işləyə bilərsən. Bu BİRDƏFƏLİK
# surətdir — canlı sync deyil; yenidən işlətsən təzə surət gətirir.
#
# ⚠️  DİQQƏT: lokal bazanın ÜSTÜNƏ yazılır (əvvəlcə təsdiq istəyir).
# ✅  Lokal dəyişikliklərin production-a TƏSİR ETMİR (yalnız oxuyur).
#
# İstifadə:
#   bash deploy/scripts/pull-prod-db.sh root@<SERVER_IP> [SSH_PORT] [REMOTE_DIR]
# Nümunə:
#   bash deploy/scripts/pull-prod-db.sh root@1.2.3.4
#   bash deploy/scripts/pull-prod-db.sh deploy@1.2.3.4 2222 /opt/tour-planner
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

TARGET="${1:?İstifadə: pull-prod-db.sh user@host [port] [remote_dir]}"
PORT="${2:-22}"
REMOTE="${3:-/opt/tour-planner}"

# Lokal baza parametrləri (docker-compose.yml-dən).
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-tourist_manager}"
LOCAL_COMPOSE="docker compose -f docker-compose.yml"

STAMP=$(date +%Y%m%d-%H%M%S)
SNAP="prod-snapshot-$STAMP.sql.gz"

echo "### 1/4 Production-dan dump götürülür ($TARGET) ..."
# Server .env-i serverdə source edirik ki, prod POSTGRES_USER/DB düzgün olsun.
# --no-owner/--no-privileges: lokala (fərqli istifadəçi) problemsiz bərpa üçün.
ssh -p "$PORT" "$TARGET" "cd $REMOTE && set -a && . ./.env && set +a && \
  docker compose -f docker-compose.prod.yml --env-file .env exec -T db \
    pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" \
      --clean --if-exists --no-owner --no-privileges" \
  | gzip > "$SNAP"

if [[ ! -s "$SNAP" ]]; then
  echo "XƏTA: dump boşdur (SSH və ya prod db problemi?)." >&2
  rm -f "$SNAP"; exit 1
fi
echo "    ✓ Snapshot: $SNAP ($(du -h "$SNAP" | cut -f1))"

echo "### 2/4 Təsdiq ..."
echo "    Bu, LOKAL '$LOCAL_DB_NAME' bazasının ÜSTÜNƏ yazılacaq."
read -r -p "    Davam edilsin? (yes yaz): " confirm
[[ "$confirm" == "yes" ]] || { echo "Ləğv edildi. Snapshot saxlanıldı: $SNAP"; exit 0; }

echo "### 3/4 Lokal baza qaldırılır ..."
$LOCAL_COMPOSE up -d db
for i in $(seq 1 30); do
  if $LOCAL_COMPOSE exec -T db pg_isready -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" >/dev/null 2>&1; then break; fi
  sleep 2
done

echo "### 4/4 Data lokal bazaya yüklənir ..."
gunzip -c "$SNAP" | $LOCAL_COMPOSE exec -T db psql -U "$LOCAL_DB_USER" -d "$LOCAL_DB_NAME" >/dev/null
echo "    ✓ Bərpa tamamlandı."

echo ""
echo "✓ Production datası lokalda hazırdır."
echo "  Lokal stack-i tam qaldır:   $LOCAL_COMPOSE up -d"
echo "  (və ya native: backend 'air' + frontend 'npm run dev')"
echo "  Snapshot faylı saxlanıldı:  $SNAP (lazım olsa yenidən bərpa üçün)"
