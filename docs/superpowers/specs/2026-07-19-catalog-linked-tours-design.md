# Kataloqa Bağlı Tur + Avtomatik Qonaq — Dizayn Spesifikasiyası

**Tarix:** 2026-07-19
**Status:** Təsdiqlənib (istifadəçi qərarları ilə)
**Əvəz edir:** [2026-07-19-tour-departures-design.md](2026-07-19-tour-departures-design.md) — `TourDeparture` konsepti bu dizaynla ləğv olunur.

## 1. Problem və məqsəd

İstifadəçinin istədiyi axın:
1. **Kataloqdan** "Quba turu" ümumi məlumatı + baza qiymət yazılır (şablon). Bütün Quba turlarının qiyməti eynidir.
2. **Turlar bölməsində** konkret tur yaradılır və **dropdown-dan "Quba turu" seçilir** (bağlanır) + tarix qeyd olunur.
3. Bu tura **insanlar (qonaqlar)** qeyd olunur — həm admin əl ilə, həm də landing bronları avtomatik.

Layihədə hazırda iki tam ayrı domen var:
- **CatalogTour** (price, şəkil, çoxdilli — landing satışı üçün)
- **Tour** (start/end date, status, Event-lər, Guest-lər — daxili planlama)

Bu dizayn onları birləşdirir: **konkret tur = kataloqa bağlı daxili Tour**.

## 2. Əsas qərar: TourDeparture silinir

`TourDeparture` modeli, `departure_status` enum, `tour_departures` cədvəli, `DepartureRepository`/`DepartureService`/`DepartureHandler` və bütün departure route-ları **tamamilə silinir**. Onun rolunu (tarix + tutum + bron sayğacı) indi **kataloqa bağlı Tour** oynayır.

## 3. Data model dəyişiklikləri

### `Tour` (internal/models/tour.go) — əlavə
```
CatalogTourID *string  gorm:"type:uuid;index"   // nullable: bağlı kataloq turu
Capacity      int      gorm:"type:int;not null;default:12"  // yer sayı
GuestsCount   int64    gorm:"-"                 // hesablanır (Guest sayı)
Price         int      gorm:"-"                 // hesablanır (kataloqdan miras)
CatalogSlug   string   gorm:"-"                 // hesablanır (landing linki üçün)
```
- Qiymət Tour-da **saxlanmır** — bağlı CatalogTour-un `Price`-ından miras (bütün eyni).
- `Booked = GuestsCount`; `Remaining = Capacity - GuestsCount`.

### `Booking` (internal/models/booking.go) — əlavə
```
TourID *string  gorm:"type:uuid;index"  // hansı daxili tura bağlandı (Guest yaradıldıqda)
```
`DepartureID`/`DepartureDate` sahələri **silinir** (departure yoxdur; `Date` snapshot qalır).

### Silinən
- `TourDeparture` modeli, `tour_departures` cədvəli, `departure_status` enum (migrate.go-dan çıxarılır).

## 4. Backend axını

### Admin (JWT)
- `GET /tours` → siyahı, hər tura `guests_count`, `price` (kataloqdan), `catalog_slug` enrich olunur; `catalog_tour_id` query filtri əlavə (bir kataloqun turlarını süzmək).
- `POST /tours` → indi `catalog_tour_id` və `capacity` qəbul edir. `catalog_tour_id` verilibsə mövcudluğu yoxlanır (yoxdursa 422).
- `PATCH /tours/:id` → `catalog_tour_id`, `capacity` dəyişə bilər.
- `GET /catalog-tours` → dropdown üçün istifadə olunur (mövcud endpoint).
- Qonaqlar: mövcud `/tours/:id/guests` CRUD dəyişmir.

### Public (landing, auth yox)
- `GET /public/catalog-tours/:slug` → indi departure yerinə **həmin kataloqa bağlı Tour-ları** qaytarır. Cavab: `{ tour, tours: [...] }` — hər tour `id, title, start_date, end_date, capacity, booked, remaining, price`. **Bütün bağlı turlar** qaytarılır (keçmiş daxil), amma effektiv status hesablanır (keçmiş tarix = "past").
- `POST /public/bookings` → indi `tour_id` qəbul edir (departure_id yox). Bron gələndə:
  1. Bron qeydi yaranır (audit üçün, mövcud məntiq).
  2. **Avtomatik Guest yaranır** həmin Tour-a (status "new" — dərhal admin görür).
  3. Tutum yoxlanır: `guests_count >= capacity` olarsa **409** ("yer qalmayıb").

## 5. Bron → Guest məntiqi (kritik)

`POST /public/bookings` `tour_id` ilə gəldikdə, transaction daxilində:
1. Tour tapılır; mövcud və gələcək (start_date >= bu gün) olduğu yoxlanır.
2. Cari `guests_count` sayılır; `>= capacity` olarsa 409 ("Bu tur üçün yer qalmayıb").
3. `Booking` yaranır (snapshot: tour_title, tour_id).
4. `Guest` yaranır: `TourID` = tour, `FullName` = booking.full_name, `Phone`, `Notes` = "Landing bronu · N nəfər".
5. `people > 1` olarsa Notes-da qeyd olunur (bir booking = bir guest sətri, amma nəfər sayı notes-da; sadəlik üçün).

Qiymət kataloqdan gəlir → booking-də snapshot qalır.

## 6. Admin UI (frontend, Next.js)

### Tur formu (`components/tours/tour-form` və ya mövcud yaratma səhifəsi)
- Yeni **"Kataloq turu"** dropdown-u (`GET /catalog-tours` ilə doldurulur). Seçim məcburi deyil (nullable), amma tövsiyə olunur.
- Kataloq seçiləndə **qiymət avtomatik göstərilir** (read-only, kataloqdan).
- Yeni **"Yer sayı (capacity)"** input-u (default 12).

### Katalog səhifəsi (`/catalog`)
- **🗓️ "Tarixləri idarə et" düyməsi və `DeparturesPanel` SİLİNİR** (departure yoxdur).
- Kartda əlavə: "🧭 X tur" (bu kataloqa bağlı tur sayı), klik → `/tours?catalog=<id>` (həmin turları göstərir).

### Turlar səhifəsi
- Tur kartında bağlı kataloq adı + qiymət göstərilir.
- Qonaqlar bölməsində landing-dən gələn qonaqlar da görünür (mənbə fərqi Notes-da).

### Rezervasiyalar (`/reservations`)
- Mövcud qalır; bron artıq `tour_id`-yə də bağlıdır.

## 7. Landing UI (frontend-landing)

- **`client.ts`**: `fetchCatalogTour` cavabı `{ tour, tours }` (departures yerinə tours). `Tour` tipində `departures` → `tourDates` (bağlı turlar) olur.
- **`tours.$tourId.tsx`**: tarix seçici bağlı turlardan qurulur. Keçmiş tarixli turlar qeyri-aktiv ("keçib"), gələcəklər seçilə bilər (qalan yer göstərilir).
- **`BookingDialog`**: `departureId` → `tourId`; `submitBooking` payload-una `tour_id`.

## 8. Köhnə data təmizlənməsi

İstifadəçi qərarı: **köhnə turların hamısı silinir**, test üçün təzə kataloqa bağlı turlar yaradılır.
- İcra zamanı: bütün mövcud `tours`, `guests`, `bookings`, `tour_departures` cədvəlləri boşaldılır (TRUNCATE).
- Sonra: 1-2 kataloq turu + hərəsinə bağlı 2-3 tarixli tur + qonaqlar yaradılıb e2e yoxlanılır.

## 9. Əhatə xaricində (YAGNI)

- Real ödəniş (landing ödəniş saxta qalır).
- Tour səviyyəsində qiymət override (qiymət həmişə kataloqdan).
- `people` sayına görə çoxlu ayrıca Guest sətri (bir booking = bir Guest, nəfər sayı Notes-da).
- Waitlist / gözləmə siyahısı.

## 10. Test strategiyası

- **Backend smoke (curl):** kataloq yarat → ona bağlı tur yarat (capacity 2) → landing-dən 2 bron (Guest yaranır, tutum dolur) → 3-cü bron 409 → admin-də turun qonaq siyahısında landing bronları görünür.
- **Admin/Landing manual (Playwright):** tur formunda kataloq dropdown + qiymət auto; landing detalda bağlı tur tarixləri; bron → admin qonaqlarda görünmə.
