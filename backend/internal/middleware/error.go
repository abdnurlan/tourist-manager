package middleware

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/pkg/apperror"
)

// errorBody is the wire shape: { "error": { "code": ..., "message": ..., "fields": [...] } }.
type errorBody struct {
	Error errorPayload `json:"error"`
}

type errorPayload struct {
	Code    string                `json:"code"`
	Message string                `json:"message"`
	Fields  []apperror.FieldError `json:"fields,omitempty"`
}

// JSONError writes the Azerbaijani error envelope for the given AppError.
func JSONError(c *fiber.Ctx, e *apperror.AppError) error {
	return c.Status(e.Status).JSON(errorBody{
		Error: errorPayload{
			Code:    e.Code,
			Message: e.Message,
			Fields:  e.Fields,
		},
	})
}

// ErrorHandler is the central Fiber error handler. It maps *apperror.AppError to the
// Azerbaijani envelope and falls back to INTERNAL_ERROR for everything else.
func ErrorHandler(c *fiber.Ctx, err error) error {
	if appErr, ok := err.(*apperror.AppError); ok {
		return JSONError(c, appErr)
	}
	if fe, ok := err.(*fiber.Error); ok {
		// Map Fiber's built-in errors (e.g. 404 routing) onto our shape.
		switch fe.Code {
		case fiber.StatusNotFound:
			return JSONError(c, apperror.NotFound())
		case fiber.StatusUnauthorized:
			return JSONError(c, apperror.Unauthorized())
		case fiber.StatusBadRequest:
			return JSONError(c, apperror.BadRequest())
		}
	}
	return JSONError(c, apperror.Internal())
}
