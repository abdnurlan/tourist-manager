#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Cloudflare Origin Certificate quraşdırması
#
# Cloudflare paneli → SSL/TLS → Origin Server → Create Certificate.
# İki blok verilir:
#   • Origin Certificate  -> deploy/nginx/ssl/origin.pem
#   • Private Key         -> deploy/nginx/ssl/origin.key
#
# Bu skript faylları yaratmağa kömək edir, doğrulayır, icazələri qoyur,
# və nginx işləyirsə reload edir.
#
# İstifadə:  bash deploy/scripts/setup-origin-cert.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü
SSL_DIR="deploy/nginx/ssl"
CRT="$SSL_DIR/origin.pem"
KEY="$SSL_DIR/origin.key"
mkdir -p "$SSL_DIR"

paste_into() {
  local target="$1" label="$2"
  echo ""
  echo ">>> $label mətnini yapışdır, sonra yeni sətirdə Ctrl-D bas:"
  cat > "$target"
}

# Fayllar yoxdursa interaktiv yapışdırma.
if [[ ! -s "$CRT" ]]; then
  paste_into "$CRT" "Origin Certificate (-----BEGIN CERTIFICATE-----)"
fi
if [[ ! -s "$KEY" ]]; then
  paste_into "$KEY" "Private Key (-----BEGIN PRIVATE KEY-----)"
fi

echo ""
echo "### Doğrulama ..."
if ! openssl x509 -in "$CRT" -noout 2>/dev/null; then
  echo "XƏTA: $CRT düzgün sertifikat deyil." >&2; exit 1
fi
if ! openssl pkey -in "$KEY" -noout 2>/dev/null; then
  echo "XƏTA: $KEY düzgün açar deyil." >&2; exit 1
fi

# Sertifikat və açarın bir-birinə uyğunluğu (public key müqayisəsi).
crt_pub=$(openssl x509 -in "$CRT" -noout -pubkey 2>/dev/null)
key_pub=$(openssl pkey -in "$KEY" -pubout 2>/dev/null)
if [[ "$crt_pub" != "$key_pub" ]]; then
  echo "XƏTA: sertifikat və açar UYĞUN DEYİL." >&2; exit 1
fi

# İcazələr: açar yalnız sahibə oxunsun.
chmod 600 "$KEY"
chmod 644 "$CRT"

echo "✓ Sertifikat və açar uyğundur. Müddət:"
openssl x509 -in "$CRT" -noout -dates | sed 's/^/    /'

# nginx işləyirsə config test + reload.
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
if docker ps --format '{{.Names}}' 2>/dev/null | grep -q turplanlayici_nginx; then
  echo "### nginx config test + reload ..."
  $COMPOSE exec nginx nginx -t && $COMPOSE exec nginx nginx -s reload
  echo "✓ nginx yeniləndi."
else
  echo "ℹ nginx hələ işləmir — sonra:  bash deploy/scripts/deploy.sh"
fi

echo ""
echo "Növbəti: Cloudflare paneldə SSL/TLS → Overview → 'Full (Strict)' seç."
