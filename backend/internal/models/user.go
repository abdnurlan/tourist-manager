package models

import "time"

// User is the single admin account (the tour guide).
type User struct {
	ID           string    `json:"id"            gorm:"type:uuid;default:gen_random_uuid();primaryKey"`
	Username     string    `json:"username"      gorm:"type:text;uniqueIndex;not null"`
	PasswordHash string    `json:"-"             gorm:"type:text;not null"`
	Role         string    `json:"role"          gorm:"type:user_role;default:'admin';not null"`
	CreatedAt    time.Time `json:"created_at"    gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at"    gorm:"autoUpdateTime"`
}

func (User) TableName() string { return "users" }
