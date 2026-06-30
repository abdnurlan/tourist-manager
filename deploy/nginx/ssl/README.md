# TLS sertifikatları (git-ignored)

Bu qovluğa **Cloudflare Origin Certificate** qoyulur. Fayllar git-ə
DÜŞMÜR (yalnız bu README izlənir) — private key heç vaxt commit olunmamalıdır.

İki fayl lazımdır:

| Fayl | Mənbə (Cloudflare paneli) |
|---|---|
| `origin.pem` | SSL/TLS → Origin Server → Create Certificate → **Origin Certificate** bloku |
| `origin.key` | eyni səhifədə → **Private Key** bloku |

Avtomatik yerləşdirmək üçün:

```bash
bash deploy/scripts/setup-origin-cert.sh
```

Bu skript faylları yaradır, sertifikat/açar uyğunluğunu yoxlayır,
icazələri qoyur (`origin.key` → 600) və nginx-i reload edir.

> İstəyə bağlı: `cloudflare-origin-pull-ca.pem` (Authenticated Origin Pulls
> üçün) — yalnız Cloudflare-in qoşulmasına icazə vermək istəsən.
