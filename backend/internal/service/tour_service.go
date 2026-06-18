package service

import (
	"strings"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// TourInput carries create/update fields for a tour (nil = leave unchanged on update).
type TourInput struct {
	Title       *string
	StartDate   *string
	EndDate     *string
	Description *string
	Status      *string
}

// TourService implements tour business logic.
type TourService interface {
	List(filter repository.TourFilter) ([]models.Tour, error)
	Get(id string) (*models.Tour, error)
	Create(in TourInput) (*models.Tour, error)
	Update(id string, in TourInput) (*models.Tour, error)
	Delete(id string) error
}

type tourService struct {
	tours  repository.TourRepository
	events repository.EventRepository
}

// NewTourService builds a TourService.
func NewTourService(tours repository.TourRepository, events repository.EventRepository) TourService {
	return &tourService{tours: tours, events: events}
}

func (s *tourService) List(filter repository.TourFilter) ([]models.Tour, error) {
	if filter.Status != "" && !validTourStatuses[filter.Status] {
		return nil, validationError([]apperror.FieldError{
			{Field: "status", Message: "Status dəyəri yanlışdır."},
		})
	}
	tours, err := s.tours.List(filter)
	if err != nil {
		return nil, apperror.Internal()
	}
	for i := range tours {
		s.enrichEventsCount(&tours[i])
	}
	return tours, nil
}

func (s *tourService) Get(id string) (*models.Tour, error) {
	t, err := s.tours.FindByID(id)
	if err != nil {
		return nil, apperror.TourNotFound()
	}
	s.enrichEventsCount(t)
	return t, nil
}

func (s *tourService) Create(in TourInput) (*models.Tour, error) {
	title := trimPtr(in.Title)
	start := trimPtr(in.StartDate)
	end := trimPtr(in.EndDate)

	var fields []apperror.FieldError
	if title == "" {
		fields = append(fields, apperror.FieldError{Field: "title", Message: "Başlıq tələb olunur."})
	}
	if start == "" {
		fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Başlama tarixi tələb olunur."})
	} else if !isValidDate(start) {
		fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Tarix formatı yanlışdır."})
	}
	if end == "" {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi tələb olunur."})
	} else if !isValidDate(end) {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Tarix formatı yanlışdır."})
	}
	if start != "" && end != "" && isValidDate(start) && isValidDate(end) && end < start {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi başlama tarixindən sonra olmalıdır."})
	}

	status := trimPtr(in.Status)
	if status == "" {
		status = "planned"
	} else if !validTourStatuses[status] {
		fields = append(fields, apperror.FieldError{Field: "status", Message: "Status dəyəri yanlışdır."})
	}

	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	tour := &models.Tour{
		Title:       title,
		StartDate:   start,
		EndDate:     end,
		Description: in.Description,
		Status:      status,
	}
	if err := s.tours.Create(tour); err != nil {
		return nil, apperror.Internal()
	}
	tour.EventsCount = 0
	return tour, nil
}

func (s *tourService) Update(id string, in TourInput) (*models.Tour, error) {
	tour, err := s.tours.FindByID(id)
	if err != nil {
		return nil, apperror.TourNotFound()
	}

	var fields []apperror.FieldError

	if in.Title != nil {
		title := strings.TrimSpace(*in.Title)
		if title == "" {
			fields = append(fields, apperror.FieldError{Field: "title", Message: "Başlıq tələb olunur."})
		} else {
			tour.Title = title
		}
	}
	if in.StartDate != nil {
		start := strings.TrimSpace(*in.StartDate)
		if !isValidDate(start) {
			fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Tarix formatı yanlışdır."})
		} else {
			tour.StartDate = start
		}
	}
	if in.EndDate != nil {
		end := strings.TrimSpace(*in.EndDate)
		if !isValidDate(end) {
			fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Tarix formatı yanlışdır."})
		} else {
			tour.EndDate = end
		}
	}
	if tour.StartDate != "" && tour.EndDate != "" && tour.EndDate < tour.StartDate {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi başlama tarixindən sonra olmalıdır."})
	}
	if in.Description != nil {
		tour.Description = in.Description
	}
	if in.Status != nil {
		status := strings.TrimSpace(*in.Status)
		if !validTourStatuses[status] {
			fields = append(fields, apperror.FieldError{Field: "status", Message: "Status dəyəri yanlışdır."})
		} else {
			tour.Status = status
		}
	}

	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	if err := s.tours.Update(tour); err != nil {
		return nil, apperror.Internal()
	}
	s.enrichEventsCount(tour)
	return tour, nil
}

func (s *tourService) Delete(id string) error {
	if _, err := s.tours.FindByID(id); err != nil {
		return apperror.TourNotFound()
	}
	if err := s.tours.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}

// enrichEventsCount populates the computed EventsCount field (0 on error).
func (s *tourService) enrichEventsCount(t *models.Tour) {
	n, err := s.tours.EventsCount(t.ID)
	if err != nil {
		t.EventsCount = 0
		return
	}
	t.EventsCount = n
}
