package models

import (
	"encoding/json"
	"time"
)

// TelegramMessage logs every inbound/outbound Telegram (and web AI chat) message.
// Powers the web AI history view.
type TelegramMessage struct {
	ID             string          `json:"id"                 gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	TelegramUserID int64           `json:"telegram_user_id"   gorm:"not null;index"`
	Direction      string          `json:"direction"          gorm:"type:tg_direction;not null"`
	Kind           string          `json:"kind"               gorm:"type:tg_kind;not null"`
	Content        *string         `json:"content"            gorm:"type:text"`
	Transcript     *string         `json:"transcript"         gorm:"type:text"`
	Intent         *string         `json:"intent"             gorm:"type:text"`
	RawJSON        json.RawMessage `json:"raw_json,omitempty" gorm:"type:jsonb"`
	CreatedAt      time.Time       `json:"created_at"         gorm:"autoCreateTime;index"`
}

func (TelegramMessage) TableName() string { return "telegram_messages" }
