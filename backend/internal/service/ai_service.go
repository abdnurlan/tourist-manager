package service

import (
	"context"
	"strings"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// webUserKey identifies the web app as the agent's conversation key, and
// telegram_user_id = 0 as the message sender (CONTRACT.md §6.7).
const webUserKey = "web"
const webAppUserID int64 = 0

// ChatResult is the /ai/chat action response (CONTRACT.md §6.7).
type ChatResult struct {
	Reply      string `json:"reply"`
	Intent     string `json:"intent"`
	Source     string `json:"source"`
	Transcript string `json:"transcript,omitempty"` // set on the voice path
}

// AIService is the web-facing AI boundary: it runs the agent and logs the
// exchange to telegram_messages (telegram_user_id = 0 denotes the web app).
type AIService interface {
	Chat(message string) (*ChatResult, error)
	// Voice transcribes uploaded audio then runs it through Chat.
	Voice(audio []byte, filename string) (*ChatResult, error)
	History(limit int) ([]models.TelegramMessage, error)
}

type aiService struct {
	agent    *AIAgent
	telegram repository.TelegramRepository
}

// NewAIService builds the web AIService on top of the shared agent.
func NewAIService(agent *AIAgent, telegram repository.TelegramRepository) AIService {
	return &aiService{agent: agent, telegram: telegram}
}

func (s *aiService) Chat(message string) (*ChatResult, error) {
	message = strings.TrimSpace(message)
	if message == "" {
		return nil, validationError([]apperror.FieldError{
			{Field: "message", Message: "Mesaj tələb olunur."},
		})
	}

	reply, intent, err := s.agent.Handle(context.Background(), webUserKey, message)
	if err != nil {
		return nil, apperror.Internal()
	}

	s.log("in", message, intent)
	s.log("out", reply, intent)

	return &ChatResult{Reply: reply, Intent: intent, Source: "ai"}, nil
}

func (s *aiService) Voice(audio []byte, filename string) (*ChatResult, error) {
	transcript, err := s.agent.Transcribe(context.Background(), audio, filename)
	if err != nil || strings.TrimSpace(transcript) == "" {
		return nil, apperror.Internal()
	}
	// Run the transcript through the normal chat path (logs + agent).
	res, err := s.Chat(transcript)
	if err != nil {
		return nil, err
	}
	res.Transcript = transcript
	return res, nil
}

func (s *aiService) log(direction, content, intent string) {
	c := content
	i := intent
	_ = s.telegram.Create(&models.TelegramMessage{
		TelegramUserID: webAppUserID,
		Direction:      direction,
		Kind:           "text",
		Content:        &c,
		Intent:         &i,
	})
}

func (s *aiService) History(limit int) ([]models.TelegramMessage, error) {
	msgs, err := s.telegram.History(limit)
	if err != nil {
		return nil, err
	}
	for i := range msgs {
		msgs[i].RawJSON = nil
	}
	return msgs, nil
}
