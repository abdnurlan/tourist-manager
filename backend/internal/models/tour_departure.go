package models

import "time"

// TourDeparture is a concrete dated departure of a CatalogTour. A catalog tour
// is the reusable template ("Quba turu"); each departure is one bookable date
// with its own capacity and optional price override. Status is stored but the
// effective status is recomputed on read (a past start date is always closed).
type TourDeparture struct {
	ID            string    `json:"id"              gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	CatalogTourID string    `json:"catalog_tour_id" gorm:"type:uuid;not null;index"`
	StartDate     string    `json:"start_date"      gorm:"type:date;not null"` // YYYY-MM-DD
	EndDate       *string   `json:"end_date"        gorm:"type:date"`          // YYYY-MM-DD, optional
	Price         *int      `json:"price"           gorm:"type:int"`           // nil → catalog base price
	Capacity      int       `json:"capacity"        gorm:"type:int;not null;default:12"`
	Booked        int       `json:"booked"          gorm:"type:int;not null;default:0"`
	Status        string    `json:"status"          gorm:"type:departure_status;not null;default:'open'"`
	SortOrder     int       `json:"sort_order"      gorm:"type:int;not null;default:0"`
	CreatedAt     time.Time `json:"created_at"      gorm:"autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at"      gorm:"autoUpdateTime"`
}

func (TourDeparture) TableName() string { return "tour_departures" }

// dateOnly trims a possibly RFC3339 date string ("2026-10-15T00:00:00Z") to a
// bare "2026-10-15". The Postgres date column round-trips as a full timestamp
// through GORM's string mapping, so normalise it before it reaches clients.
func dateOnly(s string) string {
	if len(s) >= 10 {
		return s[:10]
	}
	return s
}

// Normalize collapses the date fields to bare YYYY-MM-DD form in place.
func (d *TourDeparture) Normalize() {
	d.StartDate = dateOnly(d.StartDate)
	if d.EndDate != nil {
		e := dateOnly(*d.EndDate)
		d.EndDate = &e
	}
}

// Remaining is capacity minus booked, never below zero.
func (d TourDeparture) Remaining() int {
	r := d.Capacity - d.Booked
	if r < 0 {
		return 0
	}
	return r
}

// EffectiveStatus recomputes status from the data: a past start date is closed,
// a full departure is full, otherwise open. today is "YYYY-MM-DD".
func (d TourDeparture) EffectiveStatus(today string) string {
	if d.StartDate < today {
		return "closed"
	}
	if d.Booked >= d.Capacity {
		return "full"
	}
	return "open"
}
