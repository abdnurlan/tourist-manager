package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// SearchHandler handles the search endpoint.
type SearchHandler struct {
	search service.SearchService
}

// NewSearchHandler builds a SearchHandler.
func NewSearchHandler(search service.SearchService) *SearchHandler {
	return &SearchHandler{search: search}
}

// Search handles GET /search?q= → { "data": { tours, events }, "query": q }.
func (h *SearchHandler) Search(c *fiber.Ctx) error {
	q := strings.TrimSpace(c.Query("q"))
	if q == "" {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	results, err := h.search.Search(q)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": results, "query": q})
}
