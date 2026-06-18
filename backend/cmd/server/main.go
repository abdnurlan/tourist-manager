package main

import (
	"log"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/config"
	"tourist-manager/backend/internal/database"
	"tourist-manager/backend/internal/handler"
	"tourist-manager/backend/internal/repository"
	"tourist-manager/backend/internal/router"
	"tourist-manager/backend/internal/service"
	"tourist-manager/backend/internal/telegram"
)

func main() {
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
	reminderRepo := repository.NewReminderRepository(db)
	telegramRepo := repository.NewTelegramRepository(db)

	// 6. AI client (boundary).
	aiClient := ai.NewAIService(cfg.OpenAIAPIKey)

	// 7. Services.
	authSvc := service.NewAuthService(userRepo, cfg.JWTSecret)
	tourSvc := service.NewTourService(tourRepo, eventRepo)
	eventSvc := service.NewEventService(eventRepo, tourRepo)
	dashboardSvc := service.NewDashboardService(tourRepo, eventRepo, reminderRepo, telegramRepo, cfg.TelegramMode, cfg.TelegramAllowedUserID != 0)
	calendarSvc := service.NewCalendarService(eventRepo, tourRepo)
	searchSvc := service.NewSearchService(tourRepo, eventRepo)
	aiSvc := service.NewAIService(aiClient, telegramRepo)

	// 8. Telegram bot.
	bot, err := telegram.NewBotService(
		cfg.TelegramBotToken,
		cfg.TelegramMode,
		cfg.TelegramAllowedUserID,
		tourSvc,
		eventSvc,
		aiClient,
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
