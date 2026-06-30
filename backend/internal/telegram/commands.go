package telegram

import (
	"fmt"
	"strings"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
)

// Command handlers query the real DB and reply in Azerbaijani (CONTRACT.md §10.3).

// bakuLocation is the guide's display timezone (UTC+4). Falls back to a fixed zone if
// the system tz database is unavailable.
var bakuLocation = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Baku")
	if err != nil {
		return time.FixedZone("AZT", 4*60*60)
	}
	return loc
}()

// azMonths maps a 1-based month to its Azerbaijani name (CONTRACT.md §9.17).
var azMonths = [...]string{
	"", "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun",
	"İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr",
}

// azTourStatus maps tour_status to its Azerbaijani label (CONTRACT.md §9.14).
var azTourStatus = map[string]string{
	"planned": "Planlaşdırılıb", "active": "Aktiv",
	"completed": "Tamamlanıb", "cancelled": "Ləğv edilib",
}

// azEventType maps event_type to its Azerbaijani label (CONTRACT.md §9.12).
var azEventType = map[string]string{
	"transfer": "Transfer", "hotel": "Otel", "restaurant": "Restoran",
	"tour": "Tur", "flight": "Uçuş", "note": "Qeyd", "other": "Digər",
}

// today returns the guide-local date as YYYY-MM-DD.
func today() string { return time.Now().In(bakuLocation).Format("2006-01-02") }

// tomorrow returns the guide-local date + 1 day as YYYY-MM-DD.
func tomorrow() string {
	return time.Now().In(bakuLocation).AddDate(0, 0, 1).Format("2006-01-02")
}

// formatDate renders YYYY-MM-DD as "18 İyun" in Azerbaijani.
func formatDate(d string) string {
	t, err := time.Parse("2006-01-02", d)
	if err != nil {
		return d
	}
	return fmt.Sprintf("%d %s", t.Day(), azMonths[int(t.Month())])
}

// SendMessage sends an Azerbaijani text reply and logs it (direction=out).
func (b *botService) SendMessage(chatID int64, text string) error {
	// Always log the outbound message so the web AI history reflects bot replies.
	b.logOutbound(chatID, text)

	if b.api == nil {
		return nil
	}
	msg := tgbotapi.NewMessage(chatID, text)
	_, err := b.api.Send(msg)
	return err
}

// HandleStart → welcome + short capability list.
func (b *botService) HandleStart(chatID int64) error {
	text := strings.Join([]string{
		"Salam! Mən sizin şəxsi tur planlayıcı köməkçinizəm. 🧭",
		"",
		"Mən sizə kömək edə bilərəm:",
		"• Bugünkü və sabahkı planınızı göstərmək",
		"• Turlarınızı və aktiv turları siyahılamaq",
		"• Mesaj və ya səs vasitəsilə suallarınıza cavab vermək",
		"",
		"Əmrlərin siyahısı üçün /help yazın.",
	}, "\n")
	return b.SendMessage(chatID, text)
}

// HandleHelp → list of commands + free-text examples.
func (b *botService) HandleHelp(chatID int64) error {
	text := strings.Join([]string{
		"📋 Mövcud əmrlər:",
		"/start — Başlanğıc və imkanlar",
		"/help — Bu kömək mətni",
		"/today — Bugünkü plan",
		"/tomorrow — Sabahkı plan",
		"/tours — Bütün turlar",
		"/active — Aktiv turlar",
		"",
		"Sərbəst mətn nümunələri:",
		"• «Bu gün planım nədir?»",
		"• «Sabah nə işlərim var?»",
		"• «Bakı turunun proqramını göstər.»",
		"",
		"Səs mesajı da göndərə bilərsiniz. 🎙",
	}, "\n")
	return b.SendMessage(chatID, text)
}

// HandleToday → today's events ordered by time ("Bugünkü plan").
func (b *botService) HandleToday(chatID int64) error {
	return b.sendDayPlan(chatID, "Bugünkü plan", today())
}

// HandleTomorrow → tomorrow's events ("Sabahkı plan").
func (b *botService) HandleTomorrow(chatID int64) error {
	return b.sendDayPlan(chatID, "Sabahkı plan", tomorrow())
}

// sendDayPlan lists events for a specific date, ordered by time, in Azerbaijani.
func (b *botService) sendDayPlan(chatID int64, heading, date string) error {
	events, err := b.events.ListByDate(date)
	if err != nil {
		return b.SendMessage(chatID, "Məlumat alınarkən xəta baş verdi. Bir az sonra yenidən cəhd edin.")
	}
	if len(events) == 0 {
		return b.SendMessage(chatID, fmt.Sprintf("📅 %s (%s)\n\nBu tarix üçün tədbiriniz yoxdur. Dincəlin! 😌", heading, formatDate(date)))
	}

	var sb strings.Builder
	fmt.Fprintf(&sb, "📅 %s (%s)\n", heading, formatDate(date))
	for _, e := range events {
		sb.WriteString("\n• ")
		if e.Time != nil && *e.Time != "" {
			fmt.Fprintf(&sb, "%s — ", *e.Time)
		}
		sb.WriteString(e.Title)
		if label, ok := azEventType[e.Type]; ok {
			fmt.Fprintf(&sb, " (%s)", label)
		}
		if e.Location != nil && *e.Location != "" {
			fmt.Fprintf(&sb, "\n  📍 %s", *e.Location)
		}
	}
	return b.SendMessage(chatID, sb.String())
}

// HandleTours → all tours with status + date range.
func (b *botService) HandleTours(chatID int64) error {
	tours, err := b.tours.List(repository.TourFilter{})
	if err != nil {
		return b.SendMessage(chatID, "Məlumat alınarkən xəta baş verdi. Bir az sonra yenidən cəhd edin.")
	}
	if len(tours) == 0 {
		return b.SendMessage(chatID, "Hələ turunuz yoxdur. İlk turunuzu yaradın. 🗺")
	}
	return b.SendMessage(chatID, formatTourList("🗺 Turlar", tours))
}

// HandleActive → active tours only.
func (b *botService) HandleActive(chatID int64) error {
	tours, err := b.tours.List(repository.TourFilter{Status: "active"})
	if err != nil {
		return b.SendMessage(chatID, "Məlumat alınarkən xəta baş verdi. Bir az sonra yenidən cəhd edin.")
	}
	if len(tours) == 0 {
		return b.SendMessage(chatID, "Hazırda aktiv tur yoxdur. ✅")
	}
	return b.SendMessage(chatID, formatTourList("✅ Aktiv turlar", tours))
}

// formatTourList renders tours with their Azerbaijani status + date range.
func formatTourList(heading string, tours []models.Tour) string {
	var sb strings.Builder
	sb.WriteString(heading)
	for _, t := range tours {
		status := azTourStatus[t.Status]
		if status == "" {
			status = t.Status
		}
		fmt.Fprintf(&sb, "\n\n• %s\n  %s — %s\n  Status: %s",
			t.Title, formatDate(t.StartDate), formatDate(t.EndDate), status)
	}
	return sb.String()
}
