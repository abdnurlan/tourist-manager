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
