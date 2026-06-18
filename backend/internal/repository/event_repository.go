package repository

import (
	"errors"

	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// EventFilter holds optional list/range filters for events.
type EventFilter struct {
	TourID string
	From   string // YYYY-MM-DD inclusive
	To     string // YYYY-MM-DD inclusive
	Type   string // optional event_type
	Date   string // exact date (e.g. today/tomorrow queries)
}

// EventRepository defines persistence operations for events.
type EventRepository interface {
	ListByTour(tourID string) ([]models.Event, error)
	List(filter EventFilter) ([]models.Event, error)
	FindByID(id string) (*models.Event, error)
	Create(event *models.Event) error
	Update(event *models.Event) error
	Delete(id string) error
	Search(query string) ([]models.Event, error)
	CountByDateStatus(date, status string) (int64, error)
}

type eventRepository struct {
	db *gorm.DB
}

// NewEventRepository builds a GORM-backed EventRepository.
func NewEventRepository(db *gorm.DB) EventRepository {
	return &eventRepository{db: db}
}

func (r *eventRepository) ListByTour(tourID string) ([]models.Event, error) {
	var events []models.Event
	err := r.db.Where("tour_id = ?", tourID).Order("date ASC, time ASC").Find(&events).Error
	return events, err
}

func (r *eventRepository) List(filter EventFilter) ([]models.Event, error) {
	var events []models.Event
	q := r.db.Model(&models.Event{})
	if filter.TourID != "" {
		q = q.Where("tour_id = ?", filter.TourID)
	}
	if filter.Type != "" {
		q = q.Where("type = ?", filter.Type)
	}
	if filter.Date != "" {
		q = q.Where("date = ?", filter.Date)
	}
	if filter.From != "" {
		q = q.Where("date >= ?", filter.From)
	}
	if filter.To != "" {
		q = q.Where("date <= ?", filter.To)
	}
	err := q.Order("date ASC, time ASC").Find(&events).Error
	return events, err
}

func (r *eventRepository) FindByID(id string) (*models.Event, error) {
	var e models.Event
	err := r.db.Where("id = ?", id).First(&e).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *eventRepository) Create(event *models.Event) error {
	return r.db.Create(event).Error
}

func (r *eventRepository) Update(event *models.Event) error {
	return r.db.Save(event).Error
}

func (r *eventRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Event{}).Error
}

func (r *eventRepository) Search(query string) ([]models.Event, error) {
	var events []models.Event
	like := "%" + query + "%"
	err := r.db.Where(
		"title ILIKE ? OR location ILIKE ? OR participants ILIKE ? OR phone ILIKE ? OR notes ILIKE ?",
		like, like, like, like, like,
	).Order("date ASC, time ASC").Find(&events).Error
	return events, err
}

func (r *eventRepository) CountByDateStatus(date, status string) (int64, error) {
	var n int64
	err := r.db.Model(&models.Event{}).Where("date = ? AND status = ?", date, status).Count(&n).Error
	return n, err
}
