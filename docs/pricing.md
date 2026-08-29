# Qiymət modeli (2026 cədvəli)

Bu sənəd `tur-qiymetleri-2026.pdf` cədvəlinin koda necə köçürüldüyünü izah edir.

## Dörd model

Hər kataloq turunun `pricing` sahəsi var; `model` onun formasını təyin edir:

| Model | Kimlər üçün | Vahid |
|---|---|---|
| `group_tiers` | Quba, Qəbələ, City Center, Qobustan/Abşeron, Gecə turu | 1–3 / 4 / 5–7 → qrupun ümumi məbləği; 8–10 / 11+ → nəfərbaşı |
| `flat_per_person` | Food masterclass | nəfərbaşı, qrup ölçüsündən asılı deyil |
| `per_vehicle` | 2 cip marşrutu | cip başına, `vehicle_capacity` = 4 |
| `on_request` | Rent a car, Hotel | qiymət göstərilmir |

Hər pillənin iki tarif sütunu var: `he` (İvrit dilli bələdçi) və `std`
(İngilis / Rus dilli). Cip turlarında dil fərqi yoxdur — yalnız `std` doldurulur
və `he` sorğusu ona düşür.

**Bələdçi dili saytın dilindən ayrıdır.** Saytı İvritdə oxumaq İvrit tarifi
demək deyil — bu, tur paketinin içindəki açıq seçimdir (`GuideLangSelect`).
Defolt `std`; İvrit dilli bələdçi onun üzərinə əlavə haqdır. Seçim
`localStorage`-da saxlanılır (`useGuideLang`), ona görə kataloq səhifəsi, tur
səhifəsi və rezervasiya pəncərəsi eyni dəyəri görür və sifarişlə birlikdə
`guide_lang` kimi backend-ə gedir.

## Minimum qrup məbləği hardcode edilmir

Cədvəlin 3-cü qaydası (Quba 400, Qəbələ 450, Qobustan 350 / 450) ayrıca saxlanmır.
Hamısı `10 × (8–10 tarifi)`-dir, yəni tək bir invariantdan çıxır:

> Böyük qrup kiçik qrupdan ucuz ödəyə bilməz.

Kod hər aşağı pilləni öz maksimum nəfər sayında hesablayır və nəticəni mərtəbə
kimi tətbiq edir. Bu, cədvəldəki dörd minimumu **eynilə** verir və 12 nəfərdən
sonra öz-özünə söndüyü üçün "12-dən başlayaraq 11+ tarifi normal işləyir" qeydi
də avtomatik ödənir. Tarif dəyişəndə minimumları əl ilə yeniləmək lazım deyil.

## Cip endirimi

`discounts: [{ when_pax_in_vehicle: 2, amount: 20 }]` — endirim **hər cipə
ayrıca** düşür, həmin cipdəki sərnişin sayına görə. 6 nəfər = 4 + 2 → ikinci cip
20 USD endirim alır (260 + 240 = 500).

> ⚠️ Bu, PDF-də açıq yazılmayıb. Əgər endirim yalnız ümumi 2 nəfərlik sifarişə
> aiddirsə, `quoteVehicles` dəyişməlidir.

## Üç güzgü — biri həqiqət

| Yer | Rolu |
|---|---|
| `backend/internal/pricing` | **Həqiqət mənbəyi.** Referans testləri burdadır (`pricing_test.go` cədvəlin bütün xanalarını yoxlayır). Sifarişin məbləği həmişə burda yenidən hesablanır. |
| `frontend-landing/src/lib/pricing.ts` | Nəfər sayı seçicisinin anlıq cavabı üçün. |
| `frontend/src/lib/utils/pricing.ts` | Admin formundakı canlı önizləmə üçün. |

Qaydanı dəyişəndə **üçü də** yenilənməlidir; Go testləri gözlənilən rəqəmlərin
siyahısıdır.

## Məbləğ sifarişdə dondurulur

`bookings` cədvəlinə `quoted_total`, `currency`, `guide_lang` əlavə olunub.
Backend məbləği kataloq matrisindən özü hesablayır — brauzerin göndərdiyi hər
hansı qiymət **nəzərə alınmır**. Beləcə cədvəl sonradan dəyişsə də razılaşdırılmış
məbləğ qalır.

## Saytda harada görünür

- **Ana səhifə** — 6 tur önizləmə, **qiymətsiz**, altında "Hamısına bax" düyməsi.
- **`/tours`** — tam kataloq. Filtrlər: kateqoriya, axtarış, **nəfər sayı**,
  **bələdçi dili**, **qiymət aralığı**, sıralama. Kartlardakı qiymət seçilmiş
  nəfər sayı + bələdçi dili üçün **real hesablamadır**, ona görə qiymət aralığı
  filtri eyni rəqəmlərlə işləyir.
- **`/tours/:slug`** — nəfər seçici + bələdçi dili + hesablanmış məbləğ + tam
  pillə cədvəli.

`/tours` artıq ana səhifənin bölmə lövbəri deyil (`SECTIONS`-dan çıxarılıb) —
`tours.index.tsx` real səhifədir və statik marşrut olduğu üçün `$section`-dan
üstündür.

## Endpoint

```
GET /api/public/catalog-tours/:slug/quote?pax=6&guide_lang=he
→ { total, per_person, currency, basis, pax, vehicles, guide_lang, on_request, floor_applied }
```

## Seed

`backend/seed/tours-2026.json` — 8 tur (5 qrup + 1 masterclass + 2 cip), beş
dildə (az, he, en, ru, ar) tam məzmunla. Admin API-si ilə yüklənir.

**Cip marşrutları:** PDF Masazır (160), Candy Cane (260) və Beşbarmaq (260)
sətirlərini ayrı göstərir, amma üçü eyni şimal marşrutunun dayanacaqlarıdır və
bir tur kimi satılır (sahibin qərarı). Ona görə kataloqda tək `cip-simal-marsrutu`
turu var, **260 USD / cip** tarifi ilə. Qobustan cip turu (160) cənubda ayrı
marşrut olduğu üçün ayrıca qalır.

## Hələ həll olunmayanlar

- **Rent a car / Hotel** — `on_request` modeli hazırdır, amma landing-də ayrıca
  "Əlavə xidmətlər" bölməsi yoxdur; hazırda kataloqda görünmürlər.
- **Uşaq qiyməti / sezon fərqi** cədvəldə yoxdur, modeldə də nəzərdə tutulmayıb.
