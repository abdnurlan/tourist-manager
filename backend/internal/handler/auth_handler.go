package handler

import (
	"github.com/gofiber/fiber/v2"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/pkg/apperror"
)

// LoginRequest is the POST /auth/login body.
type LoginRequest struct {
	Username string `json:"username" validate:"required"`
	Password string `json:"password" validate:"required"`
}

// LoginResponse is the login action response.
type LoginResponse struct {
	Token string       `json:"token"`
	User  *models.User `json:"user"`
}

// AuthHandler handles auth endpoints.
type AuthHandler struct {
	auth service.AuthService
}

// NewAuthHandler builds an AuthHandler.
func NewAuthHandler(auth service.AuthService) *AuthHandler {
	return &AuthHandler{auth: auth}
}

// Login handles POST /auth/login (public).
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	if req.Username == "" || req.Password == "" {
		return middleware.JSONError(c, apperror.ValidationError())
	}
	user, token, err := h.auth.Login(req.Username, req.Password)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(LoginResponse{Token: token, User: user})
}

// Me handles GET /auth/me (protected). Returns the user bare.
func (h *AuthHandler) Me(c *fiber.Ctx) error {
	claims, ok := middleware.CurrentUser(c)
	if !ok {
		return middleware.JSONError(c, apperror.Unauthorized())
	}
	user, err := h.auth.Me(claims.UserID)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusOK).JSON(user)
}

// Logout handles POST /auth/logout (protected). Stateless: client discards token.
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"success": true})
}
