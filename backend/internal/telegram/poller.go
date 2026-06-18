package telegram

import (
	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// StartPolling runs the long-polling loop, feeding every update into HandleUpdate.
// Used when TELEGRAM_MODE=polling. No-op if the bot is disabled (nil api).
func (b *botService) StartPolling() {
	if b.api == nil {
		return
	}
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60
	updates := b.api.GetUpdatesChan(u)
	for update := range updates {
		b.HandleUpdate(update)
	}
}
