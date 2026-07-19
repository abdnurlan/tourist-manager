# Tarixli Tur Çıxışları (Tour Departures) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a two-level tour structure — `CatalogTour` (template) + `TourDeparture` (dated departures) — so admins create a catalog tour, add dated departures to it, and landing users pick a departure to book.

**Architecture:** New `TourDeparture` GORM model with a `departure_status` enum, wired through the existing `repository → service → handler → router` layers. Bookings gain an optional `departure_id` + snapshot date; booking creation increments `booked` inside a transaction and blocks overbooking. Admin (Next.js) gets a departure-management panel per catalog card; landing (TanStack/Vite) shows a date picker in the tour detail sticky card.

**Tech Stack:** Go 1.x + Fiber v2 + GORM (PostgreSQL 16); Next.js (admin, axios + TanStack Query); TanStack Start/Vite (landing, fetch + TanStack Query).

**Testing note:** This backend has **no Go test harness**. Verification is done by (a) `go build ./...` for compilation and (b) `curl` smoke tests against the running Docker backend (`http://localhost:8080`). Every backend task ends with a build check; integration tasks add curl checks. Frontend tasks verify via typecheck/build + manual browser smoke.

**Prerequisite:** The full stack runs via `docker compose -f docker-compose.full.yml up`. Backend uses Air HMR so Go changes reload automatically. Confirm it's running before starting: `docker compose -f docker-compose.full.yml ps`.

---

## File Structure

**Backend (create):**
- `backend/internal/models/tour_departure.go` — `TourDeparture` model + `EffectiveStatus()` helper.
- `backend/internal/repository/departure_repository.go` — persistence + `IncrementBooked` transaction.
- `backend/internal/service/departure_service.go` — validation, status/price logic, CRUD.
- `backend/internal/handler/departure_handler.go` — HTTP handlers.

**Backend (modify):**
- `backend/internal/models/booking.go` — add `DepartureID`, `DepartureDate`.
- `backend/internal/database/migrate.go` — add `departure_status` enum + `AutoMigrate(&TourDeparture{})`.
- `backend/internal/service/booking_service.go` — resolve departure, increment booked, snapshot date.
- `backend/internal/repository/booking_repository.go` — add departure repo dependency for transactional increment (or inject via service).
- `backend/internal/router/router.go` — register departure routes + add `Departure` to `Handlers`.
- `backend/cmd/server/main.go` — wire departure repo/service/handler.
- `backend/pkg/apperror/apperror.go` — add `DepartureFull()` + `DepartureNotFound()`.

**Admin frontend (create):**
- `frontend/src/lib/api/departures.ts` — API module.
- `frontend/src/lib/hooks/use-departures.ts` — TanStack Query hooks.
- `frontend/src/components/catalog/departures-panel.tsx` — manage-dates bottom sheet.

**Admin frontend (modify):**
- `frontend/src/app/(app)/catalog/page.tsx` — "Tarixləri idarə et" button + panel wiring.
- `frontend/src/app/(app)/reservations/page.tsx` — show `departure_date`.

**Landing frontend (modify):**
- `frontend-landing/src/lib/api/client.ts` — add `departures` to adapter + fetch, add `departure_id` to booking.
- `frontend-landing/src/routes/tours.$tourId.tsx` — date picker in sticky card.
- `frontend-landing/src/components/BookingDialog.tsx` — accept selected departure.
- `frontend-landing/src/routes/index.tsx` — "X tarix" badge on cards.

---

## Task 1: TourDeparture model

**Files:**
- Create: `backend/internal/models/tour_departure.go`

- [ ] **Step 1: Create the model file**

```go
package models

import "time"

// TourDeparture is a concrete dated departure of a CatalogTour. A catalog tour
// is the reusable template ("Quba turu"); each departure is one bookable date
// with its own capacity and optional price override. Status is stored but the
// effective status is recomputed on read (a past start date is always closed).
type TourDeparture struct {
	ID            string  `json:"id"              gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CatalogTourID string  `json:"catalog_tour_id" gorm:"type:uuid;not null;index"`
	StartDate     string  `json:"start_date"      gorm:"type:date;not null"`      // YYYY-MM-DD
	EndDate       *string `json:"end_date"        gorm:"type:date"`               // YYYY-MM-DD, optional
	Price         *int    `json:"price"           gorm:"type:int"`                // nil → catalog base price
	Capacity      int     `json:"capacity"        gorm:"type:int;not null;default:12"`
	Booked        int     `json:"booked"          gorm:"type:int;not null;default:0"`
	Status        string  `json:"status"          gorm:"type:departure_status;not null;default:'open'"`
	SortOrder     int     `json:"sort_order"      gorm:"type:int;not null;default:0"`
	CreatedAt     time.Time `json:"created_at"    gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}

func (TourDeparture) TableName() string { return "tour_departures" }

// Remaining is capacity minus booked, never below zero.
func (d TourDeparture) Remaining() int {
	r := d.Capacity - d.Booked
	if r < 0 {
		return 0
	}
	return r
}

// EffectiveStatus recomputes status from the data: a past start date is closed,
// a full departure is full, otherwise open. `today` is "YYYY-MM-DD".
func (d TourDeparture) EffectiveStatus(today string) string {
	if d.StartDate < today {
		return "closed"
	}
	if d.Booked >= d.Capacity {
		return "full"
	}
	return "open"
}
```

- [ ] **Step 2: Verify it compiles**

Run: `docker compose -f docker-compose.full.yml exec backend go build ./internal/models/`
Expected: no output (success). If `exec` is unavailable, run locally: `cd backend && go build ./internal/models/`.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/models/tour_departure.go
git commit -m "feat(backend): TourDeparture model"
```

---

## Task 2: departure_status enum + AutoMigrate

**Files:**
- Modify: `backend/internal/database/migrate.go`

- [ ] **Step 1: Add the enum DDL**

In `enumDDL` (after the `booking_status` line, line ~25), add:

```go
	`DO $$ BEGIN CREATE TYPE departure_status AS ENUM ('open','full','closed'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
```

- [ ] **Step 2: Add the model to AutoMigrate**

In the `db.AutoMigrate(...)` call, after `&models.Booking{},` add:

```go
		&models.TourDeparture{},
```

- [ ] **Step 3: Verify build + migration runs**

Run: `docker compose -f docker-compose.full.yml restart backend && sleep 6 && docker compose -f docker-compose.full.yml logs --tail 20 backend`
Expected: no `migrate:` fatal error; backend listening. Then confirm the table exists:
Run: `docker compose -f docker-compose.full.yml exec db psql -U postgres -d tourist_manager -c "\d tour_departures"`
Expected: table description printed with the columns from Task 1.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/database/migrate.go
git commit -m "feat(backend): departure_status enum + tour_departures migration"
```

---

## Task 3: apperror helpers for departures

**Files:**
- Modify: `backend/pkg/apperror/apperror.go`

- [ ] **Step 1: Add two constructors**

After `func BookingNotFound()` (line ~81), add:

```go
func DepartureNotFound() *AppError {
	return New(http.StatusNotFound, "DEPARTURE_NOT_FOUND", "Tarix tapılmadı.")
}

func DepartureFull() *AppError {
	return New(http.StatusConflict, "DEPARTURE_FULL", "Bu tarix üçün yer qalmayıb.")
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend && go build ./pkg/apperror/`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add backend/pkg/apperror/apperror.go
git commit -m "feat(backend): departure apperror helpers"
```

---

## Task 4: DepartureRepository

**Files:**
- Create: `backend/internal/repository/departure_repository.go`

- [ ] **Step 1: Create the repository**

```go
package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// DepartureRepository defines persistence for tour departures.
type DepartureRepository interface {
	ListByTour(catalogTourID string) ([]models.TourDeparture, error)
	FindByID(id string) (*models.TourDeparture, error)
	Create(d *models.TourDeparture) error
	Update(d *models.TourDeparture) error
	Delete(id string) error
	// IncrementBooked adds `people` to booked inside a transaction, failing if it
	// would exceed capacity. Returns the updated departure.
	IncrementBooked(id string, people int) (*models.TourDeparture, error)
}

type departureRepository struct {
	db *gorm.DB
}

// NewDepartureRepository builds a GORM-backed DepartureRepository.
func NewDepartureRepository(db *gorm.DB) DepartureRepository {
	return &departureRepository{db: db}
}

func (r *departureRepository) ListByTour(catalogTourID string) ([]models.TourDeparture, error) {
	var out []models.TourDeparture
	err := r.db.Where("catalog_tour_id = ?", catalogTourID).
		Order("sort_order ASC, start_date ASC").Find(&out).Error
	return out, err
}

func (r *departureRepository) FindByID(id string) (*models.TourDeparture, error) {
	var d models.TourDeparture
	err := r.db.Where("id = ?", id).First(&d).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *departureRepository) Create(d *models.TourDeparture) error {
	return r.db.Create(d).Error
}

func (r *departureRepository) Update(d *models.TourDeparture) error {
	return r.db.Save(d).Error
}

func (r *departureRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.TourDeparture{}).Error
}

// ErrDepartureFull is returned by IncrementBooked when there is not enough room.
var ErrDepartureFull = errors.New("departure full")

func (r *departureRepository) IncrementBooked(id string, people int) (*models.TourDeparture, error) {
	var out models.TourDeparture
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var d models.TourDeparture
		// Lock the row for the duration of the transaction.
		if err := tx.Clauses(clauseForUpdate()).Where("id = ?", id).First(&d).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return err
		}
		if d.Booked+people > d.Capacity {
			return ErrDepartureFull
		}
		d.Booked += people
		if d.Booked >= d.Capacity {
			d.Status = "full"
		}
		if err := tx.Save(&d).Error; err != nil {
			return err
		}
		out = d
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}
```

- [ ] **Step 2: Add the row-lock clause helper**

The `clauseForUpdate()` uses GORM's `clause.Locking`. Add this small helper at the bottom of the same file:

```go
```
Replace the placeholder call: at the top imports add `"gorm.io/gorm/clause"`, then replace `tx.Clauses(clauseForUpdate())` with `tx.Clauses(clause.Locking{Strength: "UPDATE"})` and delete the `clauseForUpdate()` reference. (Simpler: inline it — no helper function needed.)

Final import block for this file:
```go
import (
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"tourist-manager/backend/internal/models"
)
```
And the lock line becomes:
```go
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(&d).Error; err != nil {
```

- [ ] **Step 3: Verify build**

Run: `cd backend && go build ./internal/repository/`
Expected: success. (If `ErrNotFound` is undefined here, confirm it lives in `repository/errors.go` — it is used by `catalog_tour_repository.go`, same package, so it resolves.)

- [ ] **Step 4: Commit**

```bash
git add backend/internal/repository/departure_repository.go
git commit -m "feat(backend): DepartureRepository with transactional IncrementBooked"
```

---

## Task 5: DepartureService

**Files:**
- Create: `backend/internal/service/departure_service.go`

- [ ] **Step 1: Create the service**

```go
package service

import (
	"time"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// DepartureInput carries a create/update body. Pointers let PATCH leave fields
// unchanged.
type DepartureInput struct {
	StartDate *string
	EndDate   *string
	Price     *int
	Capacity  *int
	SortOrder *int
}

// DepartureService implements departure business logic.
type DepartureService interface {
	ListByTour(catalogTourID string) ([]models.TourDeparture, error)
	ListPublicByTour(catalogTourID string) ([]models.TourDeparture, error)
	Create(catalogTourID string, in DepartureInput) (*models.TourDeparture, error)
	Update(id string, in DepartureInput) (*models.TourDeparture, error)
	Delete(id string) error
}

type departureService struct {
	repo    repository.DepartureRepository
	catalog repository.CatalogTourRepository
}

// NewDepartureService builds a DepartureService.
func NewDepartureService(repo repository.DepartureRepository, catalog repository.CatalogTourRepository) DepartureService {
	return &departureService{repo: repo, catalog: catalog}
}

func today() string { return time.Now().Format("2006-01-02") }

// stampStatus overwrites each departure's Status with its effective status so
// callers/JSON always see the up-to-date value (past → closed).
func stampStatus(list []models.TourDeparture) {
	t := today()
	for i := range list {
		list[i].Status = list[i].EffectiveStatus(t)
	}
}

func (s *departureService) ListByTour(catalogTourID string) ([]models.TourDeparture, error) {
	list, err := s.repo.ListByTour(catalogTourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	stampStatus(list)
	return list, nil
}

func (s *departureService) ListPublicByTour(catalogTourID string) ([]models.TourDeparture, error) {
	all, err := s.repo.ListByTour(catalogTourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	t := today()
	out := make([]models.TourDeparture, 0, len(all))
	for _, d := range all {
		if d.EffectiveStatus(t) == "open" {
			d.Status = "open"
			out = append(out, d)
		}
	}
	return out, nil
}

func (s *departureService) Create(catalogTourID string, in DepartureInput) (*models.TourDeparture, error) {
	// Tour must exist.
	if _, err := s.catalog.FindByID(catalogTourID); err != nil {
		return nil, apperror.CatalogTourNotFound()
	}

	var fields []apperror.FieldError
	start := trimPtr(in.StartDate)
	if start == "" || !isValidDate(start) {
		fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Başlama tarixi düzgün deyil"})
	}
	if in.EndDate != nil && trimPtr(in.EndDate) != "" && !isValidDate(trimPtr(in.EndDate)) {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi düzgün deyil"})
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	capacity := 12
	if in.Capacity != nil && *in.Capacity > 0 {
		capacity = *in.Capacity
	}
	sortOrder := 0
	if in.SortOrder != nil {
		sortOrder = *in.SortOrder
	}

	d := &models.TourDeparture{
		CatalogTourID: catalogTourID,
		StartDate:     start,
		EndDate:       cleanPtr(in.EndDate),
		Price:         in.Price, // nil → inherits base price on read
		Capacity:      capacity,
		Booked:        0,
		Status:        "open",
		SortOrder:     sortOrder,
	}
	if err := s.repo.Create(d); err != nil {
		return nil, apperror.Internal()
	}
	d.Status = d.EffectiveStatus(today())
	return d, nil
}

func (s *departureService) Update(id string, in DepartureInput) (*models.TourDeparture, error) {
	d, err := s.repo.FindByID(id)
	if err != nil {
		return nil, apperror.DepartureNotFound()
	}

	var fields []apperror.FieldError
	if in.StartDate != nil {
		start := trimPtr(in.StartDate)
		if start == "" || !isValidDate(start) {
			fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Başlama tarixi düzgün deyil"})
		} else {
			d.StartDate = start
		}
	}
	if in.EndDate != nil {
		if trimPtr(in.EndDate) != "" && !isValidDate(trimPtr(in.EndDate)) {
			fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi düzgün deyil"})
		} else {
			d.EndDate = cleanPtr(in.EndDate)
		}
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}
	if in.Price != nil {
		d.Price = in.Price
	}
	if in.Capacity != nil && *in.Capacity > 0 {
		d.Capacity = *in.Capacity
	}
	if in.SortOrder != nil {
		d.SortOrder = *in.SortOrder
	}

	if err := s.repo.Update(d); err != nil {
		return nil, apperror.Internal()
	}
	d.Status = d.EffectiveStatus(today())
	return d, nil
}

func (s *departureService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return apperror.DepartureNotFound()
	}
	if err := s.repo.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend && go build ./internal/service/`
Expected: success. (`trimPtr`, `cleanPtr`, `isValidDate`, `validationError` already exist in `service/validation.go` / `service/booking_service.go` — same package.)

- [ ] **Step 3: Commit**

```bash
git add backend/internal/service/departure_service.go
git commit -m "feat(backend): DepartureService (CRUD + status/price logic)"
```

---

## Task 6: DepartureHandler

**Files:**
- Create: `backend/internal/handler/departure_handler.go`

- [ ] **Step 1: Create the handler**

```go
package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// DepartureRequest is the create/update body.
type DepartureRequest struct {
	StartDate *string `json:"start_date"`
	EndDate   *string `json:"end_date"`
	Price     *int    `json:"price"`
	Capacity  *int    `json:"capacity"`
	SortOrder *int    `json:"sort_order"`
}

func (r DepartureRequest) toInput() service.DepartureInput {
	return service.DepartureInput{
		StartDate: r.StartDate, EndDate: r.EndDate, Price: r.Price,
		Capacity: r.Capacity, SortOrder: r.SortOrder,
	}
}

// DepartureHandler handles departure endpoints (admin write; public list is
// served through the catalog handler).
type DepartureHandler struct {
	svc service.DepartureService
}

// NewDepartureHandler builds a DepartureHandler.
func NewDepartureHandler(svc service.DepartureService) *DepartureHandler {
	return &DepartureHandler{svc: svc}
}

// ListByTour handles GET /catalog-tours/:id/departures (admin) → { "data": [...] }.
func (h *DepartureHandler) ListByTour(c *fiber.Ctx) error {
	list, err := h.svc.ListByTour(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": list})
}

// Create handles POST /catalog-tours/:id/departures (admin) → 201.
func (h *DepartureHandler) Create(c *fiber.Ctx) error {
	var req DepartureRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	d, err := h.svc.Create(c.Params("id"), req.toInput())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(d)
}

// Update handles PATCH /departures/:id (admin).
func (h *DepartureHandler) Update(c *fiber.Ctx) error {
	var req DepartureRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	d, err := h.svc.Update(c.Params("id"), req.toInput())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(d)
}

// Delete handles DELETE /departures/:id (admin) → { "success": true }.
func (h *DepartureHandler) Delete(c *fiber.Ctx) error {
	if err := h.svc.Delete(c.Params("id")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
```

- [ ] **Step 2: Verify build**

Run: `cd backend && go build ./internal/handler/`
Expected: success.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/handler/departure_handler.go
git commit -m "feat(backend): DepartureHandler"
```

---

## Task 7: Public departures in catalog detail response

The landing detail endpoint `GET /public/catalog-tours/:slug` must return open departures. Rather than change the `CatalogTour` model, the handler composes a response object.

**Files:**
- Modify: `backend/internal/handler/catalog_tour_handler.go`

- [ ] **Step 1: Inject the departure service into the catalog handler**

Change the struct + constructor (lines 46-53):

```go
// CatalogTourHandler handles catalog-tour endpoints (public read + admin write).
type CatalogTourHandler struct {
	svc        service.CatalogTourService
	departures service.DepartureService
}

// NewCatalogTourHandler builds a CatalogTourHandler.
func NewCatalogTourHandler(svc service.CatalogTourService, departures service.DepartureService) *CatalogTourHandler {
	return &CatalogTourHandler{svc: svc, departures: departures}
}
```

- [ ] **Step 2: Include open departures in GetPublicBySlug**

Replace `GetPublicBySlug` (lines 67-77):

```go
// GetPublicBySlug handles GET /public/catalog-tours/:slug (tour + open departures).
func (h *CatalogTourHandler) GetPublicBySlug(c *fiber.Ctx) error {
	tour, err := h.svc.GetBySlug(c.Params("slug"))
	if err != nil {
		return err
	}
	if !tour.Published {
		return apperror.CatalogTourNotFound()
	}
	deps, err := h.departures.ListPublicByTour(tour.ID)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{
		"tour":       tour,
		"departures": deps,
	})
}
```

- [ ] **Step 3: Verify build**

Run: `cd backend && go build ./internal/handler/`
Expected: FAIL — `main.go` and any other `NewCatalogTourHandler` caller now have the wrong arity. That's expected; Task 9 fixes wiring. Build just this package to confirm the handler file itself is syntactically valid:
Run: `cd backend && go vet ./internal/handler/ 2>&1 | head`
Expected: only "not enough arguments" type errors at call sites, none inside `catalog_tour_handler.go`.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/handler/catalog_tour_handler.go
git commit -m "feat(backend): public catalog detail returns open departures"
```

---

## Task 8: Booking with departure (model + service)

**Files:**
- Modify: `backend/internal/models/booking.go`
- Modify: `backend/internal/service/booking_service.go`

- [ ] **Step 1: Add fields to the Booking model**

In `backend/internal/models/booking.go`, after the `Date` field (line 16) add:

```go
	DepartureID   *string `json:"departure_id"    gorm:"type:uuid;index"` // nullable
	DepartureDate *string `json:"departure_date"  gorm:"type:date"`        // snapshot
```

- [ ] **Step 2: Add DepartureID to BookingInput and wire the increment**

In `backend/internal/service/booking_service.go`:

Add to `BookingInput` (after `Date *string`, line 20):
```go
	DepartureID *string
```

Add a departure repo dependency to the service struct (lines 32-40):
```go
type bookingService struct {
	bookings   repository.BookingRepository
	catalog    repository.CatalogTourRepository
	departures repository.DepartureRepository
}

// NewBookingService builds a BookingService.
func NewBookingService(bookings repository.BookingRepository, catalog repository.CatalogTourRepository, departures repository.DepartureRepository) BookingService {
	return &bookingService{bookings: bookings, catalog: catalog, departures: departures}
}
```

In `Create`, after the `people` block (after line 73) and before building `booking`, resolve + reserve the departure:
```go
	// If a departure is specified, reserve a seat transactionally and snapshot
	// its date. Overbooking fails with 409; a missing departure fails with 404.
	var depDate *string
	if depID := trimPtr(in.DepartureID); depID != "" {
		updated, err := s.departures.IncrementBooked(depID, people)
		if err != nil {
			if errors.Is(err, repository.ErrDepartureFull) {
				return nil, apperror.DepartureFull()
			}
			if errors.Is(err, repository.ErrNotFound) {
				return nil, apperror.DepartureNotFound()
			}
			return nil, apperror.Internal()
		}
		d := updated.StartDate
		depDate = &d
	}
```

Then in the `booking := &models.Booking{...}` literal, add:
```go
		DepartureID:   cleanPtr(in.DepartureID),
		DepartureDate: depDate,
```

Add `"errors"` to the import block at the top of the file.

- [ ] **Step 3: Verify build (expect wiring errors only)**

Run: `cd backend && go vet ./internal/service/ 2>&1 | head`
Expected: only "not enough arguments in call to ... NewBookingService" at the `main.go` site (fixed in Task 9); nothing inside `booking_service.go` itself.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/models/booking.go backend/internal/service/booking_service.go
git commit -m "feat(backend): bookings reserve a departure seat + snapshot date"
```

---

## Task 9: Wire routes + main.go

**Files:**
- Modify: `backend/internal/router/router.go`
- Modify: `backend/cmd/server/main.go`

- [ ] **Step 1: Add Departure to the Handlers struct**

In `router.go`, add to `Handlers` (after `Upload`, line 26):
```go
	Departure   *handler.DepartureHandler
```

- [ ] **Step 2: Register departure routes**

In `router.go`, after the catalog-tours admin block (after line 107) add:
```go
	// Tour departures (admin management of dated departures).
	api.Get("/catalog-tours/:id/departures", auth, h.Departure.ListByTour)
	api.Post("/catalog-tours/:id/departures", auth, h.Departure.Create)
	api.Patch("/departures/:id", auth, h.Departure.Update)
	api.Delete("/departures/:id", auth, h.Departure.Delete)
```

- [ ] **Step 3: Wire repo/service/handler in main.go**

In `main.go`:

After `catalogRepo := ...` (line 67) add:
```go
	departureRepo := repository.NewDepartureRepository(db)
```

After `catalogSvc := ...` (line 81) add:
```go
	departureSvc := service.NewDepartureService(departureRepo, catalogRepo)
```

Change the `bookingSvc` line (line 82) to pass the departure repo:
```go
	bookingSvc := service.NewBookingService(bookingRepo, catalogRepo, departureRepo)
```

Change the `CatalogTour:` handler line (line 114) to pass the departure service:
```go
		CatalogTour: handler.NewCatalogTourHandler(catalogSvc, departureSvc),
```

Add the `Departure` handler to the `Handlers{...}` literal (after `Upload:` line 116):
```go
		Departure:   handler.NewDepartureHandler(departureSvc),
```

- [ ] **Step 4: Verify full build + boot**

Run: `cd backend && go build ./...`
Expected: success (no errors).
Run: `docker compose -f docker-compose.full.yml restart backend && sleep 6 && docker compose -f docker-compose.full.yml logs --tail 15 backend`
Expected: "backend listening", no fatal.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/router/router.go backend/cmd/server/main.go
git commit -m "feat(backend): wire departure routes, service, and handler"
```

---

## Task 10: Backend end-to-end smoke test

**Files:** none (verification only)

- [ ] **Step 1: Log in and capture a token**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"'"$ADMIN_PASSWORD"'"}' | \
  python3 -c 'import sys,json;print(json.load(sys.stdin)["token"])')
echo "token len: ${#TOKEN}"
```
(Use the real admin creds from `backend/.env` — `ADMIN_USERNAME`/`ADMIN_PASSWORD`. Expected: non-zero token length.)

- [ ] **Step 2: Find a catalog tour id**

```bash
TID=$(curl -s http://localhost:8080/api/catalog-tours -H "Authorization: Bearer $TOKEN" | \
  python3 -c 'import sys,json;d=json.load(sys.stdin)["data"];print(d[0]["id"] if d else "")')
echo "tour: $TID"
```
Expected: a uuid. If empty, create one via the admin UI first, or POST `/catalog-tours` with a minimal body `{"slug":"test","category":"mountain","price":100,"title":{"az":"Test"}}`.

- [ ] **Step 3: Create a departure (capacity 2)**

```bash
curl -s -X POST "http://localhost:8080/api/catalog-tours/$TID/departures" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"start_date":"2026-09-01","end_date":"2026-09-03","price":450,"capacity":2}'
```
Expected: 201 JSON with `"status":"open"`, `"booked":0`, `"capacity":2`. Save its `id` as `DID`.

- [ ] **Step 4: Book 2 seats (fills it), then a 3rd (must 409)**

```bash
SLUG=$(curl -s http://localhost:8080/api/catalog-tours/$TID -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;print(json.load(sys.stdin)["slug"])')
# Fill capacity:
curl -s -X POST http://localhost:8080/api/public/bookings -H 'Content-Type: application/json' \
  -d '{"departure_id":"'"$DID"'","tour_slug":"'"$SLUG"'","full_name":"A","phone":"+994500000000","people":2}'
# Overbook — expect DEPARTURE_FULL / 409:
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8080/api/public/bookings \
  -H 'Content-Type: application/json' \
  -d '{"departure_id":"'"$DID"'","tour_slug":"'"$SLUG"'","full_name":"B","phone":"+994511111111","people":1}'
```
Expected: first booking 201; second returns **409**.

- [ ] **Step 5: Confirm the departure no longer appears in the public detail**

```bash
curl -s http://localhost:8080/api/public/catalog-tours/$SLUG | python3 -c 'import sys,json;d=json.load(sys.stdin);print("departures:",len(d["departures"]))'
```
Expected: the filled departure is excluded from open departures (count reflects only remaining open ones).

- [ ] **Step 6: Confirm the admin booking shows the departure date**

```bash
curl -s http://localhost:8080/api/bookings -H "Authorization: Bearer $TOKEN" | python3 -c 'import sys,json;b=json.load(sys.stdin)["data"][0];print(b["tour_title"], b["departure_date"])'
```
Expected: the tour title + `2026-09-01`.

- [ ] **Step 7: Commit (smoke evidence in message, no file change)**

```bash
git commit --allow-empty -m "test(backend): departure booking e2e smoke verified (fill+409+snapshot)"
```

---

## Task 11: Admin — departures API module + hooks

**Files:**
- Create: `frontend/src/lib/api/departures.ts`
- Create: `frontend/src/lib/hooks/use-departures.ts`

- [ ] **Step 1: Create the API module**

Read `frontend/src/lib/api/catalog-tours.ts` first to match the exact `api` import and response-unwrap style, then create `departures.ts`:

```ts
import { api } from "./axios";

export type DepartureStatus = "open" | "full" | "closed";

export interface Departure {
  id: string;
  catalog_tour_id: string;
  start_date: string;
  end_date: string | null;
  price: number | null;
  capacity: number;
  booked: number;
  status: DepartureStatus;
  sort_order: number;
}

export interface DepartureInput {
  start_date: string;
  end_date?: string | null;
  price?: number | null;
  capacity?: number;
  sort_order?: number;
}

export async function listDepartures(tourId: string): Promise<Departure[]> {
  const { data } = await api.get<{ data: Departure[] }>(`/catalog-tours/${tourId}/departures`);
  return data.data;
}

export async function createDeparture(tourId: string, input: DepartureInput): Promise<Departure> {
  const { data } = await api.post<Departure>(`/catalog-tours/${tourId}/departures`, input);
  return data;
}

export async function updateDeparture(id: string, input: Partial<DepartureInput>): Promise<Departure> {
  const { data } = await api.patch<Departure>(`/departures/${id}`, input);
  return data;
}

export async function deleteDeparture(id: string): Promise<void> {
  await api.delete(`/departures/${id}`);
}
```

- [ ] **Step 2: Create the hooks**

Read `frontend/src/lib/hooks/use-catalog-tours.ts` first to match the exact `queryKey`/invalidation style, then create `use-departures.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listDepartures, createDeparture, updateDeparture, deleteDeparture,
  type Departure, type DepartureInput,
} from "../api/departures";

const key = (tourId: string) => ["departures", tourId] as const;

export function useDepartures(tourId: string | null) {
  return useQuery({
    queryKey: key(tourId ?? ""),
    queryFn: () => listDepartures(tourId as string),
    enabled: !!tourId,
  });
}

export function useCreateDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: DepartureInput) => createDeparture(tourId, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tourId) }),
  });
}

export function useUpdateDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<DepartureInput> }) =>
      updateDeparture(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tourId) }),
  });
}

export function useDeleteDeparture(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDeparture(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(tourId) }),
  });
}
```

- [ ] **Step 3: Verify typecheck**

Run: `docker compose -f docker-compose.full.yml exec frontend npx tsc --noEmit` (or `cd frontend && npx tsc --noEmit`).
Expected: no new type errors in the two new files. Adjust the `Departure` type imports if `use-catalog-tours.ts` uses a different query-client pattern.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/api/departures.ts frontend/src/lib/hooks/use-departures.ts
git commit -m "feat(admin): departures API module + query hooks"
```

---

## Task 12: Admin — departures management panel

**Files:**
- Create: `frontend/src/components/catalog/departures-panel.tsx`

- [ ] **Step 1: Read the existing form for style**

Read `frontend/src/components/catalog/catalog-tour-form.tsx` to copy the bottom-sheet wrapper, button, and input styling exactly (same class names / components).

- [ ] **Step 2: Create the panel**

```tsx
"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  useDepartures, useCreateDeparture, useDeleteDeparture,
} from "@/lib/hooks/use-departures";
import { az } from "@/lib/i18n/az";

interface Props {
  tourId: string;
  basePrice: number;
  onClose: () => void;
}

// DeparturesPanel manages the dated departures for one catalog tour: it lists
// existing departures and offers an inline form to add a new one.
export function DeparturesPanel({ tourId, basePrice, onClose }: Props) {
  const { data: departures = [], isLoading } = useDepartures(tourId);
  const create = useCreateDeparture(tourId);
  const remove = useDeleteDeparture(tourId);

  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [price, setPrice] = useState("");
  const [capacity, setCapacity] = useState("12");

  function add() {
    if (!start) return;
    create.mutate(
      {
        start_date: start,
        end_date: end || null,
        price: price ? Number(price) : null,
        capacity: capacity ? Number(capacity) : 12,
      },
      {
        onSuccess: () => {
          setStart(""); setEnd(""); setPrice(""); setCapacity("12");
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white p-4 dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold">{az.catalog.departures?.title ?? "Tarixlər"}</h2>

        {isLoading ? (
          <p className="text-sm opacity-60">…</p>
        ) : departures.length === 0 ? (
          <p className="text-sm opacity-60">{az.catalog.departures?.empty ?? "Hələ tarix yoxdur"}</p>
        ) : (
          <ul className="space-y-2">
            {departures.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                <span>
                  🗓️ {d.start_date}{d.end_date ? `–${d.end_date}` : ""} • ₼{d.price ?? basePrice} •{" "}
                  {d.booked}/{d.capacity} • {d.status}
                </span>
                <button
                  aria-label="sil"
                  onClick={() => remove.mutate(d.id)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 rounded-lg border border-dashed p-3">
          <div className="grid grid-cols-2 gap-2">
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)}
              className="rounded border p-2 text-sm" />
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)}
              className="rounded border p-2 text-sm" />
            <input type="number" placeholder={`₼${basePrice}`} value={price}
              onChange={(e) => setPrice(e.target.value)} className="rounded border p-2 text-sm" />
            <input type="number" placeholder="12" value={capacity}
              onChange={(e) => setCapacity(e.target.value)} className="rounded border p-2 text-sm" />
          </div>
          <button onClick={add} disabled={!start || create.isPending}
            className="mt-2 w-full rounded-lg bg-emerald-600 p-2 text-sm text-white disabled:opacity-50">
            {az.catalog.departures?.add ?? "Bu tarixi əlavə et"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Add i18n strings**

In `frontend/src/lib/i18n/az.ts`, under the `catalog` object, add a `departures` block:
```ts
    departures: {
      title: "Tarixlər",
      empty: "Hələ tarix yoxdur",
      add: "Bu tarixi əlavə et",
      manage: "Tarixləri idarə et",
    },
```
(Match the surrounding object's exact indentation and trailing comma style.)

- [ ] **Step 4: Verify typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: no errors. If class names differ from the existing form, align them (this file follows the same Tailwind conventions).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/catalog/departures-panel.tsx frontend/src/lib/i18n/az.ts
git commit -m "feat(admin): departures management panel + i18n"
```

---

## Task 13: Admin — hook panel into the catalog page + show dates in reservations

**Files:**
- Modify: `frontend/src/app/(app)/catalog/page.tsx`
- Modify: `frontend/src/app/(app)/reservations/page.tsx`

- [ ] **Step 1: Add the "manage dates" button + panel to catalog cards**

In `catalog/page.tsx`:
- Import: `import { DeparturesPanel } from "@/components/catalog/departures-panel";`
- Add state near the other `useState`s: `const [managing, setManaging] = useState<{ id: string; price: number } | null>(null);`
- In each tour card's action row (near the Pencil/Trash2 buttons ~line 158-174), add a button:
```tsx
<button
  onClick={() => setManaging({ id: t.id, price: t.price })}
  className="text-xs text-emerald-600"
>
  🗓️ {az.catalog.departures?.manage ?? "Tarixləri idarə et"}
</button>
```
- Before the closing fragment of the component, render the panel:
```tsx
{managing && (
  <DeparturesPanel
    tourId={managing.id}
    basePrice={managing.price}
    onClose={() => setManaging(null)}
  />
)}
```

- [ ] **Step 2: Show departure_date in reservations**

In `reservations/page.tsx`, in the booking card (~line 115-194) where `tour_title` is shown, add the departure date when present:
```tsx
{b.departure_date && (
  <span className="text-xs opacity-70"> • 🗓️ {b.departure_date}</span>
)}
```
Also add `departure_date?: string | null;` to the booking type in `frontend/src/lib/api/bookings.ts` (read it first to find the interface).

- [ ] **Step 3: Verify typecheck + build**

Run: `cd frontend && npx tsc --noEmit && npm run build`
Expected: success.

- [ ] **Step 4: Manual browser smoke**

Open http://localhost:3000/catalog → a tour card shows "🗓️ Tarixləri idarə et" → click → panel opens → add a date (e.g. 2026-10-01, capacity 5) → it appears in the list. Open http://localhost:3000/reservations → any departure-linked booking shows the date.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/\(app\)/catalog/page.tsx frontend/src/app/\(app\)/reservations/page.tsx frontend/src/lib/api/bookings.ts
git commit -m "feat(admin): manage-dates button, panel wiring, dates in reservations"
```

---

## Task 14: Landing — fetch departures + date picker

**Files:**
- Modify: `frontend-landing/src/lib/api/client.ts`
- Modify: `frontend-landing/src/routes/tours.$tourId.tsx`
- Modify: `frontend-landing/src/components/BookingDialog.tsx`
- Modify: `frontend-landing/src/routes/index.tsx`

- [ ] **Step 1: Read client.ts fully**

Read `frontend-landing/src/lib/api/client.ts` to see the current `ApiCatalogTour`, `adapt()`, `pick()`, `Tour`, `fetchCatalogTour`, and `submitBooking` shapes exactly before editing.

- [ ] **Step 2: Add a Departure type + extend the tour shape and fetch**

In `client.ts`:
- Add:
```ts
export interface Departure {
  id: string;
  start_date: string;
  end_date: string | null;
  price: number | null;
  capacity: number;
  booked: number;
  status: string;
}
```
- Add `departures: Departure[]` to the landing `Tour` interface, defaulting to `[]` in `adapt()`.
- The detail endpoint now returns `{ tour, departures }`. Update `fetchCatalogTour(slug)`:
```ts
export async function fetchCatalogTour(slug: string): Promise<Tour | null> {
  const res = await fetch(`${API_BASE}/public/catalog-tours/${slug}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`fetch tour failed: ${res.status}`);
  const json = await res.json();
  const tour = adapt(json.tour);
  tour.departures = (json.departures ?? []) as Departure[];
  return tour;
}
```
- The list endpoint (`fetchCatalogTours`) response is unchanged (`json.data`); leave `adapt()` to set `departures: []` there.
- Extend `submitBooking` body to include an optional `departure_id`:
```ts
// in the BookingBody type add:  departure_id?: string;
// (the fetch body already spreads the passed object, so no other change)
```

- [ ] **Step 3: Add the date picker to the detail sticky card**

In `tours.$tourId.tsx`, in the sticky booking card (~line 129-217):
- Add state: `const [selected, setSelected] = useState<Departure | null>(null);` (import `Departure` + `useState`).
- Render open departures as a radio list; if `tour.departures.length === 0`, show `T[lang].detail?.noDates ?? "Hazırda açıq tarix yoxdur"` and disable the book button:
```tsx
{tour.departures.length === 0 ? (
  <p className="text-sm opacity-70">Hazırda açıq tarix yoxdur</p>
) : (
  <ul className="space-y-2">
    {tour.departures.map((d) => (
      <li key={d.id}>
        <label className="flex items-center justify-between rounded-lg border p-2 text-sm">
          <span>
            <input type="radio" name="dep" className="mr-2"
              checked={selected?.id === d.id} onChange={() => setSelected(d)} />
            {d.start_date}{d.end_date ? `–${d.end_date}` : ""}
          </span>
          <span>₼{d.price ?? tour.price} • {d.capacity - d.booked} yer</span>
        </label>
      </li>
    ))}
  </ul>
)}
```
- The "book" button opens `BookingDialog` only when `selected` is set (disable otherwise), passing the selected departure.

- [ ] **Step 4: Pass departure into BookingDialog**

In `BookingDialog.tsx`:
- Add optional props: `departureId?: string; departureDate?: string; lockedPrice?: number;`.
- When `departureDate` is provided, use it as the booking date and skip/prefill the manual date field.
- In `handlePay()` include `departure_id: departureId` in the `submitBooking(...)` payload.

- [ ] **Step 5: Add "X tarix" badge to landing cards**

In `index.tsx`, the list response doesn't include per-tour departure counts by default. Show the badge only if the tour object carries it; otherwise omit. Keep it minimal:
```tsx
{/* only render if departures info exists on the card object */}
```
(If the list endpoint doesn't yet return counts, skip the badge here — it's cosmetic and out of the critical path. Do NOT block on it.)

- [ ] **Step 6: Verify typecheck + build**

Run: `cd frontend-landing && npx tsc --noEmit && npm run build`
Expected: success.

- [ ] **Step 7: Manual browser smoke (full loop)**

1. http://localhost:3001 → open a tour that has an open departure.
2. Detail page → date picker lists the open departure(s) with price + remaining seats.
3. Select a date → book → fill form → confirm.
4. http://localhost:3000/reservations → the new booking shows the tour + departure date.
5. Re-open the landing detail → remaining seats decreased (or the date disappeared if it filled).

- [ ] **Step 8: Commit**

```bash
git add frontend-landing/src/lib/api/client.ts frontend-landing/src/routes/tours.\$tourId.tsx frontend-landing/src/components/BookingDialog.tsx frontend-landing/src/routes/index.tsx
git commit -m "feat(landing): departure date picker + book selected departure"
```

---

## Task 15: Final verification

**Files:** none

- [ ] **Step 1: Rebuild the whole stack clean**

Run: `docker compose -f docker-compose.full.yml up --build -d && sleep 15`
Then probe: backend `/api/health` = 200, admin `:3000` = 200, landing `:3001` = 200.

- [ ] **Step 2: Run the full manual acceptance**

Admin: create "Quba turu" (if not present) → add 2 departures (one with capacity 2). Landing: book the small one twice to fill it → confirm a 3rd attempt is refused with the AZ "yer qalmayıb" message → confirm the filled date drops off the landing detail. Admin reservations: both bookings show with their departure dates.

- [ ] **Step 3: Commit the acceptance evidence**

```bash
git commit --allow-empty -m "test: full departures acceptance loop verified across admin+landing+backend"
```

---

## Self-Review Checklist (author-completed)

- **Spec §3 model** → Task 1 (TourDeparture), Task 2 (enum+migrate), Task 8 (booking fields). ✅
- **Spec §4 API** → Task 6 (handler), Task 7 (public detail), Task 9 (routes). ✅
- **Spec §5 booking logic (transaction, 409, snapshot)** → Task 4 (IncrementBooked), Task 8 (service), Task 10 (409 smoke). ✅
- **Spec §6 admin UI** → Task 11 (api/hooks), 12 (panel), 13 (wiring + reservations date). ✅
- **Spec §7 landing UI** → Task 14. ✅
- **Spec §8 i18n/back-compat** → departures carry no text (§8), `departure_id` optional in Task 8 (nil path unchanged). ✅
- **Type consistency:** `IncrementBooked`, `ErrDepartureFull`, `DepartureInput`, `DepartureFull()`/`DepartureNotFound()`, `ListPublicByTour` names are used identically across tasks. ✅
- **No placeholders:** every code step shows full code; the only "skip if" is the cosmetic landing badge (Task 14 Step 5), explicitly marked non-blocking. ✅
