package apperror

import "net/http"

// FieldError describes a single field-level validation failure.
type FieldError struct {
	Field   string `json:"field"`
	Message string `json:"message"`
}

// AppError is a structured error carrying an HTTP status, a stable code and an
// Azerbaijani user-facing message. It satisfies the error interface.
type AppError struct {
	Status  int          `json:"-"`
	Code    string       `json:"code"`
	Message string       `json:"message"`
	Fields  []FieldError `json:"fields,omitempty"`
}

func (e *AppError) Error() string { return e.Code + ": " + e.Message }

// New builds an AppError.
func New(status int, code, message string) *AppError {
	return &AppError{Status: status, Code: code, Message: message}
}

// WithFields attaches field-level validation details.
func (e *AppError) WithFields(fields []FieldError) *AppError {
	e.Fields = fields
	return e
}

// Predefined errors matching CONTRACT.md §5. Each is a constructor so callers get
// a fresh instance (safe to mutate with WithFields).
func ValidationError() *AppError {
	return New(http.StatusBadRequest, "VALIDATION_ERROR", "Daxil edilən məlumat yanlışdır.")
}

func BadRequest() *AppError {
	return New(http.StatusBadRequest, "BAD_REQUEST", "Sorğu yanlışdır.")
}

func Unauthorized() *AppError {
	return New(http.StatusUnauthorized, "UNAUTHORIZED", "Giriş tələb olunur.")
}

func InvalidCredentials() *AppError {
	return New(http.StatusUnauthorized, "INVALID_CREDENTIALS", "İstifadəçi adı və ya şifrə yanlışdır.")
}

func TokenExpired() *AppError {
	return New(http.StatusUnauthorized, "TOKEN_EXPIRED", "Sessiyanın vaxtı bitib. Yenidən daxil olun.")
}

func Forbidden() *AppError {
	return New(http.StatusForbidden, "FORBIDDEN", "Bu əməliyyata icazəniz yoxdur.")
}

func TelegramNotAllowed() *AppError {
	return New(http.StatusForbidden, "TELEGRAM_NOT_ALLOWED", "Bu bota yalnız sahib istifadə edə bilər.")
}

func NotFound() *AppError {
	return New(http.StatusNotFound, "NOT_FOUND", "Tapılmadı.")
}

func TourNotFound() *AppError {
	return New(http.StatusNotFound, "TOUR_NOT_FOUND", "Tur tapılmadı.")
}

func EventNotFound() *AppError {
	return New(http.StatusNotFound, "EVENT_NOT_FOUND", "Event tapılmadı.")
}

func CatalogTourNotFound() *AppError {
	return New(http.StatusNotFound, "CATALOG_TOUR_NOT_FOUND", "Tur tapılmadı.")
}

func BookingNotFound() *AppError {
	return New(http.StatusNotFound, "BOOKING_NOT_FOUND", "Rezervasiya tapılmadı.")
}

func Conflict() *AppError {
	return New(http.StatusConflict, "CONFLICT", "Məlumat artıq mövcuddur.")
}

func DepartureNotFound() *AppError {
	return New(http.StatusNotFound, "DEPARTURE_NOT_FOUND", "Tarix tapılmadı.")
}

func DepartureFull() *AppError {
	return New(http.StatusConflict, "DEPARTURE_FULL", "Bu tarix üçün yer qalmayıb.")
}

func Unprocessable() *AppError {
	return New(http.StatusUnprocessableEntity, "UNPROCESSABLE", "Məlumat emal edilə bilmədi.")
}

func Internal() *AppError {
	return New(http.StatusInternalServerError, "INTERNAL_ERROR", "Daxili xəta baş verdi. Bir az sonra yenidən cəhd edin.")
}
