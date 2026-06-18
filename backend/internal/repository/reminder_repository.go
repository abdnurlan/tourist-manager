package repository

import (
	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// ReminderRepository defines persistence operations for reminders.
type ReminderRepository interface {
	Create(r *models.Reminder) error
	DueBetween(fromRFC3339, toRFC3339 string) ([]models.Reminder, error)
	ListUnsent() ([]models.Reminder, error)
}

type reminderRepository struct {
	db *gorm.DB
}

// NewReminderRepository builds a GORM-backed ReminderRepository.
func NewReminderRepository(db *gorm.DB) ReminderRepository {
	return &reminderRepository{db: db}
}

func (r *reminderRepository) Create(rem *models.Reminder) error {
	return r.db.Create(rem).Error
}

func (r *reminderRepository) DueBetween(fromRFC3339, toRFC3339 string) ([]models.Reminder, error) {
	var rems []models.Reminder
	err := r.db.Where("remind_at >= ? AND remind_at <= ?", fromRFC3339, toRFC3339).
		Order("remind_at ASC").Find(&rems).Error
	return rems, err
}

func (r *reminderRepository) ListUnsent() ([]models.Reminder, error) {
	var rems []models.Reminder
	err := r.db.Where("sent = ?", false).Order("remind_at ASC").Find(&rems).Error
	return rems, err
}
