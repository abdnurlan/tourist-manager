#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Deploy (build + işə salma)
#
# Bütün stack-i qurur və işə salır. CI/CD də bunu çağırır.
# İdempotentdir — istənilən vaxt təkrar işlədilə bilər.
#
# İstifadə:  bash deploy/scripts/deploy.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"

if [[ ! -f .env ]]; then
  echo "XƏTA: .env tapılmadı. cp .env.production.example .env && nano .env" >&2
  exit 1
fi

set -a; source .env; set +a
DOMAIN="${DOMAIN:-tour.m4strip.com}"

echo "### 1/5 Yeni kod build edilir ..."
$COMPOSE build

echo "### 2/5 Servislər işə salınır (db, backend, frontend, nginx, certbot) ..."
$COMPOSE up -d

echo "### 3/5 DB hazır olana qədər gözlənilir ..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    echo "    DB hazırdır."
    break
  fi
  sleep 2
done

echo "### 4/5 Köhnə image-lər təmizlənir ..."
docker image prune -f >/dev/null 2>&1 || true

echo "### 5/5 Sağlamlıq yoxlanışı (/api/health) ..."
sleep 5
ok=0
for i in $(seq 1 15); do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    echo "    ✓ Backend sağlamdır (200)."
    ok=1
    break
  fi
  sleep 3
done

if [[ "$ok" != "1" ]]; then
  echo "    ! Health 200 qaytarmadı. Loglara bax:  $COMPOSE logs --tail=50 backend nginx" >&2
fi

echo ""
echo "✓ Deploy tamamlandı:  https://${DOMAIN}"
$COMPOSE ps
