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

// UpdateGuestRequest is the PATCH /guests/:guestId body (all optional).
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

// Update handles PATCH /guests/:guestId → updated Guest.
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

// Delete handles DELETE /guests/:guestId → { "success": true }.
func (h *GuestHandler) Delete(c *fiber.Ctx) error {
	if err := h.guests.Delete(c.Params("guestId")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
