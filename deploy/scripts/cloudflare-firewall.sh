#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Origin-i yalnız Cloudflare-ə kilidlə
#
# 80/443 portlarını YALNIZ Cloudflare IP aralıqlarına açır. Beləliklə
# hücumçu origin IP-ni tapsa belə birbaşa qoşula bilmir — Cloudflare-in
# WAF/DDoS qorumasını keçmək məcburiyyətindədir. SSH (22) açıq qalır.
#
# VACİB: Docker published-portlar (80/443) üçün UFW İŞLƏMİR — Docker öz
# iptables qaydalarını UFW-dən əvvəl qoyur. Ona görə Docker-in hörmət
# etdiyi DOCKER-USER zəncirindən istifadə edirik.
#
# İstifadə (server, root):  sudo bash deploy/scripts/cloudflare-firewall.sh
# Geri qaytarmaq:           sudo bash deploy/scripts/cloudflare-firewall.sh reset
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $EUID -ne 0 ]]; then echo "root ilə işlət: sudo bash $0" >&2; exit 1; fi
ACTION="${1:-apply}"
TAG="cf-origin-lock"

# Əvvəlki TAG-li qaydaları təmizlə (idempotent), həm v4 həm v6.
clean_rules() {
  local ipt
  for ipt in iptables ip6tables; do
    while $ipt -S DOCKER-USER 2>/dev/null | grep -q -- "--comment $TAG"; do
      local rule
      rule=$($ipt -S DOCKER-USER | grep -- "--comment $TAG" | head -1 | sed 's/^-A/-D/')
      eval "$ipt $rule" 2>/dev/null || break
    done
  done
}

if [[ "$ACTION" == "reset" ]]; then
  clean_rules
  netfilter-persistent save 2>/dev/null || true
  echo "Cloudflare kilidi götürüldü (80/443 hamıya açıq)."
  exit 0
fi

echo "### Cloudflare IP aralıqları endirilir ..."
V4=$(curl -fsSL https://www.cloudflare.com/ips-v4)
V6=$(curl -fsSL https://www.cloudflare.com/ips-v6)
[[ -n "$V4" && -n "$V6" ]] || { echo "XƏTA: IP siyahısı boşdur." >&2; exit 1; }

clean_rules

# DROP-u ƏVVƏL əlavə edirik ki, ACCEPT-lər (sonra -I ilə yuxarı qoyulur)
# ondan ƏVVƏL gəlsin. Nəticə sırası: [CF ACCEPT...] [DROP] [default].
iptables  -I DOCKER-USER -p tcp -m multiport --dports 80,443 -m comment --comment "$TAG" -j DROP
ip6tables -I DOCKER-USER -p tcp -m multiport --dports 80,443 -m comment --comment "$TAG" -j DROP

while read -r c; do [[ -n "$c" ]] && \
  iptables -I DOCKER-USER -s "$c" -p tcp -m multiport --dports 80,443 -m comment --comment "$TAG" -j ACCEPT
done <<< "$V4"
while read -r c; do [[ -n "$c" ]] && \
  ip6tables -I DOCKER-USER -s "$c" -p tcp -m multiport --dports 80,443 -m comment --comment "$TAG" -j ACCEPT
done <<< "$V6"

# Reboot-dan sonra qalması üçün saxla.
DEBIAN_FRONTEND=noninteractive apt-get install -y netfilter-persistent iptables-persistent >/dev/null 2>&1 || true
netfilter-persistent save >/dev/null 2>&1 || true

echo "✓ Origin artıq yalnız Cloudflare-dən əlçatandır (DOCKER-USER)."
echo "  v4 qayda: $(iptables -S DOCKER-USER | grep -c "$TAG"), v6 qayda: $(ip6tables -S DOCKER-USER | grep -c "$TAG")"
echo "  Geri qaytarmaq: sudo bash deploy/scripts/cloudflare-firewall.sh reset"
