#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Origin-i yalnız Cloudflare-ə kilidlə (UFW)
#
# 80/443 portlarını YALNIZ Cloudflare IP aralıqlarına açır. Beləliklə
# hücumçu origin IP-ni tapsa belə, birbaşa qoşula bilmir — Cloudflare-i
# (WAF/DDoS qoruması) keçmək məcburiyyətindədir. SSH (22) açıq qalır.
#
# Tətbiq ALTI bütün trafik Cloudflare-dən gəlməlidir (proxy ON).
# İstifadə (server, root):  sudo bash deploy/scripts/cloudflare-firewall.sh
# Geri qaytarmaq:           sudo bash deploy/scripts/cloudflare-firewall.sh reset
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "root ilə işlət: sudo bash $0" >&2; exit 1; fi

ACTION="${1:-apply}"

if [[ "$ACTION" == "reset" ]]; then
  echo "### 80/443 hamıya açılır (Cloudflare kilidi götürülür) ..."
  # CF qaydalarını sil.
  while ufw status numbered | grep -qE '80,443/tcp'; do
    n=$(ufw status numbered | grep -E '80,443/tcp' | head -1 | sed -E 's/^\[ *([0-9]+)\].*/\1/')
    yes | ufw delete "$n" >/dev/null
  done
  ufw allow 80/tcp comment 'HTTP'
  ufw allow 443/tcp comment 'HTTPS'
  ufw reload
  ufw status verbose
  exit 0
fi

echo "### Cloudflare IP aralıqları endirilir ..."
RANGES=$(curl -fsSL https://www.cloudflare.com/ips-v4; echo; curl -fsSL https://www.cloudflare.com/ips-v6)
[[ -n "$RANGES" ]] || { echo "XƏTA: IP siyahısı boşdur." >&2; exit 1; }

echo "### Köhnə açıq 80/443 qaydaları silinir ..."
ufw delete allow 80/tcp  >/dev/null 2>&1 || true
ufw delete allow 443/tcp >/dev/null 2>&1 || true

echo "### 80/443 yalnız Cloudflare-ə açılır ..."
while read -r cidr; do
  [[ -z "$cidr" ]] && continue
  ufw allow from "$cidr" to any port 80,443 proto tcp comment 'Cloudflare' >/dev/null
done <<< "$RANGES"

# SSH açıq qalsın (lockout qarşısı).
ufw allow 22/tcp comment 'SSH' >/dev/null || true
ufw reload

echo "✓ Origin artıq yalnız Cloudflare-dən əlçatandır."
ufw status verbose | grep -E '22|80,443|Cloudflare' | head -30
echo "Geri qaytarmaq: sudo bash deploy/scripts/cloudflare-firewall.sh reset"
