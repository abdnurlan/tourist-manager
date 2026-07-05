# Dizayn: Qonaqlar (Guest) sistemi + Tip-spesifik tədbir yaratma

Tarix: 2026-07-06
Status: Təsdiq gözlənilir

## Məqsəd

Tur bələdçisi üçün iki dəyişiklik:

1. **Qonaq (turist) sistemi** — tura turist siyahısı əlavə etmək, hər turistin
   detalını (ad, telefon, pasport, millət, qeyd) saxlamaq. Sonra tədbirlərdə
   "bu tədbirdə kim iştirak edir" seçilir.
2. **Tip-spesifik tədbir yaratma** — universal "Tədbir əlavə et" düyməsi əvəzinə,
   hər günün altında birbaşa **Transfer / Otel / Restoran / Digər** düymələri.
   Hansına basılırsa, həmin tipə uyğun forma açılır — hər tipin öz sahələri var,
   hamısı eyni deyil.

## Miqyas

Backend (Postgres migration + API) + Frontend. İki alt-hissə:
- **A blok:** Qonaq sistemi (guests cədvəli, guest↔event əlaqəsi, API, UI).
- **B blok:** Tip-spesifik tədbirlər (events.details JSONB, tipə uyğun formalar, düymələr).

---

## A blok — Qonaq (Guest) sistemi

### Data modeli

Yeni cədvəl `guests` (tura bağlı):

| Sahə | Tip | Məcburi | Qeyd |
|------|-----|---------|------|
| id | uuid | — | PK |
| tour_id | uuid | ✓ | FK → tours, ON DELETE CASCADE |
| full_name | text | ✓ | yeganə məcburi sahə |
| phone | text | — | |
| passport | text | — | pasport nömrəsi |
| nationality | text | — | vətəndaşlıq/millət |
| notes | text | — | allergiya, xüsusi istək |
| created_at / updated_at | timestamptz | — | |

Qonaq↔Tədbir əlaqəsi (many-to-many) — yeni cədvəl `event_guests`:

| Sahə | Tip | Qeyd |
|------|-----|------|
| event_id | uuid | FK → events, ON DELETE CASCADE |
| guest_id | uuid | FK → guests, ON DELETE CASCADE |
| PK (event_id, guest_id) | | təkrarın qarşısını alır |

**Qeyd:** Mövcud `events.participants` (sərbəst mətn) sahəsi **saxlanılır** (köhnə data
sınmasın), amma yeni UI onu göstərməyəcək — yerinə struktur qonaq seçimi gələcək.

### Backend API

Yeni route qrupu (tur altında):
- `GET    /api/tours/:id/guests` — turun qonaq siyahısı
- `POST   /api/tours/:id/guests` — qonaq əlavə et (body: full_name + optional sahələr)
- `PATCH  /api/guests/:guestId` — qonağı redaktə et
- `DELETE /api/guests/:guestId` — qonağı sil

Tədbir yaratma/redaktə (`POST /tours/:id/events`, `PATCH /events/:id`) genişlənir:
- body-yə `guest_ids: []uuid` əlavə olunur → `event_guests` sinxronlaşdırılır.
- Tədbir cavabına `guests: [{id, full_name}]` daxil edilir (göstərmək üçün).

Fayllar: yeni `guest_handler.go`, `guest_service.go`, `guest_repository.go`,
`models/guest.go`. `event_service`/`event_repository` guest_ids sinxronu üçün yenilənir.

### Frontend UI

Tur detal səhifəsində (`tours/[id]/page.tsx`) tur məlumatı ilə günlər arasında
yeni **"Qonaqlar (N)"** bölməsi:
- Turist kartları siyahısı (ad + telefon qısa göstərişi).
- "➕ Qonaq əlavə et" düyməsi → bottom-sheet forma (ad məcburi, qalanı optional).
- Karta basanda → həmin qonağın detal/redaktə sheet-i.
- Silmə təsdiqlə.

Komponentlər: `components/tour-detail/guest-section.tsx`, `guest-form-sheet.tsx`,
`guest-card.tsx`. API: `lib/api/guests.ts`, hook `lib/hooks/use-guests.ts`.

---

## B blok — Tip-spesifik tədbir yaratma

### Data modeli

`events` cədvəlinə bir yeni sütun: **`details JSONB`** (nullable).
Hər tip öz açarlarını ora yazır. Ayrı sütun/cədvəl açılmır — çevik, migration sadə.

Tip → details açarları:

| Tip | details açarları |
|-----|------------------|
| `transfer` | `from`, `to`, `driver`, `driver_phone` |
| `hotel` | `hotel_name`, `address`, `check_in` (date), `check_out` (date), `room` |
| `restaurant` | `venue`, `address`, `reservation_time` (HH:mm), `party_size` (int) |
| `other` | (details boş — yalnız ortaq sahələr) |

**Ortaq sahələr** (bütün tiplərdə, mövcud sütunlarda qalır): `title`, `date`, `time`,
`price`, `currency`, `payment_status`, `reminder_time`, `notes` + yeni `guest_ids`.

Köhnə tədbir tipləri (`tour`, `flight`, `note`) enum-da qalır (köhnə data sınmasın),
amma yaratma UI-da göstərilmir. Redaktədə köhnə bu tipli tədbir açılırsa, "Digər"
kimi ortaq sahələrlə göstərilir.

### Backend API

- `event_service` details JSON-u qəbul edib validasiya edir (tipə görə açar yoxlaması
  yumşaqdır — bilinməyən açar atılır, məcburi details sahəsi yoxdur).
- `models/event.go`-ya `Details datatypes.JSON` sahəsi əlavə olunur (gorm JSONB).
- Create/Update DTO-lara `details` və `guest_ids` əlavə olunur.

### Frontend UI

**1. Günün düymələri.** Hər gün blokunun altında (`day-timeline.tsx` və ya alt-komponent)
mövcud tək "Tədbir əlavə et" əvəzinə 4 düymə sırası:
`[🚐 Transfer] [🏨 Otel] [🍽️ Restoran] [➕ Digər]`.
Hər düymə həmin günün tarixi + seçilmiş tiplə forma açır.

**2. Tip-spesifik forma.** Mövcud universal `event-form.tsx` bölünür:
- `event-form/common-fields.tsx` — ortaq sahələr (başlıq, tarix, vaxt, qiymət,
  qonaq seçimi, ödəniş, xatırlatma, qeyd).
- `event-form/transfer-fields.tsx`, `hotel-fields.tsx`, `restaurant-fields.tsx` —
  tipə xas sahələr.
- `event-form/index.tsx` — tipə görə uyğun alt-komponenti seçib göstərir, submit-də
  details obyektini yığır.

Progressive disclosure saxlanılır: tipə xas + əsas sahələr yuxarıda, qalan ortaq
detallar (ödəniş, xatırlatma, əlavə) "Daha çox detal" altında.

**3. Qonaq seçimi.** Formada "Qonaqlar" sahəsi — turun qonaqlarından çoxseçim
(checkbox/chip siyahısı). Turun qonağı yoxdursa, "Əvvəlcə qonaq əlavə edin" ipucu.

Tip meta (ikon, rəng, ad) mövcud `event-meta.ts` / `event-type-icon.tsx`-dən gəlir.

---

## Axın (data flow)

1. Bələdçi tur açır → "Qonaqlar" bölməsində turistləri əlavə edir.
2. Günün altında tip düyməsinə basır (məs. Transfer) → tipə uyğun forma açılır.
3. Formada tipə xas sahələr + ortaq sahələr + qonaq seçimi doldurulur.
4. Submit: `{...ortaq, type, details: {from,to,...}, guest_ids: [...]}` → backend.
5. Backend events sətrini + event_guests əlaqələrini yazır.
6. Tədbir kartında tip-xas məlumat + iştirak edən qonaqlar göstərilir.

## Xəta idarəetməsi

- Ad boş qonaq → 422 (frontend zod + backend validasiya).
- Bilinməyən details açarı → backend sükutla atır (sərt deyil).
- guest_ids içində turun qonağı olmayan id → backend həmin id-ni atır.
- Köhnə tipli (tour/flight/note) tədbir redaktədə → "Digər" formasına düşür,
  tip dəyəri saxlanılır (submit-də dəyişdirilmirsə).

## Test / doğrulama

- Migration: up + down işləyir; mövcud events/tours sınmır.
- API: guest CRUD, event+guest_ids+details create/update — real HTTP ilə yoxlanır.
- Frontend: brauzerdə (Playwright) — qonaq əlavə, tip düyməsi → forma → tədbir yarat →
  backend-də details + guests düzgün yazılıb.
- Köhnə tədbir (transfer, mövcud) redaktədə açılıb sınmır.

## Miqyas qeydi (decomposition)

İki blok müstəqildir və ayrı-ayrı tikilə/test edilə bilər. Tövsiyə olunan sıra:
**əvvəlcə A blok (qonaqlar)**, çünki B blokdakı qonaq seçimi ona söykənir.
İmplementasiya planı bu sıranı izləyəcək.
