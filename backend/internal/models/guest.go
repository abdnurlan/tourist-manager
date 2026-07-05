package models

import "time"

// Guest is a tourist attached to a tour. Only FullName is required.
type Guest struct {
	ID          string    `json:"id"          gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	TourID      string    `json:"tour_id"     gorm:"type:uuid;not null;index"`
	FullName    string    `json:"full_name"   gorm:"type:text;not null"`
	Phone       *string   `json:"phone"       gorm:"type:text"`
	Passport    *string   `json:"passport"    gorm:"type:text"`
	Nationality *string   `json:"nationality" gorm:"type:text"`
	Notes       *string   `json:"notes"       gorm:"type:text"`
	CreatedAt   time.Time `json:"created_at"  gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at"  gorm:"autoUpdateTime"`
}

func (Guest) TableName() string { return "guests" }
