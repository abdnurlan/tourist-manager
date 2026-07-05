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
	SetGuests(eventID string, guestIDs []string) error
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
	err := r.db.Preload("Guests").Where("tour_id = ?", tourID).Order("date ASC, time ASC").Find(&events).Error
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
	err := r.db.Preload("Guests").Where("id = ?", id).First(&e).Error
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

// SetGuests replaces an event's guest associations with exactly the given IDs.
// Operates on the event_guests join table directly (does NOT upsert guest rows),
// so passing bare {ID} structs can't accidentally create empty guests.
func (r *eventRepository) SetGuests(eventID string, guestIDs []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Clear existing links for this event.
		if err := tx.Exec("DELETE FROM event_guests WHERE event_id = ?", eventID).Error; err != nil {
			return err
		}
		// Insert only links whose guest actually belongs to the same tour
		// (silently drops unknown/foreign guest IDs).
		for _, gid := range guestIDs {
			if gid == "" {
				continue
			}
			if err := tx.Exec(
				`INSERT INTO event_guests (event_id, guest_id)
				 SELECT ?, g.id FROM guests g
				 JOIN events e ON e.id = ?
				 WHERE g.id = ? AND g.tour_id = e.tour_id
				 ON CONFLICT DO NOTHING`,
				eventID, eventID, gid,
			).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
