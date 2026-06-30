# 🚀 Tur Planlayıcı — Production Deploy Bələdçisi

**tour.m4strip.com** subdomenini VPS-də canlıya çıxarmaq üçün (Cloudflare proxy ON + Origin Certificate).

## Arxitektura

```
   Brauzer
      │  HTTPS (Cloudflare Universal SSL)
      ▼
┌─────────────────┐
│   CLOUDFLARE    │  DDoS qoruması, CDN, WAF, gizli origin IP
│  (proxy / WAF)  │
└────────┬────────┘
         │  HTTPS — Full (Strict), Origin Certificate
         ▼  (origin yalnız Cloudflare-ə açıq — cloudflare-firewall.sh)
   ┌───────────┐
   │   nginx   │  TLS, rate-limit, security header-lər, gzip,
   │  (origin) │  real ziyarətçi IP (CF-Connecting-IP)
   └─────┬─────┘
   /api ─┤─ /
     ▼   │   ▼
┌────────┐│┌──────────┐
│backend ││ frontend  │
│Go :8080│││Next :3000│
└───┬────┘│└──────────┘
    ▼     │
┌────────┐│   (db/backend/frontend yalnız daxili docker şəbəkəsi —
│Postgres││    host-a port açmırlar)
└────────┘│
```

---

## 0. Öncədən lazım olanlar

- VPS (Ubuntu 22.04/24.04), root/sudo SSH girişi
- Domen Cloudflare-də (m4strip.com)
- (istəyə bağlı) Telegram bot token-i, OpenAI açarı

---

## 1. Cloudflare DNS + SSL (panel)

1. **DNS → Records:** A qeydi əlavə et
   - Type=`A`, Name=`tour`, IPv4=`<SERVER_IP>`, **Proxy status = Proxied (narıncı bulud)** ✅
2. **SSL/TLS → Overview:** rejimi **Full (Strict)** seç
   > ⚠️ "Flexible" SEÇMƏ — sayt "Too many redirects" verəcək.
3. **SSL/TLS → Edge Certificates:** "Always Use HTTPS" → ON
4. **SSL/TLS → Origin Server → Create Certificate:**
   - Hostname: `tour.m4strip.com` (və ya `*.m4strip.com`)
   - İki bloku saxla: **Origin Certificate** və **Private Key** (sonra serverə qoyacağıq)

Yayılmanı yoxla:
```bash
dig +short tour.m4strip.com    # Cloudflare IP-lərini qaytarmalıdır (104.x / 172.x)
```

---

## 2. Serveri hazırla (bir dəfə)

```bash
ssh root@<SERVER_IP>
git clone https://github.com/abdnurlan/tourist-manager.git /opt/tour-planner
cd /opt/tour-planner
sudo bash deploy/scripts/provision.sh
```

Quracaq: **Docker + Compose, UFW firewall, fail2ban, auto-updates, swap.**

---

## 3. Mühit dəyişənləri

```bash
cd /opt/tour-planner
cp .env.production.example .env
nano .env
```

Mütləq dəyiş:

| Dəyişən | Nə yaz |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` |
| `DATABASE_URL` | eyni parolu içində yenilə |
| `JWT_SECRET` | `openssl rand -base64 48` |
| `ADMIN_PASSWORD` | güclü admin parolu |
| `TELEGRAM_BOT_TOKEN` | @BotFather token-i (istəyə bağlı) |
| `TELEGRAM_ALLOWED_USER_ID` | öz Telegram id-n (@userinfobot) |
| `OPENAI_API_KEY` | OpenAI açarı (istəyə bağlı) |

> `DOMAIN`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL` artıq tour.m4strip.com üçün doludur.

---

## 4. Cloudflare Origin Certificate-i yerləşdir

```bash
bash deploy/scripts/setup-origin-cert.sh
```

Skript Origin Certificate və Private Key-i istəyəcək (yapışdır → Ctrl-D),
uyğunluğu yoxlayacaq, icazələri quracaq. Fayllar `deploy/nginx/ssl/`-ə
gedir və **git-ə düşmür**.

---

## 5. Tam deploy

```bash
bash deploy/scripts/deploy.sh
```

Build edir, bütün servisləri qaldırır, origin sağlamlığını (`/api/health`)
yoxlayır. Bitəndə: **https://tour.m4strip.com** 🎉

Login: `.env`-dəki `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

---

## 6. Origin-i Cloudflare-ə kilidlə (tövsiyə olunan hardening)

```bash
sudo bash deploy/scripts/cloudflare-firewall.sh
```

80/443-ü yalnız Cloudflare IP-lərinə açır — hücumçu origin IP-ni tapsa belə
birbaşa qoşula bilmir. Geri: `... cloudflare-firewall.sh reset`.

---

## 7. Telegram webhook (bot istifadə edirsənsə)

```bash
bash deploy/scripts/set-telegram-webhook.sh         # qeyd et
bash deploy/scripts/set-telegram-webhook.sh info    # statusu yoxla
```

---

## 8. Gündəlik backup

```bash
bash deploy/scripts/install-cron.sh     # hər gecə 03:30
bash deploy/scripts/backup.sh           # indi əl ilə
```

Backuplar: `/opt/tour-planner/backups/` (son 14 gün). Bərpa:
```bash
bash deploy/scripts/restore.sh /opt/tour-planner/backups/tourist_manager-YYYYMMDD-HHMMSS.sql.gz
```

---

## 8b. Production datasını lokalda görmək

Lokal və production **ayrı bazalardır** (lokal data ≠ prod data). Lokalda
real production datası ilə işləmək istəsən, surətini çək:

```bash
bash deploy/scripts/pull-prod-db.sh root@<SERVER_IP>
```

Bu skript prod-dan dump götürür, lokal bazanın üstünə yükləyir (təsdiqlə).
- ✅ Lokal dəyişikliklərin production-a **təsir etmir**
- ℹ️ Birdəfəlik surətdir — təzə data üçün yenidən işlət
- Snapshot faylı (`prod-snapshot-*.sql.gz`) saxlanılır, git-ə düşmür

---

## 9. CI/CD — avtomatik deploy (GitHub Actions)

`main`-ə hər push: **CI** keçəndən sonra **Deploy** SSH ilə `deploy.sh` işlədir.

GitHub repo → **Settings → Secrets and variables → Actions**:

| Secret | Dəyər |
|---|---|
| `SSH_HOST` | serverin **real IP**-si (Cloudflare deyil!) |
| `SSH_USER` | `root` |
| `SSH_KEY` | **private** SSH açarı (tam mətn) |
| `SSH_PORT` | `22` |
| `DEPLOY_PATH` | `/opt/tour-planner` |

> Qeyd: SSH origin IP-yə gedir. `cloudflare-firewall.sh` yalnız 80/443-ü
> kilidləyir, 22 açıq qalır — GitHub Actions SSH işləyəcək.

Deploy SSH açarı (lokal maşında):
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/tour_deploy
ssh-copy-id -i ~/.ssh/tour_deploy.pub root@<SERVER_IP>
cat ~/.ssh/tour_deploy        # SSH_KEY secret-inə yapışdır
```

---

## Gündəlik əməliyyatlar

```bash
cd /opt/tour-planner
C="docker compose -f docker-compose.prod.yml --env-file .env"
$C ps                  # status
$C logs -f backend     # backend logları
$C restart backend     # restart
bash deploy/scripts/deploy.sh   # yenidən deploy
```

---

## Problemlərin həlli

| Əlamət | Səbəb / Həll |
|---|---|
| **Too many redirects** | Cloudflare SSL "Flexible"-dədir → **Full (Strict)** et |
| Sayt 521/522 (CF) | Origin işləmir/əlçatmaz: `$C ps`, firewall 443 CF-ə açıqdır? |
| Bütün istifadəçilər 429 | real-IP işləmir → `cloudflare-realip.conf` yüklənib? `$C exec nginx nginx -T \| grep real_ip` |
| Frontend `localhost`-a sorğu atır | `NEXT_PUBLIC_API_URL` build zamanı düz olmalı → `$C build --no-cache frontend` |
| `setup-origin-cert.sh` "uyğun deyil" | Cert və key fərqli cütdəndir — CF-də yenidən yarat |
| Telegram bot susur | `set-telegram-webhook.sh info`; webhook URL HTTPS olmalı |
| Sertifikat müddəti | Origin Cert 15 il — narahat olma. CF Universal SSL avtomatikdir |

---

## Niyə bu "advanced/mükəmməl" sayılır

- ✅ Cloudflare öndə — DDoS, CDN, WAF, gizli origin IP
- ✅ Origin yalnız Cloudflare-ə açıq (firewall) — birbaşa hücum mümkün deyil
- ✅ Full (Strict) uçdan-uca şifrələmə + 15 illik Origin Cert (renewal dərdi yox)
- ✅ Real ziyarətçi IP bərpası — rate-limit və loglar düzgün işləyir
- ✅ Tam konteynerləşmə; db/backend/frontend daxili şəbəkədə izolyasiya
- ✅ Rate limiting (login üçün ayrıca sərt limit), security header-lər, HSTS
- ✅ UFW + fail2ban + avtomatik OS təhlükəsizlik yenilənmələri
- ✅ Gündəlik DB backup + rotasiya + asan bərpa
- ✅ CI/CD — push → test → avtomatik deploy
- ✅ Distroless backend, non-root konteynerlər, healthcheck + auto-restart
