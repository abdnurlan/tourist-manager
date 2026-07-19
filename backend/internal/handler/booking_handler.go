package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// CreateBookingRequest is the public POST /public/bookings body.
type CreateBookingRequest struct {
	CatalogTourID *string `json:"catalog_tour_id"`
	TourSlug      *string `json:"tour_slug"`
	TourTitle     *string `json:"tour_title"`
	FullName      string  `json:"full_name"`
	Phone         *string `json:"phone"`
	Email         *string `json:"email"`
	People        *int    `json:"people"`
	Date          *string `json:"date"`
	TourID        *string `json:"tour_id"`
	Notes         *string `json:"notes"`
}

// UpdateBookingStatusRequest is the admin PATCH /bookings/:id body.
type UpdateBookingStatusRequest struct {
	Status string `json:"status"`
}

// BookingHandler handles booking endpoints (public create + admin manage).
type BookingHandler struct {
	svc service.BookingService
}

// NewBookingHandler builds a BookingHandler.
func NewBookingHandler(svc service.BookingService) *BookingHandler {
	return &BookingHandler{svc: svc}
}

// Create handles POST /public/bookings (public, no auth) → 201.
func (h *BookingHandler) Create(c *fiber.Ctx) error {
	var req CreateBookingRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.BookingInput{
		CatalogTourID: req.CatalogTourID,
		TourSlug:      req.TourSlug,
		TourTitle:     req.TourTitle,
		FullName:      &req.FullName,
		Phone:         req.Phone,
		Email:         req.Email,
		People:        req.People,
		Date:          req.Date,
		TourID:        req.TourID,
		Notes:         req.Notes,
	}
	booking, err := h.svc.Create(in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(booking)
}

// List handles GET /bookings (admin) → { "data": [...] }.
func (h *BookingHandler) List(c *fiber.Ctx) error {
	bookings, err := h.svc.List(repository.BookingFilter{Status: c.Query("status")})
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": bookings})
}

// UpdateStatus handles PATCH /bookings/:id (admin).
func (h *BookingHandler) UpdateStatus(c *fiber.Ctx) error {
	var req UpdateBookingStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	booking, err := h.svc.UpdateStatus(c.Params("id"), req.Status)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(booking)
}

// Delete handles DELETE /bookings/:id (admin) → { "success": true }.
func (h *BookingHandler) Delete(c *fiber.Ctx) error {
	if err := h.svc.Delete(c.Params("id")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
