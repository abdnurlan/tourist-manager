package service

import (
	"net/http"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// guestNotFound is the typed 404 for a missing guest.
func guestNotFound() *apperror.AppError {
	return apperror.New(http.StatusNotFound, "GUEST_NOT_FOUND", "Qonaq tapılmadı")
}

// GuestInput carries create/update fields (nil = unchanged on update).
type GuestInput struct {
	FullName    *string
	Phone       *string
	Passport    *string
	Nationality *string
	Notes       *string
}

// GuestService implements guest business logic.
type GuestService interface {
	ListByTour(tourID string) ([]models.Guest, error)
	Create(tourID string, in GuestInput) (*models.Guest, error)
	Update(id string, in GuestInput) (*models.Guest, error)
	Delete(id string) error
}

type guestService struct {
	guests repository.GuestRepository
	tours  repository.TourRepository
}

// NewGuestService builds a GuestService.
func NewGuestService(guests repository.GuestRepository, tours repository.TourRepository) GuestService {
	return &guestService{guests: guests, tours: tours}
}

func (s *guestService) ListByTour(tourID string) ([]models.Guest, error) {
	guests, err := s.guests.ListByTour(tourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	return guests, nil
}

func (s *guestService) Create(tourID string, in GuestInput) (*models.Guest, error) {
	if _, err := s.tours.FindByID(tourID); err != nil {
		return nil, apperror.TourNotFound()
	}
	name := trimPtr(in.FullName)
	if name == "" {
		return nil, validationError([]apperror.FieldError{
			{Field: "full_name", Message: "Ad tələb olunur"},
		})
	}
	guest := &models.Guest{
		TourID:      tourID,
		FullName:    name,
		Phone:       cleanPtr(in.Phone),
		Passport:    cleanPtr(in.Passport),
		Nationality: cleanPtr(in.Nationality),
		Notes:       cleanPtr(in.Notes),
	}
	if err := s.guests.Create(guest); err != nil {
		return nil, apperror.Internal()
	}
	return guest, nil
}

func (s *guestService) Update(id string, in GuestInput) (*models.Guest, error) {
	guest, err := s.guests.FindByID(id)
	if err != nil {
		return nil, guestNotFound()
	}
	if in.FullName != nil {
		name := trimPtr(in.FullName)
		if name == "" {
			return nil, validationError([]apperror.FieldError{
				{Field: "full_name", Message: "Ad tələb olunur"},
			})
		}
		guest.FullName = name
	}
	if in.Phone != nil {
		guest.Phone = cleanPtr(in.Phone)
	}
	if in.Passport != nil {
		guest.Passport = cleanPtr(in.Passport)
	}
	if in.Nationality != nil {
		guest.Nationality = cleanPtr(in.Nationality)
	}
	if in.Notes != nil {
		guest.Notes = cleanPtr(in.Notes)
	}
	if err := s.guests.Update(guest); err != nil {
		return nil, apperror.Internal()
	}
	return guest, nil
}

func (s *guestService) Delete(id string) error {
	if _, err := s.guests.FindByID(id); err != nil {
		return guestNotFound()
	}
	if err := s.guests.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}

// cleanPtr trims a *string; returns nil if the trimmed result is empty.
func cleanPtr(p *string) *string {
	v := trimPtr(p)
	if v == "" {
		return nil
	}
	return &v
}
