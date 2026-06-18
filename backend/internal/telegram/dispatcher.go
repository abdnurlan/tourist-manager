package telegram

import (
	"context"
	"encoding/json"
	"strings"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/models"
)

// notAllowedReply is the polite Azerbaijani rejection (CONTRACT.md §5 / §10.1).
const notAllowedReply = "Bu bota yalnız sahib istifadə edə bilər."

// HandleUpdate is the shared entry point for both webhook and polling paths. It
// enforces the allowed user, logs the inbound message, then routes to a command,
// free-text or voice handler (CONTRACT.md §10.5).
func (b *botService) HandleUpdate(update tgbotapi.Update) {
	msg := update.Message
	if msg == nil {
		// MVP handles only plain messages (text/voice/command). Other update kinds
		// (edited messages, callbacks, etc.) are ignored.
		return
	}

	var userID int64
	if msg.From != nil {
		userID = msg.From.ID
	}
	chatID := msg.Chat.ID

	// Determine inbound kind for logging.
	kind := inboundKind(msg)

	// Always log the inbound update (even from disallowed users) for the AI history.
	b.logInbound(userID, kind, inboundContent(msg), update)

	// Allowed-user enforcement (CONTRACT.md §10.1): reject everyone else politely.
	if !b.IsAllowed(userID) {
		_ = b.SendMessage(chatID, notAllowedReply)
		return
	}

	// Commands.
	if msg.IsCommand() {
		b.dispatchCommand(chatID, msg.Command())
		return
	}

	// Voice → [PLACEHOLDER] Whisper transcription → AI → intent pipeline.
	if msg.Voice != nil {
		b.handleVoice(chatID, userID, msg)
		return
	}

	// Free text → AI → intent pipeline.
	text := strings.TrimSpace(msg.Text)
	if text == "" {
		_ = b.SendMessage(chatID, "Mesajınızı başa düşmədim. /help yazaraq mümkün əmrlərə baxa bilərsiniz.")
		return
	}
	b.handleFreeText(chatID, text)
}

// dispatchCommand routes a slash command to its handler (CONTRACT.md §10.3).
func (b *botService) dispatchCommand(chatID int64, command string) {
	switch command {
	case "start":
		_ = b.HandleStart(chatID)
	case "help":
		_ = b.HandleHelp(chatID)
	case "today":
		_ = b.HandleToday(chatID)
	case "tomorrow":
		_ = b.HandleTomorrow(chatID)
	case "tours":
		_ = b.HandleTours(chatID)
	case "active":
		_ = b.HandleActive(chatID)
	default:
		_ = b.SendMessage(chatID, "Naməlum əmr. /help yazaraq mümkün əmrlərə baxa bilərsiniz.")
	}
}

// handleVoice runs the voice pipeline: [PLACEHOLDER] transcription → free text route.
func (b *botService) handleVoice(chatID, userID int64, msg *tgbotapi.Message) {
	ctx := context.Background()
	transcript, err := b.ai.Transcribe(ctx, msg.Voice.FileID)
	if err != nil || strings.TrimSpace(transcript) == "" {
		_ = b.SendMessage(chatID, "Səs mesajını emal edə bilmədim. Zəhmət olmasa mətn şəklində yazın.")
		return
	}
	// Persist the transcript onto the inbound voice message for the AI history.
	b.logTranscript(userID, transcript)
	b.handleFreeText(chatID, transcript)
}

// handleFreeText runs text through the AI service then the intent/action pipeline.
func (b *botService) handleFreeText(chatID int64, text string) {
	ctx := context.Background()
	reply, intent, err := b.ai.Chat(ctx, text)
	if err != nil {
		_ = b.SendMessage(chatID, "Xəta baş verdi. Bir az sonra yenidən cəhd edin.")
		return
	}

	// Intent-driven action pipeline. For data-fetch intents we answer with live DB
	// data; for mutating intents (create_tour/add_event/...) we ask a clarification
	// question — we NEVER guess (CONTRACT.md §10.5). The action path is fully wired
	// so a real LLM extractor can fill structured args later with no caller change.
	if handled := b.executeIntent(chatID, intent, text); handled {
		return
	}

	// Fallback: deliver the AI (placeholder) reply.
	_ = b.SendMessage(chatID, reply)
}

// executeIntent performs the backend action (or asks a clarification) for a detected
// intent. Returns true when it produced a reply. Mutating intents are CLEARLY-MARKED
// placeholders: they acknowledge in Azerbaijani and ask for the missing details
// rather than guessing. Any event/tour the bot creates here is tagged source=telegram.
func (b *botService) executeIntent(chatID int64, intent, _ string) bool {
	switch intent {
	case ai.IntentTodayPlan:
		_ = b.HandleToday(chatID)
		return true
	case ai.IntentTomorrowPlan:
		_ = b.HandleTomorrow(chatID)
		return true
	case ai.IntentListTours, ai.IntentShowTourProgram:
		_ = b.HandleTours(chatID)
		return true
	case ai.IntentListActive:
		_ = b.HandleActive(chatID)
		return true
	case ai.IntentCreateTour:
		// [PLACEHOLDER] clarification — never guess (CONTRACT.md §10.5).
		// A real pipeline extracts {title, start_date, end_date} then calls
		// b.tours.Create(...) and an event would get source="telegram".
		_ = b.SendMessage(chatID, "Yeni tur yaratmaq üçün turun adını, başlama və bitmə tarixini yazın (məsələn: «18-22 iyun Bakı turu»).")
		return true
	case ai.IntentAddEvent:
		// [PLACEHOLDER] clarification — ask which tour + details before creating.
		// On confirmation a real pipeline calls b.events.Create(tourID, EventInput{
		//   ..., Source: ptr("telegram")}) wiring the source=telegram path.
		_ = b.SendMessage(chatID, "Eventi hansı tura əlavə edək? Zəhmət olmasa tur adını, tarixi və saatı yazın.")
		return true
	case ai.IntentSetEventPrice:
		_ = b.SendMessage(chatID, "Hansı eventin qiymətini yeniləyək? Event adını və ya tarixini dəqiqləşdirin.")
		return true
	case ai.IntentFindEvent, ai.IntentFilterEvents:
		_ = b.SendMessage(chatID, "Hansı eventi axtarırsınız? Açar söz və ya tarix yazın.")
		return true
	default:
		return false
	}
}

// --- Logging helpers (telegram_messages, CONTRACT.md §10.4) ---

// logInbound persists an inbound update (best-effort; never blocks the flow).
func (b *botService) logInbound(userID int64, kind, content string, update tgbotapi.Update) {
	var raw json.RawMessage
	if data, err := json.Marshal(update); err == nil {
		raw = data
	}
	rec := &models.TelegramMessage{
		TelegramUserID: userID,
		Direction:      "in",
		Kind:           kind,
		RawJSON:        raw,
	}
	if content != "" {
		rec.Content = &content
	}
	_ = b.telegram.Create(rec)
}

// logOutbound persists an outbound bot reply (best-effort).
func (b *botService) logOutbound(userID int64, text string) {
	content := text
	_ = b.telegram.Create(&models.TelegramMessage{
		TelegramUserID: userID,
		Direction:      "out",
		Kind:           "text",
		Content:        &content,
	})
}

// logTranscript records a voice transcription as an inbound message for the history.
func (b *botService) logTranscript(userID int64, transcript string) {
	t := transcript
	_ = b.telegram.Create(&models.TelegramMessage{
		TelegramUserID: userID,
		Direction:      "in",
		Kind:           "voice",
		Transcript:     &t,
	})
}

// inboundKind classifies a message for the tg_kind column.
func inboundKind(msg *tgbotapi.Message) string {
	switch {
	case msg.IsCommand():
		return "command"
	case msg.Voice != nil:
		return "voice"
	case len(msg.Photo) > 0:
		return "photo"
	case msg.Document != nil:
		return "document"
	default:
		return "text"
	}
}

// inboundContent extracts loggable text from a message (empty for non-text kinds).
func inboundContent(msg *tgbotapi.Message) string {
	if t := strings.TrimSpace(msg.Text); t != "" {
		return t
	}
	if c := strings.TrimSpace(msg.Caption); c != "" {
		return c
	}
	return ""
}
