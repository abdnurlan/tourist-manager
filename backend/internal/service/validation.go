package service

import (
	"strings"
	"time"

	"tourist-manager/backend/pkg/apperror"
)

// validTourStatuses / validEventTypes / etc. mirror CONTRACT.md §4.1 enum values.
var validTourStatuses = map[string]bool{
	"planned": true, "active": true, "completed": true, "cancelled": true,
}

var validEventTypes = map[string]bool{
	"transfer": true, "hotel": true, "restaurant": true, "tour": true,
	"flight": true, "note": true, "other": true,
}

var validEventStatuses = map[string]bool{
	"planned": true, "done": true, "cancelled": true,
}

var validPaymentStatuses = map[string]bool{
	"unpaid": true, "partial": true, "paid": true,
}

var validEventSources = map[string]bool{
	"manual": true, "telegram": true, "ai": true,
}

// isValidDate reports whether s is a YYYY-MM-DD date.
func isValidDate(s string) bool {
	_, err := time.Parse("2006-01-02", s)
	return err == nil
}

// isValidTime reports whether s is an HH:mm 24-hour time.
func isValidTime(s string) bool {
	_, err := time.Parse("15:04", s)
	return err == nil
}

// trimPtr returns the trimmed string value of a *string, or "" if nil.
func trimPtr(p *string) string {
	if p == nil {
		return ""
	}
	return strings.TrimSpace(*p)
}

// validationError builds a VALIDATION_ERROR carrying field-level details.
func validationError(fields []apperror.FieldError) *apperror.AppError {
	return apperror.ValidationError().WithFields(fields)
}
