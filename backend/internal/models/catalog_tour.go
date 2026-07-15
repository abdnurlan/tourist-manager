package models

import "time"

// LangMap holds a translatable string keyed by language code (az, en, ru, ar, he).
type LangMap map[string]string

// DayPlan is a single itinerary step.
type DayPlan struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

// CatalogTour is a public, marketing-facing tour offering shown on the landing
// site (distinct from the internal itinerary-planning Tour). Multilingual text
// fields are stored as JSON keyed by language code (az, en, ru, ar, he), using
// GORM's built-in json serializer.
type CatalogTour struct {
	ID        string  `json:"id"          gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Slug      string  `json:"slug"        gorm:"type:text;not null;uniqueIndex"`
	Category  string  `json:"category"    gorm:"type:catalog_category;not null"`
	Price     int     `json:"price"       gorm:"type:int;not null"`
	Rating    float64 `json:"rating"      gorm:"type:numeric(2,1);not null;default:5"`
	Duration  int     `json:"duration"    gorm:"type:int;not null;default:1"` // days
	GroupSize string  `json:"group_size"  gorm:"type:text;not null;default:''"`
	ImageURL  string  `json:"image_url"   gorm:"type:text;not null;default:''"`
	Published bool    `json:"published"   gorm:"type:boolean;not null;default:true"`
	SortOrder int     `json:"sort_order"  gorm:"type:int;not null;default:0"`

	// Multilingual content — persisted as jsonb via GORM's json serializer.
	Title      LangMap              `json:"title"      gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Region     LangMap              `json:"region"     gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Overview   LangMap              `json:"overview"   gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Highlights map[string][]string  `json:"highlights" gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Itinerary  map[string][]DayPlan `json:"itinerary"  gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Included   map[string][]string  `json:"included"   gorm:"serializer:json;type:jsonb;not null;default:'{}'"`
	Excluded   map[string][]string  `json:"excluded"   gorm:"serializer:json;type:jsonb;not null;default:'{}'"`

	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (CatalogTour) TableName() string { return "catalog_tours" }
