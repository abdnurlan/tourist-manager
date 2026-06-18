package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// ErrNotFound is returned by repositories when a record does not exist.
var ErrNotFound = errors.New("record not found")

// UserRepository defines persistence operations for users.
type UserRepository interface {
	FindByUsername(username string) (*models.User, error)
	FindByID(id string) (*models.User, error)
	Create(user *models.User) error
	Count() (int64, error)
}

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository builds a GORM-backed UserRepository.
func NewUserRepository(db *gorm.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) FindByUsername(username string) (*models.User, error) {
	var u models.User
	err := r.db.Where("username = ?", username).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) FindByID(id string) (*models.User, error) {
	var u models.User
	err := r.db.Where("id = ?", id).First(&u).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *userRepository) Create(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *userRepository) Count() (int64, error) {
	var n int64
	err := r.db.Model(&models.User{}).Count(&n).Error
	return n, err
}
