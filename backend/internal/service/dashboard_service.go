package service

import (
	"time"

	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/pkg/apperror"
)

// upcomingEventsCap limits the dashboard upcoming-events list (CONTRACT.md §6.2).
const upcomingEventsCap = 10

// ActivityItem is a recent-activity feed entry (CONTRACT.md §6.2).
type ActivityItem struct {
	ID        string `json:"id"`
	Kind      string `json:"kind"` // event_created|event_updated|tour_created|telegram_message|ai_message
	Source    string `json:"source"`
	Title     string `json:"title"`
	RefID     string `json:"ref_id"`
	CreatedAt string `json:"created_at"`
}

// TelegramStatus describes bot connectivity for the dashboard.
type TelegramStatus struct {
	Connected             bool    `json:"connected"`
	Mode                  string  `json:"mode"`
	AllowedUserConfigured bool    `json:"allowed_user_configured"`
	LastMessageAt         *string `json:"last_message_at"`
}

// Weather is an always-unavailable placeholder for MVP.
type Weather struct {
	Available bool    `json:"available"`
	Location  string  `json:"location"`
	TempC     *int    `json:"temp_c"`
	Condition *string `json:"condition"`
	Note      string  `json:"note"`
}

// Dashboard is the composite dashboard payload (CONTRACT.md §6.2).
type Dashboard struct {
	TodayEvents        []models.Event    `json:"today_events"`
	UpcomingEvents     []models.Event    `json:"upcoming_events"`
	UpcomingTours      []models.Tour     `json:"upcoming_tours"`
	ActiveTours        []models.Tour     `json:"active_tours"`
	TotalActiveTours   int64             `json:"total_active_tours"`
	EventsWaitingToday int64             `json:"events_waiting_today"`
	TodayReminders     []models.Reminder `json:"today_reminders"`
	RecentActivity     []ActivityItem    `json:"recent_activity"`
	TelegramStatus     TelegramStatus    `json:"telegram_status"`
	Weather            Weather           `json:"weather"`
}

// DashboardService aggregates the dashboard composite.
type DashboardService interface {
	Get() (*Dashboard, error)
}

type dashboardService struct {
	tours                  repository.TourRepository
	events                 repository.EventRepository
	reminders              repository.ReminderRepository
	telegram               repository.TelegramRepository
	telegramMode           string
	telegramUserConfigured bool
}

// NewDashboardService builds a DashboardService.
func NewDashboardService(
	tours repository.TourRepository,
	events repository.EventRepository,
	reminders repository.ReminderRepository,
	telegram repository.TelegramRepository,
	telegramMode string,
	telegramUserConfigured bool,
) DashboardService {
	return &dashboardService{
		tours:                  tours,
		events:                 events,
		reminders:              reminders,
		telegram:               telegram,
		telegramMode:           telegramMode,
		telegramUserConfigured: telegramUserConfigured,
	}
}

func (s *dashboardService) Get() (*Dashboard, error) {
	now := time.Now()
	today := now.Format("2006-01-02")

	// Today's events (ordered by time via repo).
	todayEvents, err := s.events.List(repository.EventFilter{Date: today})
	if err != nil {
		return nil, apperror.Internal()
	}

	// Upcoming events: date > today, soonest first, capped.
	future, err := s.events.List(repository.EventFilter{From: nextDay(today)})
	if err != nil {
		return nil, apperror.Internal()
	}
	upcomingEvents := future
	if len(upcomingEvents) > upcomingEventsCap {
		upcomingEvents = upcomingEvents[:upcomingEventsCap]
	}

	// Tours: list all once, then partition.
	allTours, err := s.tours.List(repository.TourFilter{})
	if err != nil {
		return nil, apperror.Internal()
	}
	activeTours := make([]models.Tour, 0)
	upcomingTours := make([]models.Tour, 0)
	for i := range allTours {
		t := &allTours[i]
		if n, e := s.tours.EventsCount(t.ID); e == nil {
			t.EventsCount = n
		}
		switch {
		case t.Status == "active":
			activeTours = append(activeTours, *t)
		case t.StartDate >= today && t.Status == "planned":
			upcomingTours = append(upcomingTours, *t)
		}
	}
	// Upcoming tours soonest first (allTours arrives start_date DESC).
	sortToursByStartAsc(upcomingTours)

	totalActive, err := s.tours.CountByStatus("active")
	if err != nil {
		return nil, apperror.Internal()
	}

	waitingToday, err := s.events.CountByDateStatus(today, "planned")
	if err != nil {
		return nil, apperror.Internal()
	}

	// Today's reminders: remind_at within [00:00, 23:59:59] of today (UTC).
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, time.UTC)
	dayEnd := dayStart.Add(24*time.Hour - time.Second)
	reminders, err := s.reminders.DueBetween(dayStart.Format(time.RFC3339), dayEnd.Format(time.RFC3339))
	if err != nil {
		return nil, apperror.Internal()
	}
	if reminders == nil {
		reminders = make([]models.Reminder, 0)
	}

	// Recent activity: derive from recent telegram messages and recent events.
	recent := s.recentActivity()

	// Telegram status (placeholder-ish, derived from logged messages).
	tgStatus := TelegramStatus{
		Connected:             false,
		Mode:                  s.telegramMode,
		AllowedUserConfigured: s.telegramUserConfigured,
	}
	if last, e := s.telegram.LastMessageAt(); e == nil && last != nil {
		tgStatus.Connected = true
		ts := last.CreatedAt.UTC().Format(time.RFC3339)
		tgStatus.LastMessageAt = &ts
	}

	dash := &Dashboard{
		TodayEvents:        todayEvents,
		UpcomingEvents:     upcomingEvents,
		UpcomingTours:      upcomingTours,
		ActiveTours:        activeTours,
		TotalActiveTours:   totalActive,
		EventsWaitingToday: waitingToday,
		TodayReminders:     reminders,
		RecentActivity:     recent,
		TelegramStatus:     tgStatus,
		Weather: Weather{
			Available: false,
			Location:  "Bakı",
			Note:      "Hava məlumatı tezliklə əlavə olunacaq.",
		},
	}
	return dash, nil
}

// recentActivity builds a small feed from recent telegram messages.
func (s *dashboardService) recentActivity() []ActivityItem {
	items := make([]ActivityItem, 0)
	msgs, err := s.telegram.History(10)
	if err != nil {
		return items
	}
	for _, m := range msgs {
		kind := "telegram_message"
		title := "Telegram mesajı"
		// Source must be an event_source value ("manual"|"telegram"|"ai").
		source := "telegram"
		if m.TelegramUserID == 0 {
			kind = "ai_message"
			title = "AI mesajı"
			source = "ai"
		}
		items = append(items, ActivityItem{
			ID:        m.ID,
			Kind:      kind,
			Source:    source,
			Title:     title,
			RefID:     m.ID,
			CreatedAt: m.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	return items
}

// nextDay returns the YYYY-MM-DD string for the day after the given date.
func nextDay(date string) string {
	t, err := time.Parse("2006-01-02", date)
	if err != nil {
		return date
	}
	return t.AddDate(0, 0, 1).Format("2006-01-02")
}

// sortToursByStartAsc orders tours by start_date ascending (soonest first).
func sortToursByStartAsc(tours []models.Tour) {
	for i := 1; i < len(tours); i++ {
		for j := i; j > 0 && tours[j].StartDate < tours[j-1].StartDate; j-- {
			tours[j], tours[j-1] = tours[j-1], tours[j]
		}
	}
}
