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
	Date          *string `json:"date"            gorm:"type:date"` // YYYY-MM-DD, optional
	DepartureID   *string `json:"departure_id"    gorm:"type:uuid;index"` // nullable: linked departure
	DepartureDate *string `json:"departure_date"  gorm:"type:date"`       // snapshot of departure start
	Notes         *string `json:"notes"           gorm:"type:text"`
	Status        string  `json:"status"          gorm:"type:booking_status;not null;default:'new'"`
	CreatedAt     time.Time `json:"created_at"    gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}

func (Booking) TableName() string { return "bookings" }
