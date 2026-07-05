package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// GuestRepository defines persistence operations for guests.
type GuestRepository interface {
	ListByTour(tourID string) ([]models.Guest, error)
	FindByID(id string) (*models.Guest, error)
	Create(guest *models.Guest) error
	Update(guest *models.Guest) error
	Delete(id string) error
}

type guestRepository struct {
	db *gorm.DB
}

// NewGuestRepository builds a GORM-backed GuestRepository.
func NewGuestRepository(db *gorm.DB) GuestRepository {
	return &guestRepository{db: db}
}

func (r *guestRepository) ListByTour(tourID string) ([]models.Guest, error) {
	var guests []models.Guest
	err := r.db.Where("tour_id = ?", tourID).Order("full_name ASC").Find(&guests).Error
	return guests, err
}

func (r *guestRepository) FindByID(id string) (*models.Guest, error) {
	var g models.Guest
	err := r.db.Where("id = ?", id).First(&g).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func (r *guestRepository) Create(guest *models.Guest) error {
	return r.db.Create(guest).Error
}

func (r *guestRepository) Update(guest *models.Guest) error {
	return r.db.Save(guest).Error
}

func (r *guestRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Guest{}).Error
}
