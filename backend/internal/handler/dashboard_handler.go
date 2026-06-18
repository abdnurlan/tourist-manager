package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/service"
)

// DashboardHandler handles the dashboard endpoint.
type DashboardHandler struct {
	dashboard service.DashboardService
}

// NewDashboardHandler builds a DashboardHandler.
func NewDashboardHandler(dashboard service.DashboardService) *DashboardHandler {
	return &DashboardHandler{dashboard: dashboard}
}

// Get handles GET /dashboard → composite payload.
func (h *DashboardHandler) Get(c *fiber.Ctx) error {
	data, err := h.dashboard.Get()
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(data)
}
