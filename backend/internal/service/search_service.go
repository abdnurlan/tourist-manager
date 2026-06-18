package service

import (
	"strings"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// SearchResults is the grouped search payload (CONTRACT.md §6.6).
type SearchResults struct {
	Tours  []models.Tour   `json:"tours"`
	Events []CalendarEvent `json:"events"` // events carry tour_title
}

// SearchService implements global search across tours and events.
type SearchService interface {
	Search(query string) (*SearchResults, error)
}

type searchService struct {
	tours  repository.TourRepository
	events repository.EventRepository
}

// NewSearchService builds a SearchService.
func NewSearchService(tours repository.TourRepository, events repository.EventRepository) SearchService {
	return &searchService{tours: tours, events: events}
}

func (s *searchService) Search(query string) (*SearchResults, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return nil, validationError([]apperror.FieldError{
			{Field: "q", Message: "Axtarış sorğusu tələb olunur."},
		})
	}

	tours, err := s.tours.List(repository.TourFilter{Query: query})
	if err != nil {
		return nil, apperror.Internal()
	}
	for i := range tours {
		if n, e := s.tours.EventsCount(tours[i].ID); e == nil {
			tours[i].EventsCount = n
		}
	}

	events, err := s.events.Search(query)
	if err != nil {
		return nil, apperror.Internal()
	}
	enriched, err := enrichWithTourTitles(s.tours, events)
	if err != nil {
		return nil, err
	}

	return &SearchResults{Tours: tours, Events: enriched}, nil
}
