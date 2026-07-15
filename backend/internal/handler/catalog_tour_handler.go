package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// CatalogTourRequest is the create/update body. Pointers on scalars let PATCH
// leave fields unchanged; maps are replaced wholesale when present.
type CatalogTourRequest struct {
	Slug       *string                       `json:"slug"`
	Category   *string                       `json:"category"`
	Price      *int                          `json:"price"`
	Rating     *float64                      `json:"rating"`
	Duration   *int                          `json:"duration"`
	GroupSize  *string                       `json:"group_size"`
	ImageURL   *string                       `json:"image_url"`
	Published  *bool                         `json:"published"`
	SortOrder  *int                          `json:"sort_order"`
	Title      map[string]string             `json:"title"`
	Region     map[string]string             `json:"region"`
	Overview   map[string]string             `json:"overview"`
	Highlights map[string][]string           `json:"highlights"`
	Itinerary  map[string][]models.DayPlan   `json:"itinerary"`
	Included   map[string][]string           `json:"included"`
	Excluded   map[string][]string           `json:"excluded"`
}

func (r CatalogTourRequest) toInput() service.CatalogTourInput {
	return service.CatalogTourInput{
		Slug: r.Slug, Category: r.Category, Price: r.Price, Rating: r.Rating,
		Duration: r.Duration, GroupSize: r.GroupSize, ImageURL: r.ImageURL,
		Published: r.Published, SortOrder: r.SortOrder,
		Title: r.Title, Region: r.Region, Overview: r.Overview,
		Highlights: r.Highlights, Itinerary: r.Itinerary,
		Included: r.Included, Excluded: r.Excluded,
	}
}

// CatalogTourHandler handles catalog-tour endpoints (public read + admin write).
type CatalogTourHandler struct {
	svc service.CatalogTourService
}

// NewCatalogTourHandler builds a CatalogTourHandler.
func NewCatalogTourHandler(svc service.CatalogTourService) *CatalogTourHandler {
	return &CatalogTourHandler{svc: svc}
}

// ListPublic handles GET /public/catalog-tours → published only → { "data": [...] }.
func (h *CatalogTourHandler) ListPublic(c *fiber.Ctx) error {
	tours, err := h.svc.List(repository.CatalogTourFilter{
		PublishedOnly: true,
		Category:      c.Query("category"),
	})
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": tours})
}

// GetPublicBySlug handles GET /public/catalog-tours/:slug.
func (h *CatalogTourHandler) GetPublicBySlug(c *fiber.Ctx) error {
	tour, err := h.svc.GetBySlug(c.Params("slug"))
	if err != nil {
		return err
	}
	if !tour.Published {
		return apperror.CatalogTourNotFound()
	}
	return c.Status(fiber.StatusOK).JSON(tour)
}

// List handles GET /catalog-tours (admin) → all → { "data": [...] }.
func (h *CatalogTourHandler) List(c *fiber.Ctx) error {
	tours, err := h.svc.List(repository.CatalogTourFilter{Category: c.Query("category")})
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": tours})
}

// Get handles GET /catalog-tours/:id (admin).
func (h *CatalogTourHandler) Get(c *fiber.Ctx) error {
	tour, err := h.svc.Get(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(tour)
}

// Create handles POST /catalog-tours (admin) → 201.
func (h *CatalogTourHandler) Create(c *fiber.Ctx) error {
	var req CatalogTourRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	tour, err := h.svc.Create(req.toInput())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(tour)
}

// Update handles PATCH /catalog-tours/:id (admin).
func (h *CatalogTourHandler) Update(c *fiber.Ctx) error {
	var req CatalogTourRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	tour, err := h.svc.Update(c.Params("id"), req.toInput())
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(tour)
}

// Delete handles DELETE /catalog-tours/:id (admin) → { "success": true }.
func (h *CatalogTourHandler) Delete(c *fiber.Ctx) error {
	if err := h.svc.Delete(c.Params("id")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
