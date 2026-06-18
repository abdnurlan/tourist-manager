package service

import (
	"strings"
	"time"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// EventInput carries create/update fields for an event (nil = unchanged on update).
type EventInput struct {
	Title         *string
	Type          *string
	Date          *string
	Time          *string
	Location      *string
	Participants  *string
	Phone         *string
	Price         *float64
	Currency      *string
	PaymentStatus *string
	ReminderTime  *time.Time
	Attachment    *string
	Notes         *string
	Status        *string
	Source        *string // set server-side: manual | telegram | ai
}

// EventService implements event business logic.
type EventService interface {
	ListByTour(tourID string) ([]models.Event, error)
	ListByDate(date string) ([]models.Event, error)
	Get(id string) (*models.Event, error)
	Create(tourID string, in EventInput) (*models.Event, error)
	Update(id string, in EventInput) (*models.Event, error)
	Delete(id string) error
}

type eventService struct {
	events repository.EventRepository
	tours  repository.TourRepository
}

// NewEventService builds an EventService.
func NewEventService(events repository.EventRepository, tours repository.TourRepository) EventService {
	return &eventService{events: events, tours: tours}
}

func (s *eventService) ListByTour(tourID string) ([]models.Event, error) {
	if _, err := s.tours.FindByID(tourID); err != nil {
		return nil, apperror.TourNotFound()
	}
	return s.events.ListByTour(tourID)
}

// ListByDate returns all events on a given YYYY-MM-DD, ordered by date then time.
// Used by the Telegram bot for /today and /tomorrow.
func (s *eventService) ListByDate(date string) ([]models.Event, error) {
	return s.events.List(repository.EventFilter{Date: date})
}

func (s *eventService) Get(id string) (*models.Event, error) {
	e, err := s.events.FindByID(id)
	if err != nil {
		return nil, apperror.EventNotFound()
	}
	return e, nil
}

func (s *eventService) Create(tourID string, in EventInput) (*models.Event, error) {
	if _, err := s.tours.FindByID(tourID); err != nil {
		return nil, apperror.TourNotFound()
	}

	title := trimPtr(in.Title)
	typ := trimPtr(in.Type)
	date := trimPtr(in.Date)

	var fields []apperror.FieldError
	if title == "" {
		fields = append(fields, apperror.FieldError{Field: "title", Message: "Başlıq tələb olunur."})
	}
	if typ == "" {
		fields = append(fields, apperror.FieldError{Field: "type", Message: "Növ tələb olunur."})
	} else if !validEventTypes[typ] {
		fields = append(fields, apperror.FieldError{Field: "type", Message: "Növ dəyəri yanlışdır."})
	}
	if date == "" {
		fields = append(fields, apperror.FieldError{Field: "date", Message: "Tarix tələb olunur."})
	} else if !isValidDate(date) {
		fields = append(fields, apperror.FieldError{Field: "date", Message: "Tarix formatı yanlışdır."})
	}

	// Optional fields validation (when provided and non-empty).
	if t := trimPtr(in.Time); in.Time != nil && t != "" && !isValidTime(t) {
		fields = append(fields, apperror.FieldError{Field: "time", Message: "Saat formatı yanlışdır (SS:DD)."})
	}
	if in.Price != nil && *in.Price < 0 {
		fields = append(fields, apperror.FieldError{Field: "price", Message: "Qiymət düzgün rəqəm olmalıdır."})
	}
	if ps := trimPtr(in.PaymentStatus); in.PaymentStatus != nil && ps != "" && !validPaymentStatuses[ps] {
		fields = append(fields, apperror.FieldError{Field: "payment_status", Message: "Ödəniş statusu yanlışdır."})
	}

	status := trimPtr(in.Status)
	if status == "" {
		status = "planned"
	} else if !validEventStatuses[status] {
		fields = append(fields, apperror.FieldError{Field: "status", Message: "Status dəyəri yanlışdır."})
	}

	source := trimPtr(in.Source)
	if source == "" {
		source = "manual"
	} else if !validEventSources[source] {
		fields = append(fields, apperror.FieldError{Field: "source", Message: "Mənbə dəyəri yanlışdır."})
	}

	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	event := &models.Event{
		TourID:        tourID,
		Title:         title,
		Type:          typ,
		Date:          date,
		Time:          in.Time,
		Location:      in.Location,
		Participants:  in.Participants,
		Phone:         in.Phone,
		Price:         in.Price,
		Currency:      in.Currency,
		PaymentStatus: in.PaymentStatus,
		ReminderTime:  in.ReminderTime,
		Attachment:    in.Attachment,
		Notes:         in.Notes,
		Status:        status,
		Source:        source,
	}
	if err := s.events.Create(event); err != nil {
		return nil, apperror.Internal()
	}
	return event, nil
}

func (s *eventService) Update(id string, in EventInput) (*models.Event, error) {
	event, err := s.events.FindByID(id)
	if err != nil {
		return nil, apperror.EventNotFound()
	}

	var fields []apperror.FieldError

	if in.Title != nil {
		title := strings.TrimSpace(*in.Title)
		if title == "" {
			fields = append(fields, apperror.FieldError{Field: "title", Message: "Başlıq tələb olunur."})
		} else {
			event.Title = title
		}
	}
	if in.Type != nil {
		typ := strings.TrimSpace(*in.Type)
		if !validEventTypes[typ] {
			fields = append(fields, apperror.FieldError{Field: "type", Message: "Növ dəyəri yanlışdır."})
		} else {
			event.Type = typ
		}
	}
	if in.Date != nil {
		date := strings.TrimSpace(*in.Date)
		if !isValidDate(date) {
			fields = append(fields, apperror.FieldError{Field: "date", Message: "Tarix formatı yanlışdır."})
		} else {
			event.Date = date
		}
	}
	if in.Time != nil {
		t := strings.TrimSpace(*in.Time)
		if t == "" {
			event.Time = nil
		} else if !isValidTime(t) {
			fields = append(fields, apperror.FieldError{Field: "time", Message: "Saat formatı yanlışdır (SS:DD)."})
		} else {
			event.Time = &t
		}
	}
	if in.Location != nil {
		event.Location = in.Location
	}
	if in.Participants != nil {
		event.Participants = in.Participants
	}
	if in.Phone != nil {
		event.Phone = in.Phone
	}
	if in.Price != nil {
		if *in.Price < 0 {
			fields = append(fields, apperror.FieldError{Field: "price", Message: "Qiymət düzgün rəqəm olmalıdır."})
		} else {
			event.Price = in.Price
		}
	}
	if in.Currency != nil {
		event.Currency = in.Currency
	}
	if in.PaymentStatus != nil {
		ps := strings.TrimSpace(*in.PaymentStatus)
		if ps == "" {
			event.PaymentStatus = nil
		} else if !validPaymentStatuses[ps] {
			fields = append(fields, apperror.FieldError{Field: "payment_status", Message: "Ödəniş statusu yanlışdır."})
		} else {
			event.PaymentStatus = &ps
		}
	}
	if in.ReminderTime != nil {
		event.ReminderTime = in.ReminderTime
	}
	if in.Attachment != nil {
		event.Attachment = in.Attachment
	}
	if in.Notes != nil {
		event.Notes = in.Notes
	}
	if in.Status != nil {
		status := strings.TrimSpace(*in.Status)
		if !validEventStatuses[status] {
			fields = append(fields, apperror.FieldError{Field: "status", Message: "Status dəyəri yanlışdır."})
		} else {
			event.Status = status
		}
	}
	if in.Source != nil {
		source := strings.TrimSpace(*in.Source)
		if !validEventSources[source] {
			fields = append(fields, apperror.FieldError{Field: "source", Message: "Mənbə dəyəri yanlışdır."})
		} else {
			event.Source = source
		}
	}

	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	if err := s.events.Update(event); err != nil {
		return nil, apperror.Internal()
	}
	return event, nil
}

func (s *eventService) Delete(id string) error {
	if _, err := s.events.FindByID(id); err != nil {
		return apperror.EventNotFound()
	}
	if err := s.events.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}
