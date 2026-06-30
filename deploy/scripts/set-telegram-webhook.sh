#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Telegram webhook qeydiyyatı
#
# TELEGRAM_MODE=webhook olduqda Telegram-a yeni update-ləri
# https://DOMAIN/api/telegram/webhook ünvanına göndərməyi bildirir.
#
# İstifadə:  bash deploy/scripts/set-telegram-webhook.sh
#   Statusu yoxla:  bash deploy/scripts/set-telegram-webhook.sh info
#   Sil:            bash deploy/scripts/set-telegram-webhook.sh delete
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü
set -a; source .env; set +a

TOKEN="${TELEGRAM_BOT_TOKEN:?TELEGRAM_BOT_TOKEN .env-də boşdur}"
DOMAIN="${DOMAIN:?DOMAIN .env-də boşdur}"
WEBHOOK_URL="https://${DOMAIN}/api/telegram/webhook"
ACTION="${1:-set}"

case "$ACTION" in
  info)
    curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" | sed 's/,/,\n/g'
    ;;
  delete)
    curl -s "https://api.telegram.org/bot${TOKEN}/deleteWebhook"
    echo ""
    ;;
  set)
    echo "Webhook təyin edilir: $WEBHOOK_URL"
    curl -s -F "url=${WEBHOOK_URL}" \
         -F "drop_pending_updates=true" \
         "https://api.telegram.org/bot${TOKEN}/setWebhook"
    echo ""
    echo "Yoxlama:"
    curl -s "https://api.telegram.org/bot${TOKEN}/getWebhookInfo" | sed 's/,/,\n/g'
    ;;
  *)
    echo "Naməlum əmr: $ACTION (set|info|delete)" >&2
    exit 1
    ;;
esac
