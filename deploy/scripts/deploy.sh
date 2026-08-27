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

echo "### 1/6 Yeni kod build edilir ..."
$COMPOSE build

echo "### 2/6 Servislər işə salınır (db, backend, frontend, nginx, certbot) ..."
$COMPOSE up -d

echo "### 3/6 nginx konfiqurasiyası yenidən yüklənir ..."
# nginx.conf və conf.d/ bind-mount-dur: fayl dəyişsə də `up -d` nginx-i yenidən
# qurmur, yəni yeni konfiqurasiya işə düşmür. Bundan başqa backend/frontend
# konteynerləri hər deploy-da yeni IP alır, nginx isə upstream host adlarını
# yalnız konfiqurasiya yüklənərkən çözür — reload olmasa köhnə IP-yə bağlanıb
# "connection refused" alır. Reload hər iki problemi həll edir.
if $COMPOSE exec -T nginx nginx -t >/dev/null 2>&1; then
  $COMPOSE exec -T nginx nginx -s reload
  echo "    nginx reload edildi."
else
  echo "    ! nginx -t uğursuz oldu — reload edilmədi, köhnə konfiqurasiya qalır:" >&2
  $COMPOSE exec -T nginx nginx -t >&2 || true
fi

echo "### 4/6 DB hazır olana qədər gözlənilir ..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
    echo "    DB hazırdır."
    break
  fi
  sleep 2
done

echo "### 5/6 Köhnə image-lər təmizlənir ..."
docker image prune -f >/dev/null 2>&1 || true

echo "### 6/6 Sağlamlıq yoxlanışı (/api/health, birbaşa origin) ..."
# Cloudflare-dən asılı olmamaq üçün birbaşa origin nginx-ə (localhost) sorğu;
# -k: origin cert localhost üçün deyil, -H Host: düzgün server blokunu seçir.
sleep 5
ok=0
for i in $(seq 1 15); do
  code=$(curl -sk -o /dev/null -w "%{http_code}" -H "Host: ${DOMAIN}" "https://127.0.0.1/api/health" 2>/dev/null || echo "000")
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
