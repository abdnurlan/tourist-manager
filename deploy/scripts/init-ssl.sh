#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — İLK DƏFƏ TLS sertifikatı qurulması
#
# Problem: nginx ssl_certificate olmadan başlaya bilmir, amma Certbot
# sertifikat almaq üçün işləyən nginx-ə ehtiyac duyur (ACME challenge).
# Həll: əvvəlcə müvəqqəti (dummy) self-signed sertifikat yarat ki nginx
# qalxsın, sonra onu silib Let's Encrypt-dən real sertifikat al.
#
# Yalnız BİR DƏFƏ işlədilir (deploy-dan əvvəl). Sonrakı yenilənmələri
# certbot konteyneri avtomatik edir.
#
# İstifadə:  bash deploy/scripts/init-ssl.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"

if [[ ! -f .env ]]; then
  echo "XƏTA: .env tapılmadı. Əvvəlcə: cp .env.production.example .env && nano .env" >&2
  exit 1
fi

# .env-dən DOMAIN və ACME_EMAIL oxu.
set -a; source .env; set +a
DOMAIN="${DOMAIN:?DOMAIN .env-də təyin edilməyib}"
EMAIL="${ACME_EMAIL:?ACME_EMAIL .env-də təyin edilməyib}"
STAGING="${1:-0}"   # 1 versən Let's Encrypt staging (test) istifadə olunur

CERT_PATH="/etc/letsencrypt/live/$DOMAIN"
RSA_KEY_SIZE=4096

echo "### 1/5 Dummy sertifikat yaradılır ($DOMAIN) ..."
# --entrypoint sh + əmri service adından SONRA -c ilə ötürürük ki, mürəkkəb
# shell sətri düzgün parçalansın (tək sətir — tırnaq problemi olmasın).
$COMPOSE run --rm --entrypoint sh certbot -c "\
  mkdir -p $CERT_PATH && \
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout $CERT_PATH/privkey.pem \
    -out $CERT_PATH/fullchain.pem \
    -subj /CN=localhost && \
  cp $CERT_PATH/fullchain.pem $CERT_PATH/chain.pem"

echo "### 2/5 nginx başladılır (dummy sertifikatla) ..."
$COMPOSE up -d nginx
sleep 3

echo "### 3/5 Dummy sertifikat silinir ..."
$COMPOSE run --rm --entrypoint sh certbot -c "\
  rm -rf /etc/letsencrypt/live/$DOMAIN \
    /etc/letsencrypt/archive/$DOMAIN \
    /etc/letsencrypt/renewal/$DOMAIN.conf"

echo "### 4/5 Let's Encrypt-dən real sertifikat istənilir ..."
STAGING_ARG=""
if [[ "$STAGING" != "0" ]]; then
  STAGING_ARG="--staging"
  echo "    (STAGING/test rejimi)"
fi
# Compose-dakı certbot servisinin entrypoint-i (renewal döngüsü) burada
# --entrypoint certbot ilə əvəzlənir ki, certonly düzgün işləsin.
$COMPOSE run --rm --entrypoint certbot certbot \
  certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    --rsa-key-size "$RSA_KEY_SIZE" \
    --agree-tos \
    --no-eff-email \
    --force-renewal

echo "### 5/5 nginx reload edilir ..."
$COMPOSE exec nginx nginx -s reload || $COMPOSE up -d --force-recreate nginx

echo ""
echo "✓ TLS hazırdır: https://$DOMAIN"
echo "  İndi tam deploy üçün:  bash deploy/scripts/deploy.sh"
