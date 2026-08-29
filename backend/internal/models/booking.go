package models

import "time"

// Booking is a reservation submitted from the public landing site for a catalog
// tour. TourTitle is a snapshot so the record survives catalog edits/deletes.
type Booking struct {
	ID            string  `json:"id"              gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CatalogTourID *string `json:"catalog_tour_id" gorm:"type:uuid;index"` // nullable: tour may be removed
	TourSlug      *string `json:"tour_slug"       gorm:"type:text"`
	TourTitle     string  `json:"tour_title"      gorm:"type:text;not null"` // snapshot
	FullName      string  `json:"full_name"       gorm:"type:text;not null"`
	Phone         *string `json:"phone"           gorm:"type:text"`
	Email         *string `json:"email"           gorm:"type:text"`
	People        int     `json:"people"          gorm:"type:int;not null;default:1"`
	Date          *string `json:"date"            gorm:"type:date"`       // YYYY-MM-DD, optional
	TourID        *string `json:"tour_id"         gorm:"type:uuid;index"` // nullable: linked internal tour (departure)
	Notes         *string `json:"notes"           gorm:"type:text"`

	// Money is frozen at booking time: the catalog price sheet may change, the
	// agreed total may not. GuideLang records which rate column was applied.
	QuotedTotal *float64  `json:"quoted_total" gorm:"type:numeric(12,2)"`
	Currency    *string   `json:"currency"     gorm:"type:varchar(8)"`
	GuideLang   *string   `json:"guide_lang"   gorm:"type:varchar(8)"`
	Status      string    `json:"status"          gorm:"type:booking_status;not null;default:'new'"`
	CreatedAt   time.Time `json:"created_at"    gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}

func (Booking) TableName() string { return "bookings" }
