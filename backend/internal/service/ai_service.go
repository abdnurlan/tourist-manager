package service

import (
	"context"
	"strings"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// webAppUserID denotes the web app as the telegram_messages sender (CONTRACT.md §6.7).
const webAppUserID int64 = 0

// ChatResult is the /ai/chat action response (CONTRACT.md §6.7).
type ChatResult struct {
	Reply  string `json:"reply"`
	Intent string `json:"intent"`
	Source string `json:"source"`
}

// AIService wraps the AI boundary and logs web chat to telegram_messages
// (telegram_user_id = 0 denotes the web app).
type AIService interface {
	// Chat answers a web-app message and logs inbound/outbound to telegram_messages.
	Chat(message string) (*ChatResult, error)
	// History returns recent telegram_messages (newest first), feeding the AI history view.
	History(limit int) ([]models.TelegramMessage, error)
}

type aiService struct {
	ai       ai.AIService
	telegram repository.TelegramRepository
}

// NewAIService builds the service-layer AIService.
func NewAIService(aiClient ai.AIService, telegram repository.TelegramRepository) AIService {
	return &aiService{ai: aiClient, telegram: telegram}
}

func (s *aiService) Chat(message string) (*ChatResult, error) {
	message = strings.TrimSpace(message)
	if message == "" {
		return nil, validationError([]apperror.FieldError{
			{Field: "message", Message: "Mesaj tələb olunur."},
		})
	}

	reply, intent, err := s.ai.Chat(context.Background(), message)
	if err != nil {
		return nil, apperror.Internal()
	}

	// Log inbound (web user) — best-effort; do not fail the chat on log errors.
	inContent := message
	inIntent := intent
	_ = s.telegram.Create(&models.TelegramMessage{
		TelegramUserID: webAppUserID,
		Direction:      "in",
		Kind:           "text",
		Content:        &inContent,
		Intent:         &inIntent,
	})

	// Log outbound (assistant reply).
	outContent := reply
	outIntent := intent
	_ = s.telegram.Create(&models.TelegramMessage{
		TelegramUserID: webAppUserID,
		Direction:      "out",
		Kind:           "text",
		Content:        &outContent,
		Intent:         &outIntent,
	})

	return &ChatResult{Reply: reply, Intent: intent, Source: "ai"}, nil
}

func (s *aiService) History(limit int) ([]models.TelegramMessage, error) {
	msgs, err := s.telegram.History(limit)
	if err != nil {
		return nil, err
	}
	// Strip raw Telegram payloads (chat/user metadata) from the web history view.
	for i := range msgs {
		msgs[i].RawJSON = nil
	}
	return msgs, nil
}
