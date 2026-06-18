package models

import "time"

// Reminder is a scheduled Azerbaijani notification, optionally tied to an event.
type Reminder struct {
	ID        string    `json:"id"         gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	EventID   *string   `json:"event_id"   gorm:"type:uuid;index"`
	RemindAt  time.Time `json:"remind_at"  gorm:"type:timestamptz;not null;index"`
	Message   string    `json:"message"    gorm:"type:text;not null"`
	Sent      bool      `json:"sent"       gorm:"default:false;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (Reminder) TableName() string { return "reminders" }
