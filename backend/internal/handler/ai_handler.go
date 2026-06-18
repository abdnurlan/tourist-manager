package handler

import (
	"strings"

	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// aiHistoryLimit caps the AI history list (CONTRACT.md §6.7).
const aiHistoryLimit = 50

// ChatRequest is the POST /ai/chat body.
type ChatRequest struct {
	Message string `json:"message" validate:"required"`
}

// AIHandler handles AI endpoints.
type AIHandler struct {
	ai service.AIService
}

// NewAIHandler builds an AIHandler.
func NewAIHandler(ai service.AIService) *AIHandler {
	return &AIHandler{ai: ai}
}

// Chat handles POST /ai/chat → { reply, intent, source }.
func (h *AIHandler) Chat(c *fiber.Ctx) error {
	var req ChatRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	if strings.TrimSpace(req.Message) == "" {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	result, err := h.ai.Chat(req.Message)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(result)
}

// History handles GET /ai/history → { "data": [...] } (newest first, raw_json omitted).
func (h *AIHandler) History(c *fiber.Ctx) error {
	msgs, err := h.ai.History(aiHistoryLimit)
	if err != nil {
		return middleware.JSONError(c, apperror.Internal())
	}
	// raw_json is already omitempty + not populated for this view.
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"data": msgs})
}
