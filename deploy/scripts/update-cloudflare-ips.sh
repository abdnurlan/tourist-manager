#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Cloudflare IP aralıqlarını yenilə
#
# cloudflare-realip.conf faylını Cloudflare-in cari IP siyahısı ilə
# yenidən yaradır. Aralıqlar nadir dəyişir; ildə bir-iki dəfə işlət.
#
# İstifadə:  bash deploy/scripts/update-cloudflare-ips.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü
OUT="deploy/nginx/conf.d/cloudflare-realip.conf"

echo "### Cloudflare IP aralıqları endirilir ..."
V4=$(curl -fsSL https://www.cloudflare.com/ips-v4)
V6=$(curl -fsSL https://www.cloudflare.com/ips-v6)

if [[ -z "$V4" || -z "$V6" ]]; then
  echo "XƏTA: IP siyahısı endirilə bilmədi." >&2; exit 1
fi

{
  echo "# Cloudflare real ziyarətçi IP-si — update-cloudflare-ips.sh tərəfindən yaradılıb."
  echo "# Mənbə: https://www.cloudflare.com/ips/"
  echo ""
  echo "$V4" | while read -r cidr; do [[ -n "$cidr" ]] && echo "set_real_ip_from $cidr;"; done
  echo "$V6" | while read -r cidr; do [[ -n "$cidr" ]] && echo "set_real_ip_from $cidr;"; done
  echo ""
  echo "real_ip_header CF-Connecting-IP;"
  echo "real_ip_recursive on;"
} > "$OUT"

echo "✓ $OUT yeniləndi ($(grep -c set_real_ip_from "$OUT") aralıq)."

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q turplanlayici_nginx; then
  $COMPOSE exec nginx nginx -t && $COMPOSE exec nginx nginx -s reload && echo "✓ nginx reload edildi."
fi
