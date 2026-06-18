package models

import "time"

// Event is a single timeline item within a tour (transfer, hotel, restaurant, etc.).
type Event struct {
	ID            string     `json:"id"             gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	TourID        string     `json:"tour_id"        gorm:"type:uuid;not null;index"`
	Title         string     `json:"title"          gorm:"type:text;not null"`
	Type          string     `json:"type"           gorm:"type:event_type;default:'other';not null"`
	Date          string     `json:"date"           gorm:"type:date;not null;index"` // YYYY-MM-DD
	Time          *string    `json:"time"           gorm:"type:varchar(5)"`          // HH:mm
	Location      *string    `json:"location"       gorm:"type:text"`
	Participants  *string    `json:"participants"   gorm:"type:text"`
	Phone         *string    `json:"phone"          gorm:"type:text"`
	Price         *float64   `json:"price"          gorm:"type:numeric(12,2)"`
	Currency      *string    `json:"currency"       gorm:"type:varchar(8)"`
	PaymentStatus *string    `json:"payment_status" gorm:"type:payment_status"`
	ReminderTime  *time.Time `json:"reminder_time"  gorm:"type:timestamptz"`
	Attachment    *string    `json:"attachment"     gorm:"type:text"`
	Notes         *string    `json:"notes"          gorm:"type:text"`
	Status        string     `json:"status"         gorm:"type:event_status;default:'planned';not null"`
	Source        string     `json:"source"         gorm:"type:event_source;default:'manual';not null"`
	CreatedAt     time.Time  `json:"created_at"     gorm:"autoCreateTime"`
	UpdatedAt     time.Time  `json:"updated_at"     gorm:"autoUpdateTime"`
}

func (Event) TableName() string { return "events" }
