package repository

import (
	"errors"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"tourist-manager/backend/internal/models"
)

// ErrDepartureFull is returned by IncrementBooked when there is not enough room.
var ErrDepartureFull = errors.New("departure full")

// DepartureRepository defines persistence for tour departures.
type DepartureRepository interface {
	ListByTour(catalogTourID string) ([]models.TourDeparture, error)
	FindByID(id string) (*models.TourDeparture, error)
	Create(d *models.TourDeparture) error
	Update(d *models.TourDeparture) error
	Delete(id string) error
	// IncrementBooked adds people to booked inside a transaction, failing with
	// ErrDepartureFull if it would exceed capacity. Returns the updated departure.
	IncrementBooked(id string, people int) (*models.TourDeparture, error)
}

type departureRepository struct {
	db *gorm.DB
}

// NewDepartureRepository builds a GORM-backed DepartureRepository.
func NewDepartureRepository(db *gorm.DB) DepartureRepository {
	return &departureRepository{db: db}
}

func (r *departureRepository) ListByTour(catalogTourID string) ([]models.TourDeparture, error) {
	var out []models.TourDeparture
	err := r.db.Where("catalog_tour_id = ?", catalogTourID).
		Order("sort_order ASC, start_date ASC").Find(&out).Error
	return out, err
}

func (r *departureRepository) FindByID(id string) (*models.TourDeparture, error) {
	var d models.TourDeparture
	err := r.db.Where("id = ?", id).First(&d).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &d, nil
}

func (r *departureRepository) Create(d *models.TourDeparture) error {
	return r.db.Create(d).Error
}

func (r *departureRepository) Update(d *models.TourDeparture) error {
	return r.db.Save(d).Error
}

func (r *departureRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.TourDeparture{}).Error
}

func (r *departureRepository) IncrementBooked(id string, people int) (*models.TourDeparture, error) {
	var out models.TourDeparture
	err := r.db.Transaction(func(tx *gorm.DB) error {
		var d models.TourDeparture
		// Lock the row for the duration of the transaction to prevent overbooking races.
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(&d).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrNotFound
			}
			return err
		}
		if d.Booked+people > d.Capacity {
			return ErrDepartureFull
		}
		d.Booked += people
		if d.Booked >= d.Capacity {
			d.Status = "full"
		}
		if err := tx.Save(&d).Error; err != nil {
			return err
		}
		out = d
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &out, nil
}
