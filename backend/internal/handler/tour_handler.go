package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// CreateTourRequest is the POST /tours body.
type CreateTourRequest struct {
	Title       string  `json:"title"       validate:"required"`
	StartDate   string  `json:"start_date"  validate:"required"`
	EndDate     string  `json:"end_date"    validate:"required"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
}

// UpdateTourRequest is the PATCH /tours/:id body (all optional).
type UpdateTourRequest struct {
	Title       *string `json:"title"`
	StartDate   *string `json:"start_date"`
	EndDate     *string `json:"end_date"`
	Description *string `json:"description"`
	Status      *string `json:"status"`
}

// TourHandler handles tour endpoints.
type TourHandler struct {
	tours service.TourService
}

// NewTourHandler builds a TourHandler.
func NewTourHandler(tours service.TourService) *TourHandler {
	return &TourHandler{tours: tours}
}

// List handles GET /tours?status=&q= → { "data": [...] }.
func (h *TourHandler) List(c *fiber.Ctx) error {
	filter := repository.TourFilter{
		Status: c.Query("status"),
		Query:  c.Query("q"),
	}
	tours, err := h.tours.List(filter)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": tours})
}

// Create handles POST /tours → 201 created Tour (bare).
func (h *TourHandler) Create(c *fiber.Ctx) error {
	var req CreateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.TourInput{
		Title:       &req.Title,
		StartDate:   &req.StartDate,
		EndDate:     &req.EndDate,
		Description: req.Description,
		Status:      req.Status,
	}
	tour, err := h.tours.Create(in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(tour)
}

// Get handles GET /tours/:id → Tour (bare).
func (h *TourHandler) Get(c *fiber.Ctx) error {
	tour, err := h.tours.Get(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(tour)
}

// Update handles PATCH /tours/:id → updated Tour (bare).
func (h *TourHandler) Update(c *fiber.Ctx) error {
	var req UpdateTourRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.TourInput{
		Title:       req.Title,
		StartDate:   req.StartDate,
		EndDate:     req.EndDate,
		Description: req.Description,
		Status:      req.Status,
	}
	tour, err := h.tours.Update(c.Params("id"), in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(tour)
}

// Delete handles DELETE /tours/:id → { "success": true }.
func (h *TourHandler) Delete(c *fiber.Ctx) error {
	if err := h.tours.Delete(c.Params("id")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
