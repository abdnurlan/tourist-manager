package repository

import (
	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// TelegramRepository defines persistence operations for telegram_messages
// (also used for web AI chat logging and the AI history view).
type TelegramRepository interface {
	Create(msg *models.TelegramMessage) error
	History(limit int) ([]models.TelegramMessage, error)
	LastMessageAt() (*models.TelegramMessage, error)
}

type telegramRepository struct {
	db *gorm.DB
}

// NewTelegramRepository builds a GORM-backed TelegramRepository.
func NewTelegramRepository(db *gorm.DB) TelegramRepository {
	return &telegramRepository{db: db}
}

func (r *telegramRepository) Create(msg *models.TelegramMessage) error {
	return r.db.Create(msg).Error
}

func (r *telegramRepository) History(limit int) ([]models.TelegramMessage, error) {
	var msgs []models.TelegramMessage
	err := r.db.Order("created_at DESC").Limit(limit).Find(&msgs).Error
	return msgs, err
}

func (r *telegramRepository) LastMessageAt() (*models.TelegramMessage, error) {
	var msg models.TelegramMessage
	err := r.db.Order("created_at DESC").First(&msg).Error
	if err != nil {
		return nil, err
	}
	return &msg, nil
}
