package models

import "time"

// Attachment is a file/url linked to an event (image, document, voice).
type Attachment struct {
	ID        string    `json:"id"         gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	EventID   string    `json:"event_id"   gorm:"type:uuid;not null;index"`
	URL       string    `json:"url"        gorm:"type:text;not null"`
	Kind      *string   `json:"kind"       gorm:"type:text"`
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
}

func (Attachment) TableName() string { return "attachments" }
