package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"

	"tourist-manager/backend/pkg/apperror"
)

// LocalsUserKey is the Fiber Locals key under which the validated JWT claims are stored.
const LocalsUserKey = "user"

// AuthClaims is the JWT payload (HS256) per CONTRACT.md §8.
type AuthClaims struct {
	UserID   string `json:"uid"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// AuthRequired returns a Fiber middleware that validates the Bearer JWT, loads the
// claims into c.Locals("user"), and rejects invalid/expired tokens with the AZ shape.
func AuthRequired(secret string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		raw := extractBearer(c.Get(fiber.HeaderAuthorization))
		if raw == "" {
			return JSONError(c, apperror.Unauthorized())
		}

		claims := &AuthClaims{}
		token, err := jwt.ParseWithClaims(raw, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrTokenSignatureInvalid
			}
			return []byte(secret), nil
		})
		if err != nil {
			if strings.Contains(err.Error(), "expired") {
				return JSONError(c, apperror.TokenExpired())
			}
			return JSONError(c, apperror.Unauthorized())
		}
		if !token.Valid {
			return JSONError(c, apperror.Unauthorized())
		}

		c.Locals(LocalsUserKey, claims)
		return c.Next()
	}
}

// CurrentUser returns the validated claims previously stored by AuthRequired.
func CurrentUser(c *fiber.Ctx) (*AuthClaims, bool) {
	v, ok := c.Locals(LocalsUserKey).(*AuthClaims)
	return v, ok
}

func extractBearer(header string) string {
	if header == "" {
		return ""
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
