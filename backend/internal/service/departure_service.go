package service

import (
	"time"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// DepartureInput carries a create/update body. Pointers let PATCH leave fields
// unchanged.
type DepartureInput struct {
	StartDate *string
	EndDate   *string
	Price     *int
	Capacity  *int
	SortOrder *int
}

// DepartureService implements departure business logic.
type DepartureService interface {
	ListByTour(catalogTourID string) ([]models.TourDeparture, error)
	ListPublicByTour(catalogTourID string) ([]models.TourDeparture, error)
	Create(catalogTourID string, in DepartureInput) (*models.TourDeparture, error)
	Update(id string, in DepartureInput) (*models.TourDeparture, error)
	Delete(id string) error
}

type departureService struct {
	repo    repository.DepartureRepository
	catalog repository.CatalogTourRepository
}

// NewDepartureService builds a DepartureService.
func NewDepartureService(repo repository.DepartureRepository, catalog repository.CatalogTourRepository) DepartureService {
	return &departureService{repo: repo, catalog: catalog}
}

func today() string { return time.Now().Format("2006-01-02") }

// stampStatus normalises dates and overwrites each departure's Status with its
// effective status so callers/JSON always see clean, up-to-date values.
func stampStatus(list []models.TourDeparture) {
	t := today()
	for i := range list {
		list[i].Normalize()
		list[i].Status = list[i].EffectiveStatus(t)
	}
}

func (s *departureService) ListByTour(catalogTourID string) ([]models.TourDeparture, error) {
	list, err := s.repo.ListByTour(catalogTourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	stampStatus(list)
	return list, nil
}

func (s *departureService) ListPublicByTour(catalogTourID string) ([]models.TourDeparture, error) {
	all, err := s.repo.ListByTour(catalogTourID)
	if err != nil {
		return nil, apperror.Internal()
	}
	t := today()
	out := make([]models.TourDeparture, 0, len(all))
	for _, d := range all {
		if d.EffectiveStatus(t) == "open" {
			d.Normalize()
			d.Status = "open"
			out = append(out, d)
		}
	}
	return out, nil
}

func (s *departureService) Create(catalogTourID string, in DepartureInput) (*models.TourDeparture, error) {
	// Tour must exist.
	if _, err := s.catalog.FindByID(catalogTourID); err != nil {
		return nil, apperror.CatalogTourNotFound()
	}

	var fields []apperror.FieldError
	start := trimPtr(in.StartDate)
	if start == "" || !isValidDate(start) {
		fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Başlama tarixi düzgün deyil"})
	}
	if in.EndDate != nil && trimPtr(in.EndDate) != "" && !isValidDate(trimPtr(in.EndDate)) {
		fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi düzgün deyil"})
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	capacity := 12
	if in.Capacity != nil && *in.Capacity > 0 {
		capacity = *in.Capacity
	}
	sortOrder := 0
	if in.SortOrder != nil {
		sortOrder = *in.SortOrder
	}

	d := &models.TourDeparture{
		CatalogTourID: catalogTourID,
		StartDate:     start,
		EndDate:       cleanPtr(in.EndDate),
		Price:         in.Price, // nil → inherits base price on read
		Capacity:      capacity,
		Booked:        0,
		Status:        "open",
		SortOrder:     sortOrder,
	}
	if err := s.repo.Create(d); err != nil {
		return nil, apperror.Internal()
	}
	d.Normalize()
	d.Status = d.EffectiveStatus(today())
	return d, nil
}

func (s *departureService) Update(id string, in DepartureInput) (*models.TourDeparture, error) {
	d, err := s.repo.FindByID(id)
	if err != nil {
		return nil, apperror.DepartureNotFound()
	}

	var fields []apperror.FieldError
	if in.StartDate != nil {
		start := trimPtr(in.StartDate)
		if start == "" || !isValidDate(start) {
			fields = append(fields, apperror.FieldError{Field: "start_date", Message: "Başlama tarixi düzgün deyil"})
		} else {
			d.StartDate = start
		}
	}
	if in.EndDate != nil {
		if trimPtr(in.EndDate) != "" && !isValidDate(trimPtr(in.EndDate)) {
			fields = append(fields, apperror.FieldError{Field: "end_date", Message: "Bitmə tarixi düzgün deyil"})
		} else {
			d.EndDate = cleanPtr(in.EndDate)
		}
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}
	if in.Price != nil {
		d.Price = in.Price
	}
	if in.Capacity != nil && *in.Capacity > 0 {
		d.Capacity = *in.Capacity
	}
	if in.SortOrder != nil {
		d.SortOrder = *in.SortOrder
	}

	if err := s.repo.Update(d); err != nil {
		return nil, apperror.Internal()
	}
	d.Normalize()
	d.Status = d.EffectiveStatus(today())
	return d, nil
}

func (s *departureService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return apperror.DepartureNotFound()
	}
	if err := s.repo.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}
