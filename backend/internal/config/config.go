package config

import (
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all environment-driven configuration for the backend.
// Every variable from backend/.env.example is represented here.
type Config struct {
	// Server
	Port        string
	CORSOrigins []string

	// Database
	DatabaseURL string

	// Auth / JWT
	JWTSecret     string
	AdminUsername string
	AdminPassword string

	// OpenAI
	OpenAIAPIKey string

	// Telegram
	TelegramMode          string // "webhook" | "polling"
	TelegramBotToken      string
	TelegramAllowedUserID int64

	// Uploads — directory where uploaded images are stored on disk.
	UploadDir string
	// PublicBaseURL is the backend's externally reachable origin (no trailing
	// slash), used to build absolute URLs for uploaded files so both frontends
	// can load them regardless of their own origin. Empty → fall back to the
	// request's own scheme+host.
	PublicBaseURL string
}

// Load reads configuration from the environment (loading backend/.env if present)
// and returns a populated Config. Missing optional values fall back to sane defaults.
func Load() *Config {
	// Best-effort: .env is optional (e.g. in docker the env is injected directly).
	_ = godotenv.Load()

	cfg := &Config{
		Port:                  getEnv("PORT", "8080"),
		CORSOrigins:           splitAndTrim(getEnv("CORS_ORIGINS", "http://localhost:3000")),
		DatabaseURL:           getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/tourist_manager?sslmode=disable"),
		JWTSecret:             getEnv("JWT_SECRET", "change-me"),
		AdminUsername:         getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword:         getEnv("ADMIN_PASSWORD", "admin123"),
		OpenAIAPIKey:          getEnv("OPENAI_API_KEY", ""),
		TelegramMode:          getEnv("TELEGRAM_MODE", "polling"),
		TelegramBotToken:      getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramAllowedUserID: getEnvInt64("TELEGRAM_ALLOWED_USER_ID", 0),
		UploadDir:             getEnv("UPLOAD_DIR", "./uploads"),
		PublicBaseURL:         strings.TrimRight(getEnv("PUBLIC_BASE_URL", ""), "/"),
	}

	return cfg
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}
	return fallback
}

func getEnvInt64(key string, fallback int64) int64 {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		if n, err := strconv.ParseInt(strings.TrimSpace(v), 10, 64); err == nil {
			return n
		}
	}
	return fallback
}

func splitAndTrim(s string) []string {
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if t := strings.TrimSpace(p); t != "" {
			out = append(out, t)
		}
	}
	return out
}
