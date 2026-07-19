package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// CatalogTourFilter narrows a catalog listing.
type CatalogTourFilter struct {
	PublishedOnly bool
	Category      string // empty = all
}

// CatalogTourRepository defines persistence operations for catalog tours.
type CatalogTourRepository interface {
	List(f CatalogTourFilter) ([]models.CatalogTour, error)
	FindByID(id string) (*models.CatalogTour, error)
	FindBySlug(slug string) (*models.CatalogTour, error)
	Create(t *models.CatalogTour) error
	Update(t *models.CatalogTour) error
	Delete(id string) error
	SlugExists(slug, excludeID string) (bool, error)
}

type catalogTourRepository struct {
	db *gorm.DB
}

// NewCatalogTourRepository builds a GORM-backed CatalogTourRepository.
func NewCatalogTourRepository(db *gorm.DB) CatalogTourRepository {
	return &catalogTourRepository{db: db}
}

func (r *catalogTourRepository) List(f CatalogTourFilter) ([]models.CatalogTour, error) {
	q := r.db.Model(&models.CatalogTour{})
	if f.PublishedOnly {
		q = q.Where("published = ?", true)
	}
	if f.Category != "" {
		q = q.Where("category = ?", f.Category)
	}
	var tours []models.CatalogTour
	err := q.Order("sort_order ASC, created_at ASC").Find(&tours).Error
	return tours, err
}

func (r *catalogTourRepository) FindByID(id string) (*models.CatalogTour, error) {
	var t models.CatalogTour
	err := r.db.Where("id = ?", id).First(&t).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *catalogTourRepository) FindBySlug(slug string) (*models.CatalogTour, error) {
	var t models.CatalogTour
	err := r.db.Where("slug = ?", slug).First(&t).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (r *catalogTourRepository) Create(t *models.CatalogTour) error {
	return r.db.Create(t).Error
}

func (r *catalogTourRepository) Update(t *models.CatalogTour) error {
	return r.db.Save(t).Error
}

func (r *catalogTourRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.CatalogTour{}).Error
}

func (r *catalogTourRepository) SlugExists(slug, excludeID string) (bool, error) {
	q := r.db.Model(&models.CatalogTour{}).Where("slug = ?", slug)
	if excludeID != "" {
		q = q.Where("id <> ?", excludeID)
	}
	var count int64
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
