package database

import (
	"errors"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"tourist-manager/backend/internal/models"
)

// enumDDL ensures the Postgres ENUM types and pgcrypto extension exist before
// AutoMigrate runs (GORM does not create custom types referenced in column tags).
var enumDDL = []string{
	`CREATE EXTENSION IF NOT EXISTS pgcrypto`,
	`DO $$ BEGIN CREATE TYPE user_role AS ENUM ('admin'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE tour_status AS ENUM ('planned','active','completed','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE event_type AS ENUM ('transfer','hotel','restaurant','tour','flight','note','other'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE event_status AS ENUM ('planned','done','cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('unpaid','partial','paid'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE event_source AS ENUM ('manual','telegram','ai'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE tg_direction AS ENUM ('in','out'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
	`DO $$ BEGIN CREATE TYPE tg_kind AS ENUM ('text','voice','photo','document','command'); EXCEPTION WHEN duplicate_object THEN null; END $$`,
}

// Migrate ensures enum types exist then runs GORM AutoMigrate for all six tables.
func Migrate(db *gorm.DB) error {
	for _, stmt := range enumDDL {
		if err := db.Exec(stmt).Error; err != nil {
			return err
		}
	}
	return db.AutoMigrate(
		&models.User{},
		&models.Tour{},
		&models.Event{},
		&models.Attachment{},
		&models.TelegramMessage{},
		&models.Reminder{},
	)
}

// SeedAdmin inserts the admin user (bcrypt-hashed) if no user with the given
// username exists yet. Idempotent on every boot.
func SeedAdmin(db *gorm.DB, username, password string) error {
	var existing models.User
	err := db.Where("username = ?", username).First(&existing).Error
	if err == nil {
		return nil // already seeded
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	admin := &models.User{
		Username:     username,
		PasswordHash: string(hash),
		Role:         "admin",
	}
	return db.Create(admin).Error
}
