package service

import (
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"tourist-manager/backend/internal/middleware"
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// AuthService handles login and user hydration.
type AuthService interface {
	// Login verifies credentials and returns the user plus a signed JWT.
	Login(username, password string) (*models.User, string, error)
	// Me loads a user by id (for /auth/me).
	Me(userID string) (*models.User, error)
}

type authService struct {
	users     repository.UserRepository
	jwtSecret string
}

// NewAuthService builds an AuthService.
func NewAuthService(users repository.UserRepository, jwtSecret string) AuthService {
	return &authService{users: users, jwtSecret: jwtSecret}
}

func (s *authService) Login(username, password string) (*models.User, string, error) {
	user, err := s.users.FindByUsername(username)
	if err != nil {
		return nil, "", apperror.InvalidCredentials()
	}
	if bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)) != nil {
		return nil, "", apperror.InvalidCredentials()
	}

	now := time.Now()
	claims := middleware.AuthClaims{
		UserID:   user.ID,
		Username: user.Username,
		Role:     user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(7 * 24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.jwtSecret))
	if err != nil {
		return nil, "", apperror.Internal()
	}
	return user, signed, nil
}

func (s *authService) Me(userID string) (*models.User, error) {
	user, err := s.users.FindByID(userID)
	if err != nil {
		return nil, apperror.Unauthorized()
	}
	return user, nil
}
