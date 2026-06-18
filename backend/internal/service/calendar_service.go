package service

import (
	"time"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// CalendarEvent is an Event enriched with its parent tour title for display.
type CalendarEvent struct {
	models.Event
	TourTitle string `json:"tour_title"`
}

// CalendarService returns events within a date range for the calendar view.
type CalendarService interface {
	// Events returns events between from/to (inclusive, YYYY-MM-DD) optionally filtered by type.
	Events(from, to, eventType string) ([]CalendarEvent, error)
}

type calendarService struct {
	events repository.EventRepository
	tours  repository.TourRepository
}

// NewCalendarService builds a CalendarService.
func NewCalendarService(events repository.EventRepository, tours repository.TourRepository) CalendarService {
	return &calendarService{events: events, tours: tours}
}

func (s *calendarService) Events(from, to, eventType string) ([]CalendarEvent, error) {
	var fields []apperror.FieldError

	// Default to the current month when both bounds are omitted.
	if from == "" && to == "" {
		now := time.Now()
		first := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
		last := first.AddDate(0, 1, -1)
		from = first.Format("2006-01-02")
		to = last.Format("2006-01-02")
	}
	if from != "" && !isValidDate(from) {
		fields = append(fields, apperror.FieldError{Field: "from", Message: "Tarix formatı yanlışdır."})
	}
	if to != "" && !isValidDate(to) {
		fields = append(fields, apperror.FieldError{Field: "to", Message: "Tarix formatı yanlışdır."})
	}
	if eventType != "" && !validEventTypes[eventType] {
		fields = append(fields, apperror.FieldError{Field: "type", Message: "Növ dəyəri yanlışdır."})
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	events, err := s.events.List(repository.EventFilter{From: from, To: to, Type: eventType})
	if err != nil {
		return nil, apperror.Internal()
	}
	return enrichWithTourTitles(s.tours, events)
}

// enrichWithTourTitles maps events to CalendarEvents, attaching each parent
// tour's title via a single tour list lookup (avoids per-event N+1 queries).
func enrichWithTourTitles(tours repository.TourRepository, events []models.Event) ([]CalendarEvent, error) {
	titles := map[string]string{}
	if len(events) > 0 {
		all, err := tours.List(repository.TourFilter{})
		if err != nil {
			return nil, apperror.Internal()
		}
		for _, t := range all {
			titles[t.ID] = t.Title
		}
	}
	out := make([]CalendarEvent, 0, len(events))
	for _, e := range events {
		out = append(out, CalendarEvent{Event: e, TourTitle: titles[e.TourID]})
	}
	return out, nil
}
