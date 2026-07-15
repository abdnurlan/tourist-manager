package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// BookingFilter narrows a booking listing.
type BookingFilter struct {
	Status string // empty = all
}

// BookingRepository defines persistence operations for bookings.
type BookingRepository interface {
	List(f BookingFilter) ([]models.Booking, error)
	FindByID(id string) (*models.Booking, error)
	Create(b *models.Booking) error
	Update(b *models.Booking) error
	Delete(id string) error
	CountByStatus(status string) (int64, error)
}

type bookingRepository struct {
	db *gorm.DB
}

// NewBookingRepository builds a GORM-backed BookingRepository.
func NewBookingRepository(db *gorm.DB) BookingRepository {
	return &bookingRepository{db: db}
}

func (r *bookingRepository) List(f BookingFilter) ([]models.Booking, error) {
	q := r.db.Model(&models.Booking{})
	if f.Status != "" {
		q = q.Where("status = ?", f.Status)
	}
	var bookings []models.Booking
	err := q.Order("created_at DESC").Find(&bookings).Error
	return bookings, err
}

func (r *bookingRepository) FindByID(id string) (*models.Booking, error) {
	var b models.Booking
	err := r.db.Where("id = ?", id).First(&b).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &b, nil
}

func (r *bookingRepository) Create(b *models.Booking) error {
	return r.db.Create(b).Error
}

func (r *bookingRepository) Update(b *models.Booking) error {
	return r.db.Save(b).Error
}

func (r *bookingRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Booking{}).Error
}

func (r *bookingRepository) CountByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&models.Booking{}).Where("status = ?", status).Count(&count).Error
	return count, err
}
