package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/config"
	"tourist-manager/backend/internal/database"
	"tourist-manager/backend/internal/handler"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/router"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/internal/telegram"
)

// runHealthcheck is invoked as `server healthcheck` by Docker's HEALTHCHECK.
// The distroless runtime image has no shell/curl, so the binary checks itself.
func runHealthcheck() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/api/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		os.Exit(1)
	}
	os.Exit(0)
}

func main() {
	// Healthcheck alt-əmri (Docker HEALTHCHECK üçün) — ağır init-dən əvvəl.
	if len(os.Args) > 1 && os.Args[1] == "healthcheck" {
		runHealthcheck()
		return
	}

	// 1. Config.
	cfg := config.Load()

	// 2. Database.
	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("database connect: %v", err)
	}

	// 3. Migrate (enums + AutoMigrate all six tables).
	if err := database.Migrate(db); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	// 4. Seed admin (bcrypt).
	if err := database.SeedAdmin(db, cfg.AdminUsername, cfg.AdminPassword); err != nil {
		log.Fatalf("seed admin: %v", err)
	}

	// 5. Repositories.
	userRepo := repository.NewUserRepository(db)
	tourRepo := repository.NewTourRepository(db)
	eventRepo := repository.NewEventRepository(db)
	guestRepo := repository.NewGuestRepository(db)
	reminderRepo := repository.NewReminderRepository(db)
	telegramRepo := repository.NewTelegramRepository(db)

	// 6. AI client (boundary).
	aiClient := ai.NewAIService(cfg.OpenAIAPIKey)

	// 7. Services.
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	tourSvc := service.NewTourService(tourRepo, eventRepo)
	eventSvc := service.NewEventService(eventRepo, tourRepo)
	guestSvc := service.NewGuestService(guestRepo, tourRepo)
	dashboardSvc := service.NewDashboardService(tourRepo, eventRepo, reminderRepo, telegramRepo, cfg.TelegramMode, cfg.TelegramAllowedUserID != 0)
	calendarSvc := service.NewCalendarService(eventRepo, tourRepo)
	searchSvc := service.NewSearchService(tourRepo, eventRepo)

	// AI agent: tool-calling assistant shared by the web chat and the Telegram bot.
	agent := service.NewAIAgent(aiClient, tourSvc, eventSvc, tourRepo, eventRepo, telegramRepo)
	aiSvc := service.NewAIService(agent, telegramRepo)

	// 8. Telegram bot.
	bot, err := telegram.NewBotService(
		cfg.TelegramBotToken,
		cfg.TelegramMode,
		cfg.TelegramAllowedUserID,
		tourSvc,
		eventSvc,
		aiClient,
		agent,
		telegramRepo,
	)
	if err != nil {
		log.Printf("telegram bot init failed (continuing without bot): %v", err)
	}

	// 9. Handlers.
	handlers := router.Handlers{
		Auth:      handler.NewAuthHandler(authSvc),
		Dashboard: handler.NewDashboardHandler(dashboardSvc),
		Tour:      handler.NewTourHandler(tourSvc),
		Event:     handler.NewEventHandler(eventSvc),
		Guest:     handler.NewGuestHandler(guestSvc),
		Calendar:  handler.NewCalendarHandler(calendarSvc),
		Search:    handler.NewSearchHandler(searchSvc),
		AI:        handler.NewAIHandler(aiSvc),
		Telegram:  handler.NewTelegramHandler(bot),
	}

	// 10. Router.
	app := router.New(cfg, handlers)

	// 11. Optional Telegram polling goroutine.
	if bot != nil && cfg.TelegramMode == "polling" {
		go bot.StartPolling()
	}

	// 12. Listen.
	addr := ":" + cfg.Port
	log.Printf("Tur Planlayıcı backend listening on %s", addr)
	if err := app.Listen(addr); err != nil {
		log.Fatalf("listen: %v", err)
	}
}
