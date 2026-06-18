package middleware

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

// RequestLogger is a thin wrapper over Fiber's built-in structured logger so the
// router can mount a single, consistently-formatted access log.
func RequestLogger() fiber.Handler {
	return logger.New(logger.Config{
		Format: "${time} ${status} ${method} ${path} ${latency}\n",
	})
}
