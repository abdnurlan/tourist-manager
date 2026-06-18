package ai

import (
	"context"
	"strings"
)

// Known intent labels (CONTRACT.md §10.5).
const (
	IntentCreateTour      = "create_tour"
	IntentAddEvent        = "add_event"
	IntentTodayPlan       = "today_plan"
	IntentTomorrowPlan    = "tomorrow_plan"
	IntentListTours       = "list_tours"
	IntentListActive      = "list_active"
	IntentFilterEvents    = "filter_events"
	IntentShowTourProgram = "show_tour_program"
	IntentFindEvent       = "find_event"
	IntentSetEventPrice   = "set_event_price"
	IntentUnknown         = "unknown"
)

// DetectIntent is a [PLACEHOLDER] keyword matcher. It lives behind the AIService
// interface so it can be swapped for an LLM later with no caller change. The order of
// checks matters: more specific phrases are tested before broad ones.
func (s *service) DetectIntent(ctx context.Context, text string) (string, error) {
	_ = ctx
	t := strings.ToLower(strings.TrimSpace(text))
	switch {
	case t == "":
		return IntentUnknown, nil
	case (strings.Contains(t, "tur") && strings.Contains(t, "yarat")) || strings.Contains(t, "yeni tur"):
		return IntentCreateTour, nil
	case strings.Contains(t, "proqram"):
		return IntentShowTourProgram, nil
	case strings.Contains(t, "qiymət") || strings.Contains(t, "manat") || strings.Contains(t, "azn"):
		return IntentSetEventPrice, nil
	case strings.Contains(t, "harda") || strings.Contains(t, "harada") || strings.Contains(t, "tap"):
		return IntentFindEvent, nil
	case strings.Contains(t, "əlavə et") || strings.Contains(t, "elave et"):
		return IntentAddEvent, nil
	case strings.Contains(t, "sabah"):
		return IntentTomorrowPlan, nil
	case strings.Contains(t, "bu gün") || strings.Contains(t, "bugün") || strings.Contains(t, "bu gun"):
		return IntentTodayPlan, nil
	case strings.Contains(t, "aktiv"):
		return IntentListActive, nil
	case strings.Contains(t, "restoran") || strings.Contains(t, "transfer") || strings.Contains(t, "otel") || strings.Contains(t, "uçuş"):
		return IntentFilterEvents, nil
	case strings.Contains(t, "turlar") || strings.Contains(t, "tur"):
		return IntentListTours, nil
	default:
		return IntentUnknown, nil
	}
}
