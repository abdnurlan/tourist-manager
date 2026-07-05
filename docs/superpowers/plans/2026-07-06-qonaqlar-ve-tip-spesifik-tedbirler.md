# Qonaqlar + Tip-spesifik Tədbirlər — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a tour-level guest (turist) system and replace the universal "add event" flow with per-type (Transfer / Otel / Restoran / Digər) creation, each type having its own fields.

**Architecture:** Backend is Go/Fiber + GORM with **AutoMigrate on model structs** (no SQL migration files). Guests get a new `guests` table + `event_guests` join table (GORM `many2many`). Type-specific event fields are stored in a single `details` JSONB column (a `*string` holding marshaled JSON — no new dependency). Frontend is Next.js 15 + React Query + react-hook-form + zod; the universal event form splits into common + per-type field components, and each day in the timeline gets four type buttons.

**Tech Stack:** Go 1.26, Fiber v2.52, GORM v1.31 (Postgres, native ENUM types), Next.js 15, React Query v5, react-hook-form + zod, Tailwind, framer-motion.

**Verification approach:** This backend has no unit-test suite. We verify each backend slice with **real HTTP requests** (curl against the running dev stack on :8080) and each frontend slice in the **browser (Playwright)** — mirroring how the project was verified earlier. The realtime dev stack (`docker compose -f docker-compose.dev.yml`) auto-reloads Go (Air) and Next (HMR), so changes are live without rebuilds.

**Admin login for testing:** `admin` / `admin123` → `POST /api/auth/login` returns `{ "token": "..." }`.

**Order:** Block A (guests) first — Block B's guest-picker depends on it.

---

## BLOCK A — Qonaq (Guest) sistemi

### Task A1: Guest + join models and migration

**Files:**
- Create: `backend/internal/models/guest.go`
- Modify: `backend/internal/models/event.go` (add `Guests` association + `Details` field — Details used in Block B, add now to avoid a second migration)
- Modify: `backend/internal/database/migrate.go:33-40` (register new models)

- [ ] **Step 1: Create the Guest model**

Create `backend/internal/models/guest.go`:

```go
package models

import "time"

// Guest is a tourist attached to a tour. Only FullName is required.
type Guest struct {
	ID          string    `json:"id"          gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	TourID      string    `json:"tour_id"     gorm:"type:uuid;not null;index"`
	FullName    string    `json:"full_name"   gorm:"type:text;not null"`
	Phone       *string   `json:"phone"       gorm:"type:text"`
	Passport    *string   `json:"passport"    gorm:"type:text"`
	Nationality *string   `json:"nationality" gorm:"type:text"`
	Notes       *string   `json:"notes"       gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"  gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at"  gorm:"autoUpdateTime"`
}

func (Guest) TableName() string { return "guests" }
```

- [ ] **Step 2: Add Details + Guests association to Event model**

In `backend/internal/models/event.go`, add two fields to the `Event` struct — `Details` right after `Notes`, and `Guests` (many2many) right after `Source`:

```go
	Notes         *string    `json:"notes"          gorm:"type:text"`
	Details       *string    `json:"details"        gorm:"type:jsonb"` // type-specific fields as JSON (Block B)
	Status        string     `json:"status"         gorm:"type:event_status;default:'planned';not null"`
	Source        string     `json:"source"         gorm:"type:event_source;default:'manual';not null"`
	Guests        []Guest    `json:"guests"         gorm:"many2many:event_guests;joinForeignKey:event_id;joinReferences:guest_id"`
```

> Note: `Details` is a `*string` holding a JSON string. GORM's `type:jsonb` stores it as JSONB in Postgres. The frontend sends/receives a JSON object; the service marshals/unmarshals (Block B). `Guests` many2many auto-creates the `event_guests` join table via AutoMigrate.

- [ ] **Step 3: Register the Guest model in Migrate()**

In `backend/internal/database/migrate.go`, add `&models.Guest{}` to the `AutoMigrate` call:

```go
	return db.AutoMigrate(
		&models.User{},
		&models.Tour{},
		&models.Event{},
		&models.Guest{},
		&models.Attachment{},
		&models.TelegramMessage{},
		&models.Reminder{},
	)
```

- [ ] **Step 4: Verify migration ran (Air auto-restarts backend)**

Wait ~8s for Air to rebuild, then check the tables exist:

```bash
docker exec turplanlayici_db_dev psql -U postgres -d tourist_manager -c "\dt guests" -c "\dt event_guests" -c "\d events" | grep -E "guests|event_guests|details"
```
Expected: `guests` and `event_guests` tables listed, and `events` has a `details | jsonb` column.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/models/guest.go backend/internal/models/event.go backend/internal/database/migrate.go
git commit -m "feat(backend): guest model + event_guests join + events.details jsonb"
```

---

### Task A2: Guest repository

**Files:**
- Create: `backend/internal/repository/guest_repository.go`

- [ ] **Step 1: Create the repository**

Create `backend/internal/repository/guest_repository.go`:

```go
package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// GuestRepository defines persistence operations for guests.
type GuestRepository interface {
	ListByTour(tourID string) ([]models.Guest, error)
	FindByID(id string) (*models.Guest, error)
	Create(guest *models.Guest) error
	Update(guest *models.Guest) error
	Delete(id string) error
}

type guestRepository struct {
	db *gorm.DB
}

// NewGuestRepository builds a GORM-backed GuestRepository.
func NewGuestRepository(db *gorm.DB) GuestRepository {
	return &guestRepository{db: db}
}

func (r *guestRepository) ListByTour(tourID string) ([]models.Guest, error) {
	var guests []models.Guest
	err := r.db.Where("tour_id = ?", tourID).Order("full_name ASC").Find(&guests).Error
	return guests, err
}

func (r *guestRepository) FindByID(id string) (*models.Guest, error) {
	var g models.Guest
	err := r.db.Where("id = ?", id).First(&g).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *guestRepository) Create(guest *models.Guest) error {
	return r.db.Create(guest).Error
}

func (r *guestRepository) Update(guest *models.Guest) error {
	return r.db.Save(guest).Error
}

func (r *guestRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Guest{}).Error
}
```

- [ ] **Step 2: Verify it compiles (Air rebuild)**

```bash
docker logs turplanlayici_backend_dev 2>&1 | tail -5
```
Expected: `running...` with no build error. If a build error appears, fix before continuing.

- [ ] **Step 3: Commit**

```bash
git add backend/internal/repository/guest_repository.go
git commit -m "feat(backend): guest repository"
```

---

### Task A3: Guest service

**Files:**
- Create: `backend/internal/service/guest_service.go`

- [ ] **Step 1: Create the service**

Create `backend/internal/service/guest_service.go`. It validates the parent tour exists (mirrors `event_service` using `tours.FindByID`) and requires a non-empty `full_name`:

```go
package service

import (
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// GuestInput carries create/update fields (nil = unchanged on update).
type GuestInput struct {
	FullName    *string
	Phone       *string
	Passport    *string
	Nationality *string
	Notes       *string
}

// GuestService implements guest business logic.
type GuestService interface {
	ListByTour(tourID string) ([]models.Guest, error)
	Create(tourID string, in GuestInput) (*models.Guest, error)
	Update(id string, in GuestInput) (*models.Guest, error)
	Delete(id string) error
}

type guestService struct {
	guests repository.GuestRepository
	tours  repository.TourRepository
}

// NewGuestService builds a GuestService.
func NewGuestService(guests repository.GuestRepository, tours repository.TourRepository) GuestService {
	return &guestService{guests: guests, tours: tours}
}

func (s *guestService) ListByTour(tourID string) ([]models.Guest, error) {
	guests, err := s.guests.ListByTour(tourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	return guests, nil
}

func (s *guestService) Create(tourID string, in GuestInput) (*models.Guest, error) {
	if _, err := s.tours.FindByID(tourID); err != nil {
		return nil, apperror.TourNotFound()
	}
	name := trimPtr(in.FullName)
	if name == "" {
		return nil, validationError([]apperror.FieldError{
			{Field: "full_name", Message: "Ad tələb olunur"},
		})
	}
	guest := &models.Guest{
		TourID:      tourID,
		FullName:    name,
		Phone:       cleanPtr(in.Phone),
		Passport:    cleanPtr(in.Passport),
		Nationality: cleanPtr(in.Nationality),
		Notes:       cleanPtr(in.Notes),
	}
	if err := s.guests.Create(guest); err != nil {
		return nil, apperror.Internal()
	}
	return guest, nil
}

func (s *guestService) Update(id string, in GuestInput) (*models.Guest, error) {
	guest, err := s.guests.FindByID(id)
	if err != nil {
		return nil, apperror.NotFound("GUEST_NOT_FOUND", "Qonaq tapılmadı")
	}
	if in.FullName != nil {
		name := trimPtr(in.FullName)
		if name == "" {
			return nil, validationError([]apperror.FieldError{
				{Field: "full_name", Message: "Ad tələb olunur"},
			})
		}
		guest.FullName = name
	}
	if in.Phone != nil {
		guest.Phone = cleanPtr(in.Phone)
	}
	if in.Passport != nil {
		guest.Passport = cleanPtr(in.Passport)
	}
	if in.Nationality != nil {
		guest.Nationality = cleanPtr(in.Nationality)
	}
	if in.Notes != nil {
		guest.Notes = cleanPtr(in.Notes)
	}
	if err := s.guests.Update(guest); err != nil {
		return nil, apperror.Internal()
	}
	return guest, nil
}

func (s *guestService) Delete(id string) error {
	if _, err := s.guests.FindByID(id); err != nil {
		return apperror.NotFound("GUEST_NOT_FOUND", "Qonaq tapılmadı")
	}
	if err := s.guests.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}

// cleanPtr trims a *string; returns nil if the trimmed result is empty.
func cleanPtr(p *string) *string {
	v := trimPtr(p)
	if v == "" {
		return nil
	}
	return &v
}
```

- [ ] **Step 2: Confirm apperror.NotFound exists (else adjust)**

```bash
grep -n "func NotFound\|func TourNotFound\|func EventNotFound\|func Internal\|func ValidationError" backend/pkg/apperror/*.go
```
Expected: a generic `NotFound(code, message string)` constructor. **If it does NOT exist**, add it to the apperror package mirroring `TourNotFound`:

```go
// NotFound builds a 404 with a custom code+message.
func NotFound(code, message string) *AppError {
	return &AppError{Status: 404, Code: code, Message: message}
}
```
(Match the exact `AppError` struct field names found in the grep output — adjust `Status/Code/Message` if the real fields differ.)

- [ ] **Step 3: Verify compile (Air)**

```bash
docker logs turplanlayici_backend_dev 2>&1 | tail -5
```
Expected: `running...`, no build error.

- [ ] **Step 4: Commit**

```bash
git add backend/internal/service/guest_service.go backend/pkg/apperror/
git commit -m "feat(backend): guest service with validation"
```

---

### Task A4: Guest handler + routes + wiring

**Files:**
- Create: `backend/internal/handler/guest_handler.go`
- Modify: `backend/internal/router/router.go` (add `Guest` field to `Handlers` struct + routes)
- Modify: `backend/cmd/server/main.go` (wire repo→service→handler)

- [ ] **Step 1: Create the handler**

Create `backend/internal/handler/guest_handler.go`:

```go
package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// CreateGuestRequest is the POST /tours/:id/guests body (only full_name required).
type CreateGuestRequest struct {
	FullName    string  `json:"full_name"`
	Phone       *string `json:"phone"`
	Passport    *string `json:"passport"`
	Nationality *string `json:"nationality"`
	Notes       *string `json:"notes"`
}

// UpdateGuestRequest is the PATCH /guests/:id body (all optional).
type UpdateGuestRequest struct {
	FullName    *string `json:"full_name"`
	Phone       *string `json:"phone"`
	Passport    *string `json:"passport"`
	Nationality *string `json:"nationality"`
	Notes       *string `json:"notes"`
}

// GuestHandler handles guest endpoints.
type GuestHandler struct {
	guests service.GuestService
}

// NewGuestHandler builds a GuestHandler.
func NewGuestHandler(guests service.GuestService) *GuestHandler {
	return &GuestHandler{guests: guests}
}

// ListByTour handles GET /tours/:id/guests → { "data": [...] }.
func (h *GuestHandler) ListByTour(c *fiber.Ctx) error {
	guests, err := h.guests.ListByTour(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": guests})
}

// Create handles POST /tours/:id/guests → 201 created Guest.
func (h *GuestHandler) Create(c *fiber.Ctx) error {
	var req CreateGuestRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.GuestInput{
		FullName:    &req.FullName,
		Phone:       req.Phone,
		Passport:    req.Passport,
		Nationality: req.Nationality,
		Notes:       req.Notes,
	}
	guest, err := h.guests.Create(c.Params("id"), in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(guest)
}

// Update handles PATCH /guests/:id → updated Guest.
func (h *GuestHandler) Update(c *fiber.Ctx) error {
	var req UpdateGuestRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.GuestInput{
		FullName:    req.FullName,
		Phone:       req.Phone,
		Passport:    req.Passport,
		Nationality: req.Nationality,
		Notes:       req.Notes,
	}
	guest, err := h.guests.Update(c.Params("guestId"), in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(guest)
}

// Delete handles DELETE /guests/:id → { "success": true }.
func (h *GuestHandler) Delete(c *fiber.Ctx) error {
	if err := h.guests.Delete(c.Params("guestId")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
```

> Note: Update/Delete use `c.Params("guestId")` — the routes below use `:guestId` to avoid colliding with the tour `:id` group.

- [ ] **Step 2: Add Guest field to router.Handlers struct**

In `backend/internal/router/router.go`, find the `Handlers` struct definition (near the top) and add:

```go
	Guest     *handler.GuestHandler
```

- [ ] **Step 3: Add routes**

In `router.go`, right after the events routes block, add:

```go
	api.Get("/tours/:id/guests", auth, h.Guest.ListByTour)
	api.Post("/tours/:id/guests", auth, h.Guest.Create)
	api.Patch("/guests/:guestId", auth, h.Guest.Update)
	api.Delete("/guests/:guestId", auth, h.Guest.Delete)
```

- [ ] **Step 4: Wire in main.go**

In `backend/cmd/server/main.go`:
- After `eventRepo := repository.NewEventRepository(db)` add:
  ```go
	guestRepo := repository.NewGuestRepository(db)
  ```
- After `eventSvc := service.NewEventService(eventRepo, tourRepo)` add:
  ```go
	guestSvc := service.NewGuestService(guestRepo, tourRepo)
  ```
- In the `router.Handlers{...}` literal, after `Event: handler.NewEventHandler(eventSvc),` add:
  ```go
		Guest:     handler.NewGuestHandler(guestSvc),
  ```

- [ ] **Step 5: Verify compile + smoke test the API end-to-end**

Wait ~8s for Air, then:

```bash
CURL=$(command -v curl)
TOKEN=$($CURL -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
TOUR=$($CURL -s http://localhost:8080/api/tours -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print((d.get('data') or d)[0]['id'])")
echo "tour=$TOUR"
# create
$CURL -s -X POST "http://localhost:8080/api/tours/$TOUR/guests" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"full_name":"Əli Vəliyev","phone":"+994501234567","passport":"AA1234567","nationality":"Azərbaycan"}' -w "\ncreate HTTP %{http_code}\n"
# list
$CURL -s "http://localhost:8080/api/tours/$TOUR/guests" -H "Authorization: Bearer $TOKEN" -w "\nlist HTTP %{http_code}\n"
# empty name → 422
$CURL -s -X POST "http://localhost:8080/api/tours/$TOUR/guests" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"full_name":"  "}' -w "\nempty-name HTTP %{http_code}\n"
```
Expected: create → 201 with a guest JSON (id, full_name…); list → 200 with `data:[...]`; empty-name → 422.

- [ ] **Step 6: Commit**

```bash
git add backend/internal/handler/guest_handler.go backend/internal/router/router.go backend/cmd/server/main.go
git commit -m "feat(backend): guest handler, routes, wiring"
```

---

### Task A5: Frontend guest types + API client + query keys

**Files:**
- Modify: `frontend/src/lib/types/index.ts` (add Guest types)
- Create: `frontend/src/lib/api/guests.ts`
- Modify: `frontend/src/lib/api/index.ts` (re-export)
- Modify: `frontend/src/lib/query.tsx` (add key)

- [ ] **Step 1: Add types**

Append to `frontend/src/lib/types/index.ts`:

```ts
export interface Guest {
  id: string;
  tour_id: string;
  full_name: string;
  phone: string | null;
  passport: string | null;
  nationality: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestRequest {
  full_name: string;
  phone?: string | null;
  passport?: string | null;
  nationality?: string | null;
  notes?: string | null;
}

export type UpdateGuestRequest = Partial<CreateGuestRequest>;
```

- [ ] **Step 2: Create the API client**

Create `frontend/src/lib/api/guests.ts`:

```ts
import { api } from "./axios";
import type {
  Guest,
  ListResponse,
  CreateGuestRequest,
  UpdateGuestRequest,
  SuccessResponse,
} from "@/lib/types";

/** GET /tours/:id/guests — protected. */
export async function listTourGuests(tourId: string): Promise<Guest[]> {
  const { data } = await api.get<ListResponse<Guest>>(`/tours/${tourId}/guests`);
  return data.data;
}

/** POST /tours/:id/guests — protected. Returns created Guest. */
export async function createGuest(
  tourId: string,
  body: CreateGuestRequest,
): Promise<Guest> {
  const { data } = await api.post<Guest>(`/tours/${tourId}/guests`, body);
  return data;
}

/** PATCH /guests/:id — protected. Returns updated Guest. */
export async function updateGuest(id: string, body: UpdateGuestRequest): Promise<Guest> {
  const { data } = await api.patch<Guest>(`/guests/${id}`, body);
  return data;
}

/** DELETE /guests/:id — protected. */
export async function deleteGuest(id: string): Promise<SuccessResponse> {
  const { data } = await api.delete<SuccessResponse>(`/guests/${id}`);
  return data;
}
```

- [ ] **Step 3: Re-export in the API barrel**

In `frontend/src/lib/api/index.ts`:
- Add to the namespaced imports: `import * as guestsApi from "./guests";`
- Add `guestsApi` to the `export { ... }` namespaced list.
- Add a flat re-export line:
  ```ts
  export { listTourGuests, createGuest, updateGuest, deleteGuest } from "./guests";
  ```

- [ ] **Step 4: Add query keys**

In `frontend/src/lib/query.tsx`, inside the `queryKeys` object add:

```ts
  tourGuests: (id: string) => ["tour", id, "guests"] as const,
```

- [ ] **Step 5: Confirm ListResponse/SuccessResponse exist (they're reused from events)**

```bash
grep -n "ListResponse\|SuccessResponse" frontend/src/lib/types/index.ts | head
```
Expected: both types already defined (events api uses them). If a differently-named envelope is used, match it in `guests.ts`.

- [ ] **Step 6: Verify typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: no output (clean).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/lib/types/index.ts frontend/src/lib/api/guests.ts frontend/src/lib/api/index.ts frontend/src/lib/query.tsx
git commit -m "feat(frontend): guest types, api client, query keys"
```

---

### Task A6: Guest hooks + i18n

**Files:**
- Create: `frontend/src/lib/hooks/use-guests.ts`
- Modify: `frontend/src/lib/i18n/az.ts` (add guest strings)

- [ ] **Step 1: Add i18n strings**

In `frontend/src/lib/i18n/az.ts`, add a `guest` block (place near the `event` block) and extend `field`:

```ts
  guest: {
    section_title: "Qonaqlar",
    add: "Qonaq əlavə et",
    edit: "Qonağı redaktə et",
    empty_title: "Hələ qonaq yoxdur",
    empty_subtitle: "Bu tura turist əlavə edin",
    delete_confirm: "Bu qonağı silmək istəyirsiniz?",
    created: "Qonaq əlavə edildi",
    updated: "Qonaq yeniləndi",
    deleted: "Qonaq silindi",
    name_required: "Ad tələb olunur",
  },
```

And add to the `field` block:

```ts
    full_name: "Ad, soyad",
    passport: "Pasport nömrəsi",
    nationality: "Vətəndaşlıq",
```

- [ ] **Step 2: Create the hooks**

Create `frontend/src/lib/hooks/use-guests.ts` (mirrors the inline optimistic pattern from the tour page):

```ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listTourGuests,
  createGuest,
  updateGuest,
  deleteGuest,
} from "@/lib/api/guests";
import { queryKeys } from "@/lib/query";
import { toast } from "@/components/ui/sonner";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, UpdateGuestRequest } from "@/lib/types";

export function useTourGuests(tourId: string) {
  return useQuery({
    queryKey: queryKeys.tourGuests(tourId),
    queryFn: () => listTourGuests(tourId),
    enabled: Boolean(tourId),
  });
}

export function useCreateGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateGuestRequest) => createGuest(tourId, body),
    onSuccess: () => {
      toast.success(az.guest.created);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}

export function useUpdateGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; body: UpdateGuestRequest }) =>
      updateGuest(vars.id, vars.body),
    onSuccess: () => {
      toast.success(az.guest.updated);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}

export function useDeleteGuest(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuest(id),
    onSuccess: () => {
      toast.success(az.guest.deleted);
      qc.invalidateQueries({ queryKey: queryKeys.tourGuests(tourId) });
    },
  });
}
```

- [ ] **Step 3: Verify typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/hooks/use-guests.ts frontend/src/lib/i18n/az.ts
git commit -m "feat(frontend): guest hooks + i18n strings"
```

---

### Task A7: Guest form sheet + card + section UI

**Files:**
- Create: `frontend/src/components/tour-detail/guest-form.tsx`
- Create: `frontend/src/components/tour-detail/guest-form-sheet.tsx`
- Create: `frontend/src/components/tour-detail/guest-card.tsx`
- Create: `frontend/src/components/tour-detail/guest-section.tsx`
- Modify: `frontend/src/app/(app)/tours/[id]/page.tsx` (render the section)

- [ ] **Step 1: Create the guest form (react-hook-form + zod)**

Create `frontend/src/components/tour-detail/guest-form.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { az } from "@/lib/i18n/az";
import { cn } from "@/lib/utils/cn";
import type { Guest, CreateGuestRequest } from "@/lib/types";

const schema = z.object({
  full_name: z.string().trim().min(1, { message: az.guest.name_required }),
  phone: z.string().optional(),
  passport: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

type GuestFormValues = z.infer<typeof schema>;

export interface GuestFormProps {
  guest?: Guest;
  formId: string;
  onSubmit: (body: CreateGuestRequest) => void;
}

export function GuestForm({ guest, formId, onSubmit }: GuestFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GuestFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: guest?.full_name ?? "",
      phone: guest?.phone ?? "",
      passport: guest?.passport ?? "",
      nationality: guest?.nationality ?? "",
      notes: guest?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      full_name: guest?.full_name ?? "",
      phone: guest?.phone ?? "",
      passport: guest?.passport ?? "",
      nationality: guest?.nationality ?? "",
      notes: guest?.notes ?? "",
    });
  }, [guest, reset]);

  const submit = handleSubmit((v) => {
    const t = (s?: string) => {
      const x = s?.trim();
      return x ? x : null;
    };
    onSubmit({
      full_name: v.full_name.trim(),
      phone: t(v.phone),
      passport: t(v.passport),
      nationality: t(v.nationality),
      notes: t(v.notes),
    });
  });

  return (
    <form id={formId} onSubmit={submit} className="space-y-4 px-0.5 py-1">
      <GField label={az.field.full_name} error={errors.full_name?.message}>
        <Input autoFocus placeholder={az.field.full_name} {...register("full_name")} />
      </GField>
      <GField label={az.field.phone} optional>
        <Input type="tel" inputMode="tel" placeholder="+994 50 123 45 67" {...register("phone")} />
      </GField>
      <div className="grid grid-cols-2 gap-3">
        <GField label={az.field.passport} optional>
          <Input placeholder="AA1234567" {...register("passport")} />
        </GField>
        <GField label={az.field.nationality} optional>
          <Input placeholder="Azərbaycan" {...register("nationality")} />
        </GField>
      </div>
      <GField label={az.field.notes} optional>
        <Textarea rows={2} placeholder={az.field.notes} {...register("notes")} />
      </GField>
    </form>
  );
}

function GField({
  label,
  optional,
  error,
  children,
  className,
}: {
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label optional={optional}>{label}</Label>
      {children}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

/** Footer buttons for the guest form. */
export function GuestFormFooter({
  formId,
  submitting,
  onCancel,
}: {
  formId: string;
  submitting?: boolean;
  onCancel: () => void;
}) {
  return (
    <>
      <Button variant="secondary" type="button" onClick={onCancel} disabled={submitting}>
        {az.action.cancel}
      </Button>
      <Button type="submit" form={formId} loading={submitting}>
        {az.action.save}
      </Button>
    </>
  );
}
```

- [ ] **Step 2: Create the sheet wrapper**

Create `frontend/src/components/tour-detail/guest-form-sheet.tsx`:

```tsx
"use client";

import { BottomSheetForm } from "@/components/shared/bottom-sheet-form";
import { GuestForm, GuestFormFooter } from "./guest-form";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, Guest } from "@/lib/types";

const FORM_ID = "guest-form";

export interface GuestFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  guest?: Guest;
  submitting?: boolean;
  onSubmit: (body: CreateGuestRequest) => void;
}

export function GuestFormSheet({
  open,
  onOpenChange,
  guest,
  submitting,
  onSubmit,
}: GuestFormSheetProps) {
  return (
    <BottomSheetForm
      open={open}
      onOpenChange={onOpenChange}
      title={guest ? az.guest.edit : az.guest.add}
      className="sm:max-w-md"
      footer={
        <GuestFormFooter
          formId={FORM_ID}
          submitting={submitting}
          onCancel={() => onOpenChange(false)}
        />
      }
    >
      <GuestForm formId={FORM_ID} guest={guest} onSubmit={onSubmit} />
    </BottomSheetForm>
  );
}
```

- [ ] **Step 3: Create the guest card**

Create `frontend/src/components/tour-detail/guest-card.tsx`:

```tsx
"use client";

import { User, Phone, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Guest } from "@/lib/types";

export interface GuestCardProps {
  guest: Guest;
  onClick: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

export function GuestCard({ guest, onClick, onDelete }: GuestCardProps) {
  return (
    <Card
      className="flex items-center gap-3 p-3 transition-colors hover:bg-accent-subtle/40 cursor-pointer"
      onClick={() => onClick(guest)}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-subtle text-accent">
        <User className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{guest.full_name}</p>
        {guest.phone && (
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Phone className="size-3" />
            {guest.phone}
          </p>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-muted-foreground hover:text-danger"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(guest);
        }}
      >
        <Trash2 className="size-4" />
      </Button>
    </Card>
  );
}
```

- [ ] **Step 4: Create the section (owns its own state + mutations)**

Create `frontend/src/components/tour-detail/guest-section.tsx`:

```tsx
"use client";

import { useState } from "react";
import { UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { GuestCard } from "./guest-card";
import { GuestFormSheet } from "./guest-form-sheet";
import {
  useTourGuests,
  useCreateGuest,
  useUpdateGuest,
  useDeleteGuest,
} from "@/lib/hooks/use-guests";
import { az } from "@/lib/i18n/az";
import type { CreateGuestRequest, Guest } from "@/lib/types";

export function GuestSection({ tourId }: { tourId: string }) {
  const { data: guests = [] } = useTourGuests(tourId);
  const createM = useCreateGuest(tourId);
  const updateM = useUpdateGuest(tourId);
  const deleteM = useDeleteGuest(tourId);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Guest | undefined>();
  const [toDelete, setToDelete] = useState<Guest | undefined>();

  const openCreate = () => {
    setEditing(undefined);
    setSheetOpen(true);
  };
  const openEdit = (g: Guest) => {
    setEditing(g);
    setSheetOpen(true);
  };

  const submit = (body: CreateGuestRequest) => {
    if (editing) {
      updateM.mutate(
        { id: editing.id, body },
        { onSuccess: () => setSheetOpen(false) },
      );
    } else {
      createM.mutate(body, { onSuccess: () => setSheetOpen(false) });
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-h3 font-semibold tracking-tight text-foreground">
          <Users className="size-5 text-accent" />
          {az.guest.section_title}
          <span className="text-muted-foreground">({guests.length})</span>
        </h2>
        <Button variant="ghost" size="sm" className="text-accent" onClick={openCreate}>
          <UserPlus className="size-4" />
          <span className="hidden sm:inline">{az.guest.add}</span>
        </Button>
      </div>

      {guests.length === 0 ? (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          {az.guest.empty_subtitle}
        </Card>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {guests.map((g) => (
            <GuestCard key={g.id} guest={g} onClick={openEdit} onDelete={setToDelete} />
          ))}
        </div>
      )}

      <GuestFormSheet
        open={sheetOpen}
        onOpenChange={(o) => {
          setSheetOpen(o);
          if (!o) setEditing(undefined);
        }}
        guest={editing}
        submitting={createM.isPending || updateM.isPending}
        onSubmit={submit}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(o) => !o && setToDelete(undefined)}
        title={az.guest.delete_confirm}
        loading={deleteM.isPending}
        onConfirm={() =>
          toDelete &&
          deleteM.mutate(toDelete.id, { onSuccess: () => setToDelete(undefined) })
        }
      />
    </section>
  );
}
```

- [ ] **Step 5: Render the section in the tour page**

In `frontend/src/app/(app)/tours/[id]/page.tsx`:
- Add import: `import { GuestSection } from "@/components/tour-detail/guest-section";`
- Inside `<PageBody className="space-y-6">`, between `<TourDetailHeader ... />` and the events block (`{eventsQuery.isLoading ? ... }`), add:
  ```tsx
          <GuestSection tourId={tourId} />
  ```

- [ ] **Step 6: Verify typecheck + browser**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: clean. Then in the browser (Playwright): login (admin/admin123) → open a tour → confirm the "Qonaqlar (N)" section renders with an "Qonaq əlavə et" button → add a guest ("Test Turist" + phone) → it appears as a card → click it → edit sheet opens prefilled → delete it via trash icon → confirm dialog → card disappears.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/tour-detail/guest-form.tsx frontend/src/components/tour-detail/guest-form-sheet.tsx frontend/src/components/tour-detail/guest-card.tsx frontend/src/components/tour-detail/guest-section.tsx "frontend/src/app/(app)/tours/[id]/page.tsx"
git commit -m "feat(frontend): guest section UI on tour detail"
```

---

## BLOCK B — Tip-spesifik tədbir yaratma

### Task B1: Backend — details JSON + guest_ids on event create/update

**Files:**
- Modify: `backend/internal/handler/event_handler.go` (add `Details map[string]any` + `GuestIDs []string` to request DTOs; pass through)
- Modify: `backend/internal/service/event_service.go` (marshal details → string; sync guest associations)
- Modify: `backend/internal/repository/event_repository.go` (add guest-sync helper + Preload guests on reads)

- [ ] **Step 1: Add Details + GuestIDs to request DTOs**

In `backend/internal/handler/event_handler.go`:
- Add `"encoding/json"` to imports.
- In `CreateEventRequest` struct, after `Status *string`, add:
  ```go
	Details  map[string]any `json:"details"`
	GuestIDs []string       `json:"guest_ids"`
  ```
- Same two fields in `UpdateEventRequest`.
- Add a helper at the bottom of the file:
  ```go
  // marshalDetails turns a details map into a *string of JSON (nil if empty).
  func marshalDetails(m map[string]any) *string {
	if len(m) == 0 {
		return nil
	}
	b, err := json.Marshal(m)
	if err != nil {
		return nil
	}
	s := string(b)
	return &s
  }
  ```
- In `Create`, set on the `service.EventInput`:
  ```go
		Details:  marshalDetails(req.Details),
		GuestIDs: req.GuestIDs,
  ```
- In `Update`, do the same. For update, `GuestIDs` should sync only when the key was sent; since Go can't distinguish "absent" from "empty slice" for a plain `[]string`, use a `*[]string` in `UpdateEventRequest.GuestIDs` instead:
  ```go
	GuestIDs *[]string `json:"guest_ids"`
  ```
  and in the `Update` handler pass `GuestIDs: req.GuestIDs` (a `*[]string`). Keep `CreateEventRequest.GuestIDs` a plain `[]string`.

- [ ] **Step 2: Extend EventInput + service to handle details & guests**

In `backend/internal/service/event_service.go`:
- Add to `EventInput`:
  ```go
	Details  *string   // marshaled JSON (nil = leave unchanged on update)
	GuestIDs *[]string // nil = leave unchanged; non-nil = set exactly this set
  ```
- In `Create`, after building `event := &models.Event{...}`, set `Details: in.Details` in the literal (add the field). After `s.events.Create(event)` succeeds, sync guests if provided:
  ```go
	if in.GuestIDs != nil {
		if err := s.events.SetGuests(event.ID, *in.GuestIDs); err != nil {
			return nil, apperror.Internal()
		}
	}
  ```
  For **create** the handler passes a plain slice; adapt: in the handler `Create`, wrap it — `gids := req.GuestIDs; in.GuestIDs = &gids`.
- In `Update`, after loading `event`, before saving: if `in.Details != nil { event.Details = in.Details }`. After `s.events.Update(event)` succeeds:
  ```go
	if in.GuestIDs != nil {
		if err := s.events.SetGuests(event.ID, *in.GuestIDs); err != nil {
			return nil, apperror.Internal()
		}
	}
  ```
- In `Get` and `ListByTour` service methods: no change needed (repo will Preload).

- [ ] **Step 3: Add SetGuests + Preload to the repository**

In `backend/internal/repository/event_repository.go`:
- Add `SetGuests(eventID string, guestIDs []string) error` to the `EventRepository` interface.
- Implement it using GORM association replace:
  ```go
  func (r *eventRepository) SetGuests(eventID string, guestIDs []string) error {
	var event models.Event
	if err := r.db.Where("id = ?", eventID).First(&event).Error; err != nil {
		return err
	}
	guests := make([]models.Guest, 0, len(guestIDs))
	for _, id := range guestIDs {
		guests = append(guests, models.Guest{ID: id})
	}
	return r.db.Model(&event).Association("Guests").Replace(&guests)
  }
  ```
- Add `.Preload("Guests")` to `ListByTour` and `FindByID`:
  ```go
	err := r.db.Preload("Guests").Where("tour_id = ?", tourID).Order("date ASC, time ASC").Find(&events).Error
  ```
  ```go
	err := r.db.Preload("Guests").Where("id = ?", id).First(&e).Error
  ```

- [ ] **Step 4: Verify compile + end-to-end HTTP test**

Wait ~8s for Air, then:

```bash
CURL=$(command -v curl)
TOKEN=$($CURL -s -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")
TOUR=$($CURL -s http://localhost:8080/api/tours -H "Authorization: Bearer $TOKEN" | python3 -c "import sys,json;d=json.load(sys.stdin);print((d.get('data') or d)[0]['id'])")
GUEST=$($CURL -s -X POST "http://localhost:8080/api/tours/$TOUR/guests" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"full_name":"B1 Test"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['id'])")
# create a transfer event with details + guest
$CURL -s -X POST "http://localhost:8080/api/tours/$TOUR/events" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"title\":\"Hava limanı transfer\",\"type\":\"transfer\",\"date\":\"2026-07-17\",\"details\":{\"from\":\"Aeroport\",\"to\":\"Otel\",\"driver\":\"Elçin\"},\"guest_ids\":[\"$GUEST\"]}" -w "\ncreate HTTP %{http_code}\n"
# list and confirm details + guests come back
$CURL -s "http://localhost:8080/api/tours/$TOUR/events" -H "Authorization: Bearer $TOKEN" | python3 -c "
import sys,json
for e in json.load(sys.stdin)['data']:
    if e['title']=='Hava limanı transfer':
        print('details=',e.get('details'),'guests=',[g['full_name'] for g in e.get('guests',[])])
"
```
Expected: create → 201; list prints `details= {"driver":"Elçin","from":"Aeroport","to":"Otel"} guests= ['B1 Test']`.

- [ ] **Step 5: Commit**

```bash
git add backend/internal/handler/event_handler.go backend/internal/service/event_service.go backend/internal/repository/event_repository.go
git commit -m "feat(backend): event details JSON + guest associations"
```

---

### Task B2: Frontend event types — details + guests + guest_ids

**Files:**
- Modify: `frontend/src/lib/types/index.ts` (extend Event + Create/Update requests)

- [ ] **Step 1: Extend the Event type and request types**

In `frontend/src/lib/types/index.ts`:
- Add to `Event` interface (after `notes`):
  ```ts
  details: Record<string, unknown> | null;
  guests: Guest[];
  ```
  > `details` comes back from the API as a JSON string in Postgres but Fiber returns the `*string` verbatim. To get an **object** on the client, the API returns the raw stored string — so treat `details` as possibly a string. To keep it simple, define it as `Record<string, unknown> | string | null` and parse defensively in the form (see B4). Use:
  ```ts
  details: Record<string, unknown> | string | null;
  guests: Guest[];
  ```
- Add to `CreateEventRequest`:
  ```ts
  details?: Record<string, unknown> | null;
  guest_ids?: string[];
  ```
- `UpdateEventRequest` is derived via `Partial<Pick<Event, ...>>`; instead add `details`/`guest_ids` explicitly by changing it to:
  ```ts
  export type UpdateEventRequest = Partial<
    Pick<Event, "title" | "type" | "date" | "time" | "location" | "participants" | "phone" | "price" | "currency" | "payment_status" | "reminder_time" | "attachment" | "notes" | "status">
  > & {
    details?: Record<string, unknown> | null;
    guest_ids?: string[];
  };
  ```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: errors ONLY in files that consume `Event` and now need the new fields (the optimistic create object in the tour page). Note them — they're fixed in B5. If errors appear elsewhere unexpectedly, address them.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/lib/types/index.ts
git commit -m "feat(frontend): event details + guests types"
```

---

### Task B3: Per-type field config + i18n

**Files:**
- Create: `frontend/src/components/events/type-fields-config.ts`
- Modify: `frontend/src/lib/i18n/az.ts` (per-type field labels)

- [ ] **Step 1: Add i18n labels for type-specific fields**

In `frontend/src/lib/i18n/az.ts`, inside the `event` block (next to `form`), add a `details` block:

```ts
    details: {
      from: "Haradan",
      to: "Haraya",
      driver: "Maşın / Sürücü",
      driver_phone: "Sürücü telefonu",
      hotel_name: "Otel adı",
      address: "Ünvan",
      check_in: "Giriş (check-in)",
      check_out: "Çıxış (check-out)",
      room: "Otaq növü / nömrəsi",
      venue: "Məkan adı",
      reservation_time: "Rezervasiya vaxtı",
      party_size: "Nəfər sayı",
      guests_label: "Qonaqlar",
      guests_hint: "Bu tədbirdə iştirak edən turistlər",
      no_guests: "Əvvəlcə tura qonaq əlavə edin",
    },
```

- [ ] **Step 2: Create the per-type field config**

Create `frontend/src/components/events/type-fields-config.ts`. This drives which fields each type shows; keeps the form component generic:

```ts
import { az } from "@/lib/i18n/az";
import type { EventType } from "@/lib/types";

export type DetailFieldKind = "text" | "date" | "time" | "number" | "tel";

export interface DetailFieldSpec {
  key: string;
  label: string;
  kind: DetailFieldKind;
  placeholder?: string;
}

/** Type-specific detail fields shown in the event form, keyed by event type. */
export const TYPE_FIELDS: Partial<Record<EventType, DetailFieldSpec[]>> = {
  transfer: [
    { key: "from", label: az.event.details.from, kind: "text" },
    { key: "to", label: az.event.details.to, kind: "text" },
    { key: "driver", label: az.event.details.driver, kind: "text" },
    { key: "driver_phone", label: az.event.details.driver_phone, kind: "tel", placeholder: "+994 50 123 45 67" },
  ],
  hotel: [
    { key: "hotel_name", label: az.event.details.hotel_name, kind: "text" },
    { key: "address", label: az.event.details.address, kind: "text" },
    { key: "check_in", label: az.event.details.check_in, kind: "date" },
    { key: "check_out", label: az.event.details.check_out, kind: "date" },
    { key: "room", label: az.event.details.room, kind: "text" },
  ],
  restaurant: [
    { key: "venue", label: az.event.details.venue, kind: "text" },
    { key: "address", label: az.event.details.address, kind: "text" },
    { key: "reservation_time", label: az.event.details.reservation_time, kind: "time" },
    { key: "party_size", label: az.event.details.party_size, kind: "number" },
  ],
  other: [],
};

/** The four types offered as create buttons, in display order. */
export const CREATE_TYPES: EventType[] = ["transfer", "hotel", "restaurant", "other"];
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: clean.

```bash
git add frontend/src/components/events/type-fields-config.ts frontend/src/lib/i18n/az.ts
git commit -m "feat(frontend): per-type field config + i18n"
```

---

### Task B4: Rework EventForm — type-specific fields + guest picker

**Files:**
- Modify: `frontend/src/components/events/event-form.tsx` (render type fields from config; add guest multi-select; build `details` + `guest_ids` on submit)
- Modify: `frontend/src/components/tour-detail/event-form-sheet.tsx` (thread `defaultType` + `tourId`)

- [ ] **Step 1: Add defaultType + tourId to EventForm props and sheet**

In `event-form-sheet.tsx`:
- Add props `defaultType?: EventType` and `tourId: string` to `EventFormSheetProps` (import `EventType`).
- Pass both into `<EventForm ... defaultType={defaultType} tourId={tourId} />`.
- Title: when creating, show the type name — change title to:
  ```tsx
  title={isEdit ? az.screen.event_edit : az.eventType[defaultType ?? "other"]}
  ```

In `event-form.tsx`, add to `EventFormProps`: `defaultType?: EventType;` and `tourId: string;`.

- [ ] **Step 2: Initialize type from defaultType; render type-specific fields**

In `event-form.tsx`:
- In `defaults`, set `type: event?.type ?? defaultType ?? "other"`.
- Add `details` seeding: parse existing `event.details` (may be a string) into an object once:
  ```ts
  const initialDetails: Record<string, string> = (() => {
    const d = event?.details;
    if (!d) return {};
    const obj = typeof d === "string" ? safeParse(d) : (d as Record<string, unknown>);
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) out[k] = v == null ? "" : String(v);
    return out;
  })();
  ```
  with a helper:
  ```ts
  function safeParse(s: string): Record<string, unknown> {
    try { return JSON.parse(s); } catch { return {}; }
  }
  ```
- Register type-specific fields dynamically. Since these are dynamic per type, use a local `useState<Record<string,string>>(initialDetails)` rather than zod fields:
  ```ts
  const [details, setDetails] = useState<Record<string, string>>(initialDetails);
  const watchedType = watch("type");
  const typeFields = TYPE_FIELDS[watchedType] ?? [];
  ```
  Reset `details` when the edit target changes (in the existing reset effect, also `setDetails(initialDetails)`).
- In the JSX, right after the Title field and before the "more details" toggle, render the type-specific block:
  ```tsx
  {typeFields.length > 0 && (
    <div className="space-y-4">
      {typeFields.map((f) => (
        <Field key={f.key} label={f.label} optional>
          <Input
            type={f.kind === "number" ? "number" : f.kind === "date" ? "date" : f.kind === "time" ? "time" : f.kind === "tel" ? "tel" : "text"}
            inputMode={f.kind === "number" ? "decimal" : f.kind === "tel" ? "tel" : undefined}
            placeholder={f.placeholder ?? f.label}
            value={details[f.key] ?? ""}
            onChange={(e) => setDetails((d) => ({ ...d, [f.key]: e.target.value }))}
          />
        </Field>
      ))}
    </div>
  )}
  ```

- [ ] **Step 3: Add the guest multi-select**

- Import `useTourGuests` and use it: `const { data: tourGuests = [] } = useTourGuests(tourId);`
- Add guest selection state: seed from `event?.guests`:
  ```ts
  const [guestIds, setGuestIds] = useState<string[]>(event?.guests?.map((g) => g.id) ?? []);
  ```
  (reset it in the reset effect too.)
- Render a chip/checkbox list inside the "Daha çox detal" panel, in a new group titled `az.event.details.guests_label`:
  ```tsx
  <FieldGroup title={az.event.details.guests_label}>
    {tourGuests.length === 0 ? (
      <p className="text-xs text-muted-foreground">{az.event.details.no_guests}</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {tourGuests.map((g) => {
          const on = guestIds.includes(g.id);
          return (
            <button
              type="button"
              key={g.id}
              onClick={() =>
                setGuestIds((ids) => (on ? ids.filter((x) => x !== g.id) : [...ids, g.id]))
              }
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors",
                on
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border bg-surface text-foreground hover:border-accent",
              )}
            >
              {g.full_name}
            </button>
          );
        })}
      </div>
    )}
  </FieldGroup>
  ```

- [ ] **Step 4: Include details + guest_ids in submit**

In the `submit` handler's `body` object, add:
```ts
      details: Object.fromEntries(
        Object.entries(details)
          .map(([k, v]) => [k, v.trim()])
          .filter(([, v]) => v !== ""),
      ),
      guest_ids: guestIds,
```
> Empty-string detail fields are dropped so `details` stays clean. `party_size` stays a string here; backend stores JSON as-is — acceptable (display coerces). If numeric typing is desired later, coerce in a follow-up.

- [ ] **Step 5: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: clean (the tour page optimistic-object errors from B2 are fixed in B5, which should be done together if tsc complains — but this task's own file should be clean).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/events/event-form.tsx frontend/src/components/tour-detail/event-form-sheet.tsx
git commit -m "feat(frontend): type-specific event fields + guest picker in form"
```

---

### Task B5: Per-type buttons in the timeline + wire the page

**Files:**
- Modify: `frontend/src/components/tour-detail/day-timeline.tsx` (replace single add button with four type buttons)
- Modify: `frontend/src/app/(app)/tours/[id]/page.tsx` (thread type through openCreate; fix optimistic object; pass tourId/defaultType to sheet)
- Modify: `frontend/src/lib/i18n/az.ts` (button labels already exist via `az.eventType.*`)

- [ ] **Step 1: Update DayTimeline to emit a type**

In `day-timeline.tsx`:
- Change `onAddEvent` prop type to `(dateISO: string, type: EventType) => void`. Import `EventType` and `CREATE_TYPES` + `EVENT_TYPE_ICON`.
- Replace the single header add `Button` and the dashed empty-state button with a row of four buttons. Define a small local component to avoid duplication:
  ```tsx
  function TypeButtons({ dateISO, onAdd }: { dateISO: string; onAdd: (d: string, t: EventType) => void }) {
    return (
      <div className="flex flex-wrap gap-2">
        {CREATE_TYPES.map((t) => {
          const Icon = EVENT_TYPE_ICON[t];
          return (
            <Button
              key={t}
              variant="secondary"
              size="sm"
              onClick={() => onAdd(dateISO, t)}
            >
              <Icon className="size-4" style={{ color: eventMeta(t).color }} />
              {az.eventType[t]}
            </Button>
          );
        })}
      </div>
    );
  }
  ```
- In the day header: replace the single ghost Button with `<TypeButtons dateISO={section.dateISO} onAdd={onAddEvent} />`. For a day with zero events, also render `<TypeButtons ... />` in place of the dashed button (keep it inside a lightly bordered container for affordance).
- Import `EVENT_TYPE_ICON` from `@/components/shared/event-type-icon` (already used elsewhere) and confirm the export name via:
  ```bash
  grep -n "export" frontend/src/components/shared/event-type-icon.tsx | head
  ```
  Use the exact exported symbol (it may be `EVENT_TYPE_ICON` map or an `EventTypeIcon` component — if it's the component, render `<EventTypeIcon type={t} />` instead of the map lookup).

- [ ] **Step 2: Thread type through the page**

In `frontend/src/app/(app)/tours/[id]/page.tsx`:
- Add state: `const [prefillType, setPrefillType] = useState<EventType | undefined>();` (import `EventType`).
- Change `openCreate` to accept a type:
  ```ts
  const openCreate = (dateISO?: string, type?: EventType) => {
    setEditingEvent(undefined);
    setPrefillDate(dateISO ?? tour?.start_date);
    setPrefillType(type ?? "other");
    setEventSheetOpen(true);
  };
  ```
- Pass `defaultType={prefillType}` and `tourId={tourId}` to `<EventFormSheet ... />`.
- The mobile FAB currently calls `openCreate()` — change it to `openCreate(undefined, "other")` (or leave a small menu; for now default to "other").
- Fix the optimistic create object: add the new required Event fields so the type checks:
  ```ts
        details: (body.details as Record<string, unknown>) ?? null,
        guests: [],
  ```
  (add these two lines inside the `optimistic: Event = {...}` literal).

- [ ] **Step 3: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -20
```
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/tour-detail/day-timeline.tsx "frontend/src/app/(app)/tours/[id]/page.tsx"
git commit -m "feat(frontend): per-type create buttons per day + page wiring"
```

---

### Task B6: Show details + guests on the event card

**Files:**
- Modify: `frontend/src/components/shared/event-card.tsx` (render a couple of key detail fields + guest names)

- [ ] **Step 1: Render guests + a primary detail line**

In `event-card.tsx`, after the existing `event.participants` block, add a guests line and a type-aware detail summary. Keep it minimal (one line each). Parse details defensively:

```tsx
{event.guests && event.guests.length > 0 && (
  <div className="flex items-center gap-1 text-xs text-muted-foreground">
    <Users className="size-3" />
    <span className="truncate">{event.guests.map((g) => g.full_name).join(", ")}</span>
  </div>
)}
```
- Import `Users` from `lucide-react`.
- For a type detail summary (e.g. transfer "Aeroport → Otel"), add a helper near the top of the file:
  ```tsx
  function detailSummary(event: Event): string | null {
    const raw = event.details;
    if (!raw) return null;
    const d = (typeof raw === "string" ? safeParse(raw) : raw) as Record<string, unknown>;
    if (event.type === "transfer" && (d.from || d.to)) return `${d.from ?? "?"} → ${d.to ?? "?"}`;
    if (event.type === "hotel" && d.hotel_name) return String(d.hotel_name);
    if (event.type === "restaurant" && d.venue) return String(d.venue);
    return null;
  }
  function safeParse(s: string): Record<string, unknown> {
    try { return JSON.parse(s); } catch { return {}; }
  }
  ```
- Render it right under the title:
  ```tsx
  {detailSummary(event) && (
    <p className="truncate text-xs text-muted-foreground">{detailSummary(event)}</p>
  )}
  ```

- [ ] **Step 2: Typecheck**

```bash
cd frontend && npx tsc --noEmit 2>&1 | head -10
```
Expected: clean.

- [ ] **Step 3: Full end-to-end browser verification**

In the browser (Playwright), login (admin/admin123) → open a tour:
1. Add 2 guests in the Qonaqlar section.
2. Under a day, confirm four buttons render: **🚐 Transfer · 🏨 Otel · 🍽️ Restoran · ➕ Digər**.
3. Click **Transfer** → form title is "Transfer", shows Haradan/Haraya/Sürücü/Sürücü telefonu fields.
4. Fill Haradan="Aeroport", Haraya="Hilton", pick both guests in the "Daha çox detal" → Qonaqlar chips, Save.
5. The event card shows "Aeroport → Hilton" and both guest names.
6. Click **Otel** on another day → confirm hotel-specific fields (check-in/out, otaq), different from transfer.
7. Edit the transfer event → confirm details + guest chips are prefilled correctly.
8. Delete the test events + guests to clean up.

Confirm 0 console errors throughout.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/shared/event-card.tsx
git commit -m "feat(frontend): show event details summary + guests on card"
```

---

## Final verification

- [ ] Run typecheck + lint clean:
  ```bash
  cd frontend && npx tsc --noEmit && npx next lint --file src/components/events/event-form.tsx --file src/components/tour-detail/day-timeline.tsx
  ```
- [ ] Backend has no build errors: `docker logs turplanlayici_backend_dev 2>&1 | tail -5` shows `running...`.
- [ ] Clean up all test data (guests + events) created during verification via the API or UI.
- [ ] Confirm old events (pre-existing "test" transfer) still render without errors (backward compatibility — no details, no guests).

---

## Notes on decomposition & risk

- **Backward compatibility:** Old events have `details = null` and no guests — every read path handles null. Old event types `tour`/`flight`/`note` remain valid in the enum and render as-is; they're just not offered as create buttons.
- **`details` string vs object:** Postgres stores JSONB; Fiber serializes the Go `*string` as a JSON **string** in the response. The frontend parses defensively (`safeParse`) everywhere it reads `details`. If later you want the API to return a real object, switch the model field to `datatypes.JSON` (requires `go get gorm.io/datatypes`) — out of scope here.
- **Guest deletion:** `ON DELETE CASCADE` on `event_guests` (via the many2many join) means deleting a guest also removes its event links. Deleting a tour cascades to guests (FK index on tour_id; if a hard FK constraint is desired, it can be added, but AutoMigrate + the existing pattern rely on app-level cascade like the rest of the app).
