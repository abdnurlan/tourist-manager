package models

import "time"

// Tour is the core entity: a date-ranged trip containing a daily timeline of
// events. A tour may be linked to a CatalogTour (the public "template"): its
// price is then inherited from the catalog and it becomes a bookable departure
// on the landing site.
type Tour struct {
	ID            string    `json:"id"              gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title         string    `json:"title"           gorm:"type:text;not null"`
	StartDate     string    `json:"start_date"      gorm:"type:date;not null"` // YYYY-MM-DD
	EndDate       string    `json:"end_date"        gorm:"type:date;not null"` // YYYY-MM-DD
	Description   *string   `json:"description"     gorm:"type:text"`
	Status        string    `json:"status"          gorm:"type:tour_status;default:'planned';not null"`
	CatalogTourID *string   `json:"catalog_tour_id" gorm:"type:uuid;index"`             // nullable: linked catalog template
	Capacity      int       `json:"capacity"        gorm:"type:int;not null;default:12"` // seat limit
	Events        []Event   `json:"-"               gorm:"foreignKey:TourID;constraint:OnDelete:CASCADE"`
	EventsCount   int64     `json:"events_count"    gorm:"-"` // computed, not stored
	GuestsCount   int64     `json:"guests_count"    gorm:"-"` // computed: guest rows on this tour
	BookedSeats   int64     `json:"booked_seats"    gorm:"-"` // computed: Σ people across bookings (landing "booked")
	Price         int       `json:"price"           gorm:"-"` // computed: inherited from linked catalog
	CatalogSlug   string    `json:"catalog_slug"    gorm:"-"` // computed: linked catalog slug (landing link)
	CatalogTitle  string    `json:"catalog_title"   gorm:"-"` // computed: linked catalog AZ title
	CreatedAt     time.Time `json:"created_at"      gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at"      gorm:"autoUpdateTime"`
}

func (Tour) TableName() string { return "tours" }
