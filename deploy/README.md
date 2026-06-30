# 🚀 Tur Planlayıcı — Production Deploy Bələdçisi

Bu sənəd **tour.m4strip.com** subdomenini VPS serverdə sıfırdan canlıya çıxarmaq üçündür.

## Arxitektura

```
                      İnternet
                         │  (yalnız 80/443 açıq)
                         ▼
                   ┌───────────┐
                   │   nginx   │  TLS (Let's Encrypt), rate-limit,
                   │  (proxy)  │  security header-lər, gzip
                   └─────┬─────┘
              /api ──────┤────── /
                ▼        │        ▼
          ┌──────────┐   │   ┌──────────┐
          │ backend  │   │   │ frontend │
          │ Go/Fiber │   │   │ Next.js  │
          │  :8080   │   │   │  :3000   │
          └────┬─────┘   │   └──────────┘
               ▼         │
          ┌──────────┐   │   ┌──────────┐
          │ Postgres │   │   │ certbot  │  sertifikat
          │   :5432  │   │   │ (renew)  │  avtomatik yeniləmə
          └──────────┘   │   └──────────┘
        (yalnız daxili docker şəbəkəsi — host-a açıq deyil)
```

**Təhlükəsizlik:** yalnız `nginx` xaricə 80/443 açır. `db`, `backend`, `frontend`
host-da heç bir port açmır — internetdən birbaşa əlçatan deyillər.

---

## 0. Öncədən lazım olanlar

- VPS (Ubuntu 22.04 və ya 24.04), root/sudo SSH girişi
- DNS: `tour.m4strip.com` **A qeydi** serverin IP-sinə yönəlsin
  (m4strip.com idarə panelində: `Type=A, Name=tour, Value=<SERVER_IP>`)
- (istəyə bağlı) `@BotFather`-dan Telegram bot token-i və OpenAI açarı

DNS-in yayıldığını yoxla:
```bash
dig +short tour.m4strip.com    # serverin IP-sini qaytarmalıdır
```

---

## 1. Serveri hazırla (bir dəfə)

Serverə SSH ilə qoşul və repon-u götür:

```bash
ssh root@<SERVER_IP>
git clone https://github.com/abdnurlan/tourist-manager.git /opt/tour-planner
cd /opt/tour-planner
sudo bash deploy/scripts/provision.sh
```

`provision.sh` quracaq: **Docker + Compose, UFW firewall (22/80/443),
fail2ban, avtomatik təhlükəsizlik yenilənmələri, swap, iş qovluğu.**

---

## 2. Mühit dəyişənlərini doldur

```bash
cd /opt/tour-planner
cp .env.production.example .env
nano .env
```

Mütləq dəyiş:

| Dəyişən | Nə yaz |
|---|---|
| `POSTGRES_PASSWORD` | `openssl rand -base64 32` çıxışı |
| `DATABASE_URL` | eyni parolu içində yenilə (`...:PAROL@db:5432...`) |
| `JWT_SECRET` | `openssl rand -base64 48` çıxışı |
| `ADMIN_PASSWORD` | güclü admin parolu |
| `TELEGRAM_BOT_TOKEN` | @BotFather token-i (istəyə bağlı) |
| `TELEGRAM_ALLOWED_USER_ID` | öz Telegram id-n (@userinfobot) |
| `OPENAI_API_KEY` | OpenAI açarı (istəyə bağlı) |

> `DOMAIN`, `CORS_ORIGINS`, `NEXT_PUBLIC_API_URL`, `ACME_EMAIL` artıq
> tour.m4strip.com üçün doldurulub — yoxla, lazım olsa düzəlt.

Güclü secret yaratmaq:
```bash
openssl rand -base64 48      # JWT_SECRET
openssl rand -base64 32      # POSTGRES_PASSWORD
```

---

## 3. TLS sertifikatını al (bir dəfə)

```bash
bash deploy/scripts/init-ssl.sh
```

Bu skript dummy sertifikatla nginx-i qaldırır, sonra Let's Encrypt-dən
**real sertifikat** alıb nginx-i yeniləyir.

> Əvvəlcə test etmək istəsən (Let's Encrypt limitlərini yandırmamaq üçün):
> `bash deploy/scripts/init-ssl.sh 1`  → staging sertifikatı. İşləyəndə
> arxivi sil və `init-ssl.sh` (arqumentsiz) ilə real sertifikat al.

---

## 4. Tam deploy

```bash
bash deploy/scripts/deploy.sh
```

Build edir, bütün servisləri qaldırır, `/api/health` yoxlanışı edir.
Bitəndə: **https://tour.m4strip.com** açılmalıdır. 🎉

Login: `.env`-dəki `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

---

## 5. Telegram webhook (bot istifadə edirsənsə)

```bash
bash deploy/scripts/set-telegram-webhook.sh         # qeyd et
bash deploy/scripts/set-telegram-webhook.sh info    # statusu yoxla
```

---

## 6. Gündəlik backup (tövsiyə olunur)

```bash
bash deploy/scripts/install-cron.sh     # hər gecə 03:30 backup
bash deploy/scripts/backup.sh           # indi əl ilə backup
```

Backuplar: `/opt/tour-planner/backups/` (son 14 gün saxlanır).

Bərpa:
```bash
bash deploy/scripts/restore.sh /opt/tour-planner/backups/tourist_manager-YYYYMMDD-HHMMSS.sql.gz
```

---

## 7. CI/CD — avtomatik deploy (GitHub Actions)

`main`-ə hər push: **CI** (backend+frontend build/test) keçəndən sonra
**Deploy** workflow-u SSH ilə serverə girib `deploy.sh` işlədir.

GitHub repo → **Settings → Secrets and variables → Actions** → bu secret-ləri əlavə et:

| Secret | Dəyər |
|---|---|
| `SSH_HOST` | serverin IP-si |
| `SSH_USER` | `root` (və ya deploy istifadəçisi) |
| `SSH_KEY` | **private** SSH açarı (tam mətn) |
| `SSH_PORT` | `22` (fərqlidirsə dəyiş) |
| `DEPLOY_PATH` | `/opt/tour-planner` |

Deploy üçün SSH açarı yaratmaq (lokal maşında):
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/tour_deploy
ssh-copy-id -i ~/.ssh/tour_deploy.pub root@<SERVER_IP>
cat ~/.ssh/tour_deploy        # bunu SSH_KEY secret-inə yapışdır
```

Bundan sonra hər `git push origin main` avtomatik canlıya çıxarır.
Əl ilə də işə salmaq olar: Actions tab → **Deploy** → *Run workflow*.

---

## Gündəlik əməliyyatlar (şparqalka)

```bash
cd /opt/tour-planner
C="docker compose -f docker-compose.prod.yml --env-file .env"

$C ps                      # servislərin statusu
$C logs -f backend         # backend logları (canlı)
$C logs -f nginx           # nginx logları
$C restart backend         # bir servisi restart et
$C down                    # hamısını dayandır
bash deploy/scripts/deploy.sh   # yenidən deploy
```

---

## Problemlərin həlli

| Əlamət | Səbəb / Həll |
|---|---|
| `init-ssl.sh` sertifikat ala bilmir | DNS hələ yayılmayıb (`dig +short tour.m4strip.com`), və ya 80 portu bağlıdır (UFW yoxla) |
| Sayt açılır, login işləmir | `CORS_ORIGINS=https://tour.m4strip.com` düzdürmü? `$C logs backend` |
| Frontend `localhost`-a sorğu atır | `NEXT_PUBLIC_API_URL` build zamanı düz olmalıdır → `$C build --no-cache frontend` |
| 429 (Too Many Requests) | nginx rate-limit işləyir — normaldır; lazımsa `nginx.conf`-da `rate=` artır |
| Telegram bot susur | `set-telegram-webhook.sh info`; `TELEGRAM_ALLOWED_USER_ID` düzdürmü |
| Sertifikat bitir | certbot avtomatik yeniləyir; əl ilə: `$C run --rm certbot renew && $C exec nginx nginx -s reload` |

---

## Niyə bu "advanced" sayılır

- ✅ Tam konteynerləşmə — bir əmrlə təkrar qurula bilən stack
- ✅ Yalnız nginx açıqdır; DB/backend/frontend daxili şəbəkədə izolyasiya
- ✅ Avtomatik HTTPS (Let's Encrypt) + avtomatik yenilənmə
- ✅ Müasir TLS (1.2/1.3), HSTS, OCSP stapling, security header-lər
- ✅ Rate limiting (login üçün ayrıca sərt limit — brute-force qarşısı)
- ✅ Firewall (UFW) + fail2ban + avtomatik OS təhlükəsizlik yenilənmələri
- ✅ Gündəlik DB backup + rotasiya + asan bərpa
- ✅ CI/CD — push → test → avtomatik deploy
- ✅ Distroless backend image (minimal hücum səthi), non-root konteynerlər
- ✅ Healthcheck-lər + `restart: unless-stopped` (özünü bərpa)
