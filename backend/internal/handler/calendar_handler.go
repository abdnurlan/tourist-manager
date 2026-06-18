package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/service"
)

// CalendarHandler handles the calendar endpoint.
type CalendarHandler struct {
	calendar service.CalendarService
}

// NewCalendarHandler builds a CalendarHandler.
func NewCalendarHandler(calendar service.CalendarService) *CalendarHandler {
	return &CalendarHandler{calendar: calendar}
}

// Events handles GET /calendar/events?from=&to=&type= → { "data": [...] }.
func (h *CalendarHandler) Events(c *fiber.Ctx) error {
	events, err := h.calendar.Events(c.Query("from"), c.Query("to"), c.Query("type"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": events})
}
