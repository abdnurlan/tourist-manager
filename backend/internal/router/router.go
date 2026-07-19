package router

import (
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/recover"

	"tourist-manager/backend/internal/config"
	"tourist-manager/backend/internal/handler"
	"tourist-manager/backend/internal/middleware"
)

// Handlers bundles every endpoint handler for registration.
type Handlers struct {
	Auth        *handler.AuthHandler
	Dashboard   *handler.DashboardHandler
	Tour        *handler.TourHandler
	Event       *handler.EventHandler
	Guest       *handler.GuestHandler
	Calendar    *handler.CalendarHandler
	Search      *handler.SearchHandler
	AI          *handler.AIHandler
	Telegram    *handler.TelegramHandler
	CatalogTour *handler.CatalogTourHandler
	Booking     *handler.BookingHandler
	Upload      *handler.UploadHandler
}

// New builds the Fiber app, mounts global middleware, and registers every route
// from CONTRACT.md §6 under /api.
func New(cfg *config.Config, h Handlers) *fiber.App {
	app := fiber.New(fiber.Config{
		ErrorHandler: middleware.ErrorHandler,
	})

	// Global middleware (Fiber built-ins + thin logger wrapper).
	app.Use(recover.New())
	app.Use(middleware.RequestLogger())
	app.Use(cors.New(cors.Config{
		AllowOrigins: joinOrigins(cfg.CORSOrigins),
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PATCH, DELETE, OPTIONS",
	}))

	// Uploaded images — served statically at /uploads (public, no auth) so the
	// landing site and admin can render them directly by URL.
	app.Static("/uploads", cfg.UploadDir, fiber.Static{
		ByteRange: true,
		MaxAge:    86400,
	})

	api := app.Group("/api")

	// Health (public).
	api.Get("/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	// Public routes.
	api.Post("/auth/login", h.Auth.Login)
	api.Post("/telegram/webhook", h.Telegram.Webhook)

	// Public catalog + booking (consumed by the landing site, no auth).
	api.Get("/public/catalog-tours", h.CatalogTour.ListPublic)
	api.Get("/public/catalog-tours/:slug", h.CatalogTour.GetPublicBySlug)
	api.Post("/public/bookings", h.Booking.Create)

	// Protected routes.
	auth := middleware.AuthRequired(cfg.JWTSecret)

	api.Get("/auth/me", auth, h.Auth.Me)
	api.Post("/auth/logout", auth, h.Auth.Logout)

	api.Get("/dashboard", auth, h.Dashboard.Get)

	api.Get("/tours", auth, h.Tour.List)
	api.Post("/tours", auth, h.Tour.Create)
	api.Get("/tours/:id", auth, h.Tour.Get)
	api.Patch("/tours/:id", auth, h.Tour.Update)
	api.Delete("/tours/:id", auth, h.Tour.Delete)

	api.Get("/tours/:id/events", auth, h.Event.ListByTour)
	api.Post("/tours/:id/events", auth, h.Event.Create)
	api.Get("/events/:id", auth, h.Event.Get)
	api.Patch("/events/:id", auth, h.Event.Update)
	api.Delete("/events/:id", auth, h.Event.Delete)

	api.Get("/tours/:id/guests", auth, h.Guest.ListByTour)
	api.Post("/tours/:id/guests", auth, h.Guest.Create)
	api.Patch("/guests/:guestId", auth, h.Guest.Update)
	api.Delete("/guests/:guestId", auth, h.Guest.Delete)

	api.Get("/calendar/events", auth, h.Calendar.Events)
	api.Get("/calendar/tours", auth, h.Calendar.Tours)

	api.Get("/search", auth, h.Search.Search)

	api.Post("/ai/chat", auth, h.AI.Chat)
	api.Post("/ai/voice", auth, h.AI.Voice)
	api.Get("/ai/history", auth, h.AI.History)

	// Catalog tours (admin management of the public catalog).
	api.Get("/catalog-tours", auth, h.CatalogTour.List)
	api.Post("/catalog-tours", auth, h.CatalogTour.Create)
	api.Get("/catalog-tours/:id", auth, h.CatalogTour.Get)
	api.Patch("/catalog-tours/:id", auth, h.CatalogTour.Update)
	api.Delete("/catalog-tours/:id", auth, h.CatalogTour.Delete)

	// Image upload (admin) — returns { "url": "/uploads/<name>" }.
	api.Post("/uploads", auth, h.Upload.UploadImage)

	// Bookings (admin management of reservations).
	api.Get("/bookings", auth, h.Booking.List)
	api.Patch("/bookings/:id", auth, h.Booking.UpdateStatus)
	api.Delete("/bookings/:id", auth, h.Booking.Delete)

	return app
}

func joinOrigins(origins []string) string {
	out := ""
	for i, o := range origins {
		if i > 0 {
			out += ","
		}
		out += o
	}
	if out == "" {
		return "*"
	}
	return out
}
