#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Tur Planlayıcı — Yeni serverin hazırlanması (Ubuntu 22.04/24.04)
#
# Bir DƏFƏ təmiz serverdə root (və ya sudo) ilə işlədilir. Quraşdırır:
#   • Docker Engine + Compose plugin
#   • UFW firewall (yalnız 22/80/443 açıq)
#   • fail2ban (SSH brute-force qoruması)
#   • Avtomatik təhlükəsizlik yenilənmələri (unattended-upgrades)
#   • Swap (RAM az olduqda)
#   • /opt/tour-planner iş qovluğu
#
# İstifadə (server üzərində):
#   sudo bash deploy/scripts/provision.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

if [[ $EUID -ne 0 ]]; then
  echo "Bu skript root ilə işlədilməlidir:  sudo bash $0" >&2
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

echo "### 1/7 Sistem yenilənir ..."
apt-get update -y
apt-get upgrade -y

echo "### 2/7 Əsas alətlər quraşdırılır ..."
apt-get install -y ca-certificates curl gnupg git ufw fail2ban unattended-upgrades

echo "### 3/7 Docker Engine + Compose quraşdırılır ..."
if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
else
  echo "    Docker artıq quraşdırılıb — keçilir."
fi

echo "### 4/7 Firewall (UFW) konfiqurasiya edilir ..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp   comment 'SSH'
ufw allow 80/tcp   comment 'HTTP'
ufw allow 443/tcp  comment 'HTTPS'
ufw --force enable
ufw status verbose

echo "### 5/7 fail2ban (SSH qoruması) ..."
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true
EOF
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "### 6/7 Avtomatik təhlükəsizlik yenilənmələri ..."
cat > /etc/apt/apt.conf.d/20auto-upgrades <<'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
EOF

echo "### 7/7 Swap yoxlanır (RAM az olduqda 2G əlavə) ..."
if ! swapon --show | grep -q . && [[ ! -f /swapfile ]]; then
  total_mb=$(free -m | awk '/^Mem:/{print $2}')
  if [[ "$total_mb" -lt 2048 ]]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    echo "    2G swap əlavə edildi."
  else
    echo "    RAM kifayətdir — swap əlavə edilmədi."
  fi
else
  echo "    Swap artıq mövcuddur — keçilir."
fi

mkdir -p /opt/tour-planner

echo ""
echo "✓ Server hazırdır."
echo "  Növbəti addımlar:"
echo "   1) git clone https://github.com/abdnurlan/tourist-manager.git /opt/tour-planner"
echo "   2) cd /opt/tour-planner && cp .env.production.example .env && nano .env"
echo "   3) bash deploy/scripts/setup-origin-cert.sh   # Cloudflare Origin Cert"
echo "   4) bash deploy/scripts/deploy.sh"
echo "   5) bash deploy/scripts/install-cron.sh        # gündəlik backup"
echo "   6) sudo bash deploy/scripts/cloudflare-firewall.sh  # (tövsiyə) origin-i CF-ə kilidlə"
