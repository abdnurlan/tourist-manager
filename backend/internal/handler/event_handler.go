package handler

import (
	"time"

	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// CreateEventRequest is the POST /tours/:id/events body
// (only title, type, date required; everything else optional/nullable).
type CreateEventRequest struct {
	Title         string     `json:"title"          validate:"required"`
	Type          string     `json:"type"           validate:"required"`
	Date          string     `json:"date"           validate:"required"`
	Time          *string    `json:"time"`
	Location      *string    `json:"location"`
	Participants  *string    `json:"participants"`
	Phone         *string    `json:"phone"`
	Price         *float64   `json:"price"`
	Currency      *string    `json:"currency"`
	PaymentStatus *string    `json:"payment_status"`
	ReminderTime  *time.Time `json:"reminder_time"`
	Attachment    *string    `json:"attachment"`
	Notes         *string    `json:"notes"`
	Status        *string    `json:"status"`
}

// UpdateEventRequest is the PATCH /events/:id body (all optional).
type UpdateEventRequest struct {
	Title         *string    `json:"title"`
	Type          *string    `json:"type"`
	Date          *string    `json:"date"`
	Time          *string    `json:"time"`
	Location      *string    `json:"location"`
	Participants  *string    `json:"participants"`
	Phone         *string    `json:"phone"`
	Price         *float64   `json:"price"`
	Currency      *string    `json:"currency"`
	PaymentStatus *string    `json:"payment_status"`
	ReminderTime  *time.Time `json:"reminder_time"`
	Attachment    *string    `json:"attachment"`
	Notes         *string    `json:"notes"`
	Status        *string    `json:"status"`
}

// EventHandler handles event endpoints.
type EventHandler struct {
	events service.EventService
}

// NewEventHandler builds an EventHandler.
func NewEventHandler(events service.EventService) *EventHandler {
	return &EventHandler{events: events}
}

// ListByTour handles GET /tours/:id/events → { "data": [...] }.
func (h *EventHandler) ListByTour(c *fiber.Ctx) error {
	events, err := h.events.ListByTour(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": events})
}

// Create handles POST /tours/:id/events → 201 created Event (bare). source=manual.
func (h *EventHandler) Create(c *fiber.Ctx) error {
	var req CreateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	source := "manual"
	in := service.EventInput{
		Title:         &req.Title,
		Type:          &req.Type,
		Date:          &req.Date,
		Time:          req.Time,
		Location:      req.Location,
		Participants:  req.Participants,
		Phone:         req.Phone,
		Price:         req.Price,
		Currency:      req.Currency,
		PaymentStatus: req.PaymentStatus,
		ReminderTime:  req.ReminderTime,
		Attachment:    req.Attachment,
		Notes:         req.Notes,
		Status:        req.Status,
		Source:        &source,
	}
	event, err := h.events.Create(c.Params("id"), in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(event)
}

// Get handles GET /events/:id → Event (bare).
func (h *EventHandler) Get(c *fiber.Ctx) error {
	event, err := h.events.Get(c.Params("id"))
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(event)
}

// Update handles PATCH /events/:id → updated Event (bare).
func (h *EventHandler) Update(c *fiber.Ctx) error {
	var req UpdateEventRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	in := service.EventInput{
		Title:         req.Title,
		Type:          req.Type,
		Date:          req.Date,
		Time:          req.Time,
		Location:      req.Location,
		Participants:  req.Participants,
		Phone:         req.Phone,
		Price:         req.Price,
		Currency:      req.Currency,
		PaymentStatus: req.PaymentStatus,
		ReminderTime:  req.ReminderTime,
		Attachment:    req.Attachment,
		Notes:         req.Notes,
		Status:        req.Status,
	}
	event, err := h.events.Update(c.Params("id"), in)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(event)
}

// Delete handles DELETE /events/:id → { "success": true }.
func (h *EventHandler) Delete(c *fiber.Ctx) error {
	if err := h.events.Delete(c.Params("id")); err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
