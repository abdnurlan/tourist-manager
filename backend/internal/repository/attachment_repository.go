package repository

import (
	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// AttachmentRepository defines persistence operations for attachments.
type AttachmentRepository interface {
	ListByEvent(eventID string) ([]models.Attachment, error)
	Create(att *models.Attachment) error
	Delete(id string) error
}

type attachmentRepository struct {
	db *gorm.DB
}

// NewAttachmentRepository builds a GORM-backed AttachmentRepository.
func NewAttachmentRepository(db *gorm.DB) AttachmentRepository {
	return &attachmentRepository{db: db}
}

func (r *attachmentRepository) ListByEvent(eventID string) ([]models.Attachment, error) {
	var atts []models.Attachment
	err := r.db.Where("event_id = ?", eventID).Order("created_at ASC").Find(&atts).Error
	return atts, err
}

func (r *attachmentRepository) Create(att *models.Attachment) error {
	return r.db.Create(att).Error
}

func (r *attachmentRepository) Delete(id string) error {
	return r.db.Where("id = ?", id).Delete(&models.Attachment{}).Error
}
