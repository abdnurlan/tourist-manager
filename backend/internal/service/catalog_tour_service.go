package service

import (
	"errors"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/pricing"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// CatalogTourInput carries create/update fields (nil pointer = unchanged on update).
type CatalogTourInput struct {
	Slug       *string
	Category   *string
	Price      *int
	Rating     *float64
	Duration   *int
	GroupSize  *string
	ImageURL   *string
	Published  *bool
	SortOrder  *int
	Title      map[string]string
	Region     map[string]string
	Overview   map[string]string
	Highlights map[string][]string
	Itinerary  map[string][]models.DayPlan
	Included   map[string][]string
	Excluded   map[string][]string
	Pricing    *pricing.Pricing
}

// CatalogTourService implements catalog-tour business logic.
type CatalogTourService interface {
	List(f repository.CatalogTourFilter) ([]models.CatalogTour, error)
	Get(id string) (*models.CatalogTour, error)
	GetBySlug(slug string) (*models.CatalogTour, error)
	Create(in CatalogTourInput) (*models.CatalogTour, error)
	Update(id string, in CatalogTourInput) (*models.CatalogTour, error)
	Delete(id string) error
}

type catalogTourService struct {
	repo repository.CatalogTourRepository
}

// NewCatalogTourService builds a CatalogTourService.
func NewCatalogTourService(repo repository.CatalogTourRepository) CatalogTourService {
	return &catalogTourService{repo: repo}
}

func (s *catalogTourService) List(f repository.CatalogTourFilter) ([]models.CatalogTour, error) {
	tours, err := s.repo.List(f)
	if err != nil {
		return nil, apperror.Internal()
	}
	return tours, nil
}

func (s *catalogTourService) Get(id string) (*models.CatalogTour, error) {
	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, apperror.CatalogTourNotFound()
	}
	return t, nil
}

func (s *catalogTourService) GetBySlug(slug string) (*models.CatalogTour, error) {
	t, err := s.repo.FindBySlug(slug)
	if err != nil {
		return nil, apperror.CatalogTourNotFound()
	}
	return t, nil
}

func (s *catalogTourService) Create(in CatalogTourInput) (*models.CatalogTour, error) {
	var fields []apperror.FieldError

	slug := trimPtr(in.Slug)
	if slug == "" {
		fields = append(fields, apperror.FieldError{Field: "slug", Message: "Slug tələb olunur"})
	}
	category := trimPtr(in.Category)
	if category == "" {
		fields = append(fields, apperror.FieldError{Field: "category", Message: "Kateqoriya tələb olunur"})
	} else if !validCatalogCategories[category] {
		fields = append(fields, apperror.FieldError{Field: "category", Message: "Kateqoriya yanlışdır"})
	}
	if in.Price != nil && *in.Price < 0 {
		fields = append(fields, apperror.FieldError{Field: "price", Message: "Qiymət düzgün deyil"})
	}
	if in.Pricing == nil && in.Price == nil {
		fields = append(fields, apperror.FieldError{Field: "pricing", Message: "Qiymət cədvəli tələb olunur"})
	}
	if in.Pricing != nil {
		if err := validatePricing(in.Pricing); err != nil {
			fields = append(fields, apperror.FieldError{Field: "pricing", Message: err.Error()})
		}
	}
	if len(in.Title) == 0 || trimSpace(in.Title["az"]) == "" {
		fields = append(fields, apperror.FieldError{Field: "title", Message: "Ad tələb olunur"})
	}
	if len(fields) > 0 {
		return nil, validationError(fields)
	}

	if exists, err := s.repo.SlugExists(slug, ""); err != nil {
		return nil, apperror.Internal()
	} else if exists {
		return nil, validationError([]apperror.FieldError{{Field: "slug", Message: "Bu slug artıq mövcuddur"}})
	}

	t := &models.CatalogTour{
		Slug:       slug,
		Category:   category,
		Pricing:    in.Pricing,
		Price:      derivedFromPrice(in.Pricing, in.Price),
		Rating:     valOrDefault(in.Rating, 5),
		Duration:   valOrDefaultInt(in.Duration, 1),
		GroupSize:  trimPtr(in.GroupSize),
		ImageURL:   trimPtr(in.ImageURL),
		Published:  valOrDefaultBool(in.Published, true),
		SortOrder:  valOrDefaultInt(in.SortOrder, 0),
		Title:      orEmptyMap(in.Title),
		Region:     orEmptyMap(in.Region),
		Overview:   orEmptyMap(in.Overview),
		Highlights: orEmptyListMap(in.Highlights),
		Itinerary:  orEmptyPlanMap(in.Itinerary),
		Included:   orEmptyListMap(in.Included),
		Excluded:   orEmptyListMap(in.Excluded),
	}
	if err := s.repo.Create(t); err != nil {
		return nil, apperror.Internal()
	}
	return t, nil
}

func (s *catalogTourService) Update(id string, in CatalogTourInput) (*models.CatalogTour, error) {
	t, err := s.repo.FindByID(id)
	if err != nil {
		return nil, apperror.CatalogTourNotFound()
	}

	if in.Slug != nil {
		slug := trimPtr(in.Slug)
		if slug == "" {
			return nil, validationError([]apperror.FieldError{{Field: "slug", Message: "Slug tələb olunur"}})
		}
		if exists, err := s.repo.SlugExists(slug, id); err != nil {
			return nil, apperror.Internal()
		} else if exists {
			return nil, validationError([]apperror.FieldError{{Field: "slug", Message: "Bu slug artıq mövcuddur"}})
		}
		t.Slug = slug
	}
	if in.Category != nil {
		category := trimPtr(in.Category)
		if !validCatalogCategories[category] {
			return nil, validationError([]apperror.FieldError{{Field: "category", Message: "Kateqoriya yanlışdır"}})
		}
		t.Category = category
	}
	if in.Pricing != nil {
		if err := validatePricing(in.Pricing); err != nil {
			return nil, validationError([]apperror.FieldError{{Field: "pricing", Message: err.Error()}})
		}
		t.Pricing = in.Pricing
	}
	if in.Price != nil {
		if *in.Price < 0 {
			return nil, validationError([]apperror.FieldError{{Field: "price", Message: "Qiymət düzgün deyil"}})
		}
		t.Price = *in.Price
	}
	// Keep the derived "from" figure in step with the matrix.
	if in.Pricing != nil && in.Price == nil {
		t.Price = derivedFromPrice(t.Pricing, nil)
	}
	if in.Rating != nil {
		t.Rating = *in.Rating
	}
	if in.Duration != nil {
		t.Duration = *in.Duration
	}
	if in.GroupSize != nil {
		t.GroupSize = trimPtr(in.GroupSize)
	}
	if in.ImageURL != nil {
		t.ImageURL = trimPtr(in.ImageURL)
	}
	if in.Published != nil {
		t.Published = *in.Published
	}
	if in.SortOrder != nil {
		t.SortOrder = *in.SortOrder
	}
	if in.Title != nil {
		t.Title = in.Title
	}
	if in.Region != nil {
		t.Region = in.Region
	}
	if in.Overview != nil {
		t.Overview = in.Overview
	}
	if in.Highlights != nil {
		t.Highlights = in.Highlights
	}
	if in.Itinerary != nil {
		t.Itinerary = in.Itinerary
	}
	if in.Included != nil {
		t.Included = in.Included
	}
	if in.Excluded != nil {
		t.Excluded = in.Excluded
	}

	if err := s.repo.Update(t); err != nil {
		return nil, apperror.Internal()
	}
	return t, nil
}

func (s *catalogTourService) Delete(id string) error {
	if _, err := s.repo.FindByID(id); err != nil {
		return apperror.CatalogTourNotFound()
	}
	if err := s.repo.Delete(id); err != nil {
		return apperror.Internal()
	}
	return nil
}

// derivedFromPrice keeps CatalogTour.Price meaningful as the cheapest total a
// party can pay. An explicit price wins; otherwise it comes from the matrix.
func derivedFromPrice(p *pricing.Pricing, explicit *int) int {
	if explicit != nil {
		return *explicit
	}
	return pricing.FromPrice(p)
}

// validatePricing rejects a matrix that cannot produce a quote.
func validatePricing(p *pricing.Pricing) error {
	switch p.Model {
	case pricing.ModelOnRequest:
		return nil
	case pricing.ModelGroupTiers, pricing.ModelFlatPerPerson, pricing.ModelPerVehicle:
	default:
		return errPricingModel
	}
	if p.Model == pricing.ModelPerVehicle && p.VehicleCapacity < 1 {
		return errVehicleCapacity
	}
	if len(p.Tiers) == 0 {
		return errPricingTiers
	}
	for _, t := range p.Tiers {
		if t.Min < 1 || (t.Max != nil && *t.Max < t.Min) {
			return errPricingTiers
		}
		if len(t.Rates) == 0 {
			return errPricingTiers
		}
	}
	// A quote must exist for a single traveller, otherwise the landing page
	// cannot render anything at all.
	if _, err := pricing.Calculate(p, 1, pricing.RateStandard); err != nil {
		return err
	}
	return nil
}

var (
	errPricingModel    = errors.New("qiymət modeli yanlışdır")
	errPricingTiers    = errors.New("qiymət pillələri yanlışdır")
	errVehicleCapacity = errors.New("nəqliyyat tutumu yanlışdır")
)
