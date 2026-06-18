package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// TourFilter holds optional list filters for tours.
type TourFilter struct {
	Status string // optional tour_status
	Query  string // optional case-insensitive title/description match
}

// TourRepository defines persistence operations for tours.
type TourRepository interface {
	List(filter TourFilter) ([]models.Tour, error)
	FindByID(id string) (*models.Tour, error)
	Create(tour *models.Tour) error
	Update(tour *models.Tour) error
	Delete(id string) error
	CountByStatus(status string) (int64, error)
	EventsCount(tourID string) (int64, error)
}

type tourRepository struct {
	db *gorm.DB
}

// NewTourRepository builds a GORM-backed TourRepository.
func NewTourRepository(db *gorm.DB) TourRepository {
	return &tourRepository{db: db}
}

func (r *tourRepository) List(filter TourFilter) ([]models.Tour, error) {
	// Stub: minimal happy-path implementation; refine in service phase.
	var tours []models.Tour
	q := r.db.Model(&models.Tour{})
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}
	if filter.Query != "" {
		like := "%" + filter.Query + "%"
		q = q.Where("title ILIKE ? OR description ILIKE ?", like, like)
	}
	err := q.Order("start_date DESC").Find(&tours).Error
	return tours, err
}

func (r *tourRepository) FindByID(id string) (*models.Tour, error) {
	var t models.Tour
	err := r.db.Where("id = ?", id).First(&t).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *tourRepository) Create(tour *models.Tour) error {
	return r.db.Create(tour).Error
}

func (r *tourRepository) Update(tour *models.Tour) error {
	return r.db.Save(tour).Error
}

func (r *tourRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Tour{}).Error
}

func (r *tourRepository) CountByStatus(status string) (int64, error) {
	var n int64
	err := r.db.Model(&models.Tour{}).Where("status = ?", status).Count(&n).Error
	return n, err
}

func (r *tourRepository) EventsCount(tourID string) (int64, error) {
	var n int64
	err := r.db.Model(&models.Event{}).Where("tour_id = ?", tourID).Count(&n).Error
	return n, err
}
