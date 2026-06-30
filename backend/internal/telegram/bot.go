package telegram

import (
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/service"
)

// BotService is the Telegram bot boundary: it parses updates, enforces the allowed
// user, dispatches commands/free-text/voice, logs messages and sends replies.
type BotService interface {
	// HandleUpdate processes a single Telegram Update (from webhook or poller).
	HandleUpdate(update tgbotapi.Update)
	// SendMessage sends an Azerbaijani text reply to a chat and logs it (direction=out).
	SendMessage(chatID int64, text string) error
	// IsAllowed reports whether the given Telegram user id may use the bot.
	IsAllowed(userID int64) bool
	// StartPolling runs the long-polling loop (blocking); used when TELEGRAM_MODE=polling.
	StartPolling()

	// Command handlers (CONTRACT.md §10.3).
	HandleStart(chatID int64) error
	HandleHelp(chatID int64) error
	HandleToday(chatID int64) error
	HandleTomorrow(chatID int64) error
	HandleTours(chatID int64) error
	HandleActive(chatID int64) error
}

// botService is the concrete BotService.
type botService struct {
	api           *tgbotapi.BotAPI
	mode          string
	allowedUserID int64

	tours    service.TourService
	events   service.EventService
	ai       ai.AIService
	agent    *service.AIAgent
	telegram repository.TelegramRepository
}

// NewBotService builds a BotService. With an empty token the api is left nil and the
// bot is effectively disabled (HandleUpdate/SendMessage become no-ops at impl time).
func NewBotService(
	token string,
	mode string,
	allowedUserID int64,
	tours service.TourService,
	events service.EventService,
	aiClient ai.AIService,
	agent *service.AIAgent,
	telegram repository.TelegramRepository,
) (BotService, error) {
	var api *tgbotapi.BotAPI
	if token != "" {
		var err error
		api, err = tgbotapi.NewBotAPI(token)
		if err != nil {
			return nil, err
		}
	}
	return &botService{
		api:           api,
		mode:          mode,
		allowedUserID: allowedUserID,
		tours:         tours,
		events:        events,
		ai:            aiClient,
		agent:         agent,
		telegram:      telegram,
	}, nil
}
