package models

import "time"

// Tour is the core entity: a date-ranged trip containing a daily timeline of events.
type Tour struct {
	ID          string    `json:"id"            gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Title       string    `json:"title"         gorm:"type:text;not null"`
	StartDate   string    `json:"start_date"    gorm:"type:date;not null"` // YYYY-MM-DD
	EndDate     string    `json:"end_date"      gorm:"type:date;not null"` // YYYY-MM-DD
	Description *string   `json:"description"   gorm:"type:text"`
	Status      string    `json:"status"        gorm:"type:tour_status;default:'planned';not null"`
	Events      []Event   `json:"-"             gorm:"foreignKey:TourID;constraint:OnDelete:CASCADE"`
	EventsCount int64     `json:"events_count"  gorm:"-"` // computed, not stored
	CreatedAt   time.Time `json:"created_at"    gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}

func (Tour) TableName() string { return "tours" }
