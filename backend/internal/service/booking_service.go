package service

import (
	"errors"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// BookingInput carries a public reservation submission. The tour may be
// referenced by catalog id or by slug (the landing site uses slugs); either
// resolves to a snapshot, and both are optional (generic enquiry).
type BookingInput struct {
	CatalogTourID *string
	TourSlug      *string
	TourTitle     *string // fallback snapshot when the tour isn't in the catalog yet
	FullName      *string
	Phone         *string
	Email         *string
	People        *int
	Date          *string
	DepartureID   *string
	Notes         *string
}

// BookingService implements booking business logic.
type BookingService interface {
	List(f repository.BookingFilter) ([]models.Booking, error)
	Create(in BookingInput) (*models.Booking, error)
	UpdateStatus(id, status string) (*models.Booking, error)
	Delete(id string) error
}

type bookingService struct {
	bookings   repository.BookingRepository
	catalog    repository.CatalogTourRepository
	departures repository.DepartureRepository
}

// NewBookingService builds a BookingService.
func NewBookingService(bookings repository.BookingRepository, catalog repository.CatalogTourRepository, departures repository.DepartureRepository) BookingService {
	return &bookingService{bookings: bookings, catalog: catalog, departures: departures}
}

func (s *bookingService) List(f repository.BookingFilter) ([]models.Booking, error) {
	bookings, err := s.bookings.List(f)
	if err != nil {
		return nil, apperror.Internal()
	}
	return bookings, nil
}

func (s *bookingService) Create(in BookingInput) (*models.Booking, error) {
	var fields []apperror.FieldError

	name := trimPtr(in.FullName)
	if name == "" {
		fields = append(fields, apperror.FieldError{Field: "full_name", Message: "Ad tələb olunur"})
	}
	// At least one contact channel.
	phone := cleanPtr(in.Phone)
	email := cleanPtr(in.Email)
	if phone == nil && email == nil {
		fields = append(fields, apperror.FieldError{Field: "contact", Message: "Telefon və ya email tələb olunur"})
	}
	if in.Date != nil && trimPtr(in.Date) != "" && !isValidDate(trimPtr(in.Date)) {
		fields = append(fields, apperror.FieldError{Field: "date", Message: "Tarix düzgün deyil"})
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	people := 1
	if in.People != nil && *in.People > 0 {
		people = *in.People
	}

	// If a departure is specified, reserve seats transactionally and snapshot its
	// start date. Overbooking fails with 409; a missing departure fails with 404.
	var depDate *string
	if depID := trimPtr(in.DepartureID); depID != "" {
		updated, err := s.departures.IncrementBooked(depID, people)
		if err != nil {
			if errors.Is(err, repository.ErrDepartureFull) {
				return nil, apperror.DepartureFull()
			}
			if errors.Is(err, repository.ErrNotFound) {
				return nil, apperror.DepartureNotFound()
			}
			return nil, apperror.Internal()
		}
		d := updated.StartDate
		depDate = &d
	}

	booking := &models.Booking{
		FullName:      name,
		Phone:         phone,
		Email:         email,
		People:        people,
		Date:          cleanPtr(in.Date),
		DepartureID:   cleanPtr(in.DepartureID),
		DepartureDate: depDate,
		Notes:         cleanPtr(in.Notes),
		Status:        "new",
	}

	// Resolve the catalog tour by id or slug (snapshot its title + slug). All are
	// optional so a generic "custom itinerary" enquiry still works.
	var resolved *models.CatalogTour
	if id := trimPtr(in.CatalogTourID); id != "" {
		t, err := s.catalog.FindByID(id)
		if err == nil {
			resolved = t
		}
	}
	if resolved == nil {
		if slug := trimPtr(in.TourSlug); slug != "" {
			if t, err := s.catalog.FindBySlug(slug); err == nil {
				resolved = t
			}
		}
	}

	switch {
	case resolved != nil:
		booking.CatalogTourID = &resolved.ID
		booking.TourSlug = &resolved.Slug
		if az, ok := resolved.Title["az"]; ok && az != "" {
			booking.TourTitle = az
		} else if en, ok := resolved.Title["en"]; ok {
			booking.TourTitle = en
		} else {
			booking.TourTitle = resolved.Slug
		}
	case trimPtr(in.TourTitle) != "":
		// Landing tour not yet in the catalog — keep the provided title + slug.
		booking.TourTitle = trimPtr(in.TourTitle)
		booking.TourSlug = cleanPtr(in.TourSlug)
	default:
		booking.TourTitle = "Fərdi sorğu"
	}

	if err := s.bookings.Create(booking); err != nil {
		return nil, apperror.Internal()
	}
	return booking, nil
}

func (s *bookingService) UpdateStatus(id, status string) (*models.Booking, error) {
	if !validBookingStatuses[status] {
		return nil, validationError([]apperror.FieldError{{Field: "status", Message: "Status yanlışdır"}})
	}
	booking, err := s.bookings.FindByID(id)
	if err != nil {
		return nil, apperror.BookingNotFound()
	}
	booking.Status = status
	if err := s.bookings.Update(booking); err != nil {
		return nil, apperror.Internal()
	}
	return booking, nil
}

func (s *bookingService) Delete(id string) error {
	if _, err := s.bookings.FindByID(id); err != nil {
		return apperror.BookingNotFound()
	}
	if err := s.bookings.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}
