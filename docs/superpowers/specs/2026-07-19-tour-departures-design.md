# Tarixli Tur Çıxışları (Tour Departures) — Dizayn Spesifikasiyası

**Tarix:** 2026-07-19
**Status:** Təsdiqlənib (istifadəçi razılığı ilə)

## 1. Problem və məqsəd

Hazırda hər `CatalogTour` bir kart = bir turdur və vahid tarix/detal daşıyır. İstifadəçi iki səviyyəli struktur istəyir:

- **Üst səviyyə (destinasiya/şablon):** "Quba turu", "Qəbələ turu" — ümumi ad, təsvir, marşrut, şəkil, baza qiymət.
- **Alt səviyyə (tarixli çıxışlar):** hər üst turun içində çoxlu konkret tarix (məs. Quba turu → 10 fərqli tarix). Hər tarix ayrıca bron edilə bilən "tur"dur, amma hamısı "Quba turu" adı altında qruplaşır.

**Admin axını:** əvvəl kataloq (Quba turu) yaradılır → sonra onun içinə tarixli çıxışlar əlavə olunur.

## 2. Əsas prinsip

`CatalogTour` **dəyişməz qalır** və "şablon" rolunu oynayır. Yeni `TourDeparture` cədvəli konkret tarixli çıxışları saxlayır. `CatalogTour.Price` artıq "baza qiymət"dir; hər departure onu override edə bilər.

## 3. Data model

### Yeni: `TourDeparture` (`internal/models/tour_departure.go`, cədvəl `tour_departures`)

| Sahə | Tip | Qeyd |
|------|-----|------|
| `ID` | uuid | PK |
| `CatalogTourID` | string | FK → `catalog_tours.id`, ON DELETE CASCADE |
| `StartDate` | string (YYYY-MM-DD) | məcburi |
| `EndDate` | *string (YYYY-MM-DD) | opsional |
| `Price` | *int | nil → üst turun baza qiyməti götürülür |
| `Capacity` | int | ümumi yer, default 12 |
| `Booked` | int | bron olunmuş yer, default 0 |
| `Status` | enum `departure_status` | `open` / `full` / `closed` |
| `SortOrder` | int | sıralama |
| `CreatedAt` / `UpdatedAt` | time | |

**Hesablanan (saxlanmır):** `remaining = capacity - booked`.

**Status məntiqi (avtomatik):**
- `booked >= capacity` → `full`
- start_date keçmişdədirsə → `closed`
- əks halda → `open`

Effektiv status oxuma zamanı hesablanır (keçmiş tarixlər sorğuda `closed` sayılır), amma `full` DB-də də yazılır ki, race olmasın.

### Dəyişiklik: `CatalogTour`

Heç bir sahə silinmir. `Price` semantik olaraq "baza qiymət" kimi şərh olunur. Kod dəyişikliyi yoxdur.

### Dəyişiklik: `Booking` (`internal/models/booking.go`)

- `DepartureID *string` — bağlı departure (nullable, FK ON DELETE SET NULL).
- `DepartureDate *string` — snapshot (departure silinsə də bron sağ qalır — mövcud `TourTitle` snapshot pattern-i ilə eyni).

## 4. Backend API

### Public (auth yox)
- `GET /api/public/catalog-tours` → hər tura `departures_count` (yalnız açıq/gələcək) və `next_date` əlavə olunur.
- `GET /api/public/catalog-tours/:slug` → tur + yalnız **açıq gələcək** departure-lar (`open`, start_date >= bu gün), `sort_order`/`start_date` ilə sıralı.
- `POST /api/public/bookings` → indi opsional `departure_id` qəbul edir.

### Admin (JWT)
- `GET /api/catalog-tours/:id/departures` → bütün departure-lar (keçmiş + dolu daxil).
- `POST /api/catalog-tours/:id/departures` → yeni tarix.
- `PATCH /api/departures/:id` → redaktə (start/end/price/capacity).
- `DELETE /api/departures/:id` → sil.

### Layerlər
Mövcud `handler → service → repository` pattern-i izlənir:
- `internal/repository/departure_repository.go` — `ListByTour`, `ListPublicByTour`, `FindByID`, `Create`, `Update`, `Delete`, `IncrementBooked` (transaction).
- `internal/service/departure_service.go` — validasiya, status hesablanması, qiymət miras məntiqi.
- `internal/handler/departure_handler.go` — HTTP.
- `internal/database/migrate.go` — `departure_status` enum + `AutoMigrate(TourDeparture{})`.

## 5. Bron məntiqi (kritik)

`POST /public/bookings` `departure_id` ilə gəldikdə, backend **transaction** daxilində:
1. Departure-i tapır; `open` və gələcək olduğunu yoxlayır (yoxsa 422/409, AZ mesaj).
2. `remaining = capacity - booked` yoxlayır; yer yoxdursa **409** — "Bu tarix üçün yer qalmayıb".
3. `booked += people`; `booked >= capacity` olarsa status → `full`.
4. Bron yaranır: `departure_id`, snapshot `departure_date`, `tour_title`, effektiv qiymət (`departure.price ?? catalog.price`).

`departure_id` **olmadan** gələn köhnə/sadə sorğular əvvəlki kimi işləyir (geriyə uyğunluq).

## 6. Admin UI (`frontend`, Next.js)

- **`/catalog` səhifəsi:** hər kartda "🗓️ X tarix" nişanı + **"Tarixləri idarə et"** düyməsi.
- **Tarix idarəetmə paneli:** kartdakı düyməyə klik → bottom-sheet (mövcud `catalog-tour-form` üslubunda):
  - Mövcud tarixlərin siyahısı: `12–14 Avqust • ₼450 • 5/12 yer • [open]` + redaktə/sil.
  - "➕ Yeni tarix əlavə et" inline formu: başlama, bitmə (opsional), qiymət (boş → baza), tutum.
- **API/hooks:** `src/lib/api/departures.ts` + `src/lib/hooks/use-departures.ts` (mövcud pattern).
- **`/reservations`:** hər bron kartında `departure_date` göstərilir.

## 7. Landing UI (`frontend-landing`, TanStack/Vite)

- **Kataloq (`routes/index.tsx`):** kartda "🗓️ 10 tarix" + ən yaxın tarix. Açıq tarix yoxdursa "Tarixlər dolub".
- **Tur detalı (`routes/tours.$tourId.tsx`):** solda ümumi məlumat dəyişmir; sağdakı sticky kartda **tarix seçimi** (açıq gələcək departure-lar radio-siyahı: `19–21 Avq • ₼450 • 5 yer qalıb`). Tarix seçildikdə `BookingDialog` həmin `departure_id`, tarix və effektiv qiymətlə açılır. Açıq tarix yoxdursa "Hazırda açıq tarix yoxdur".
- **`BookingDialog`:** tarix departure-dan gəlir (əl ilə tarix yazılmır); `submitBooking` payload-una `departure_id` əlavə olunur. `client.ts` adapter `departures` massivini `Tour` obyektinə daxil edir.

## 8. Çoxdillilik və geriyə uyğunluq

- Mövcud jsonb i18n (title/region/overview/highlights/...) **toxunulmaz** qalır.
- Departure-lar mətn daşımır (yalnız tarix/qiymət/yer) → tərcümə problemi yoxdur; dil dəyişəndə tarixlər eyni qalır.
- `departure_id` opsional → köhnə bronlar və tarixsiz sadə sorğular işləməyə davam edir.

## 9. Əhatə xaricində (YAGNI)

- Real ödəniş inteqrasiyası (landing-dəki ödəniş saxta qalır).
- Departure səviyyəsində ayrı marşrut/təsvir (ümumi məlumat üst turda qalır).
- `he` (ivrit) tur məzmununun tam tərcüməsi (mövcud fallback davam edir).
- Overbooking üçün waitlist / gözləmə siyahısı.

## 10. Test strategiyası

- **Backend (unit/integration):** departure CRUD; qiymət miras (`price nil → baza`); status keçidi (`full` yer bitəndə, `closed` tarix keçəndə); bron transaction-ı overbooking-i 409 ilə bloklayır; `departure_id`-siz bron geriyə uyğun işləyir.
- **Landing/Admin:** əl ilə smoke — kataloq yaratma → tarix əlavə → landing-də görünmə → bron → admin-də tarixli bronun görünməsi → yerin azalması.
