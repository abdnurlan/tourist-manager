package telegram

import (
	"encoding/json"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
)

// ParseUpdate decodes a raw Telegram Update JSON body (from POST /api/telegram/webhook).
func ParseUpdate(body []byte) (tgbotapi.Update, error) {
	var update tgbotapi.Update
	err := json.Unmarshal(body, &update)
	return update, err
}
