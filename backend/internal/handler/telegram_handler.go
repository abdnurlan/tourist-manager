package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/telegram"
)

// TelegramHandler handles the Telegram webhook endpoint.
type TelegramHandler struct {
	bot telegram.BotService
}

// NewTelegramHandler builds a TelegramHandler.
func NewTelegramHandler(bot telegram.BotService) *TelegramHandler {
	return &TelegramHandler{bot: bot}
}

// Webhook handles POST /telegram/webhook (public route, internally guarded).
// Always replies 200 { "ok": true } quickly to avoid Telegram retries.
func (h *TelegramHandler) Webhook(c *fiber.Ctx) error {
	// Bot may be nil if initialization failed (main.go continues without a bot).
	if h.bot == nil {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
	}
	update, err := telegram.ParseUpdate(c.Body())
	if err == nil {
		// Dispatch async-safe; allowed-user enforcement happens inside HandleUpdate.
		h.bot.HandleUpdate(update)
	}
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"ok": true})
}
