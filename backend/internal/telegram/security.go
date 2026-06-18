package telegram

// IsAllowed reports whether the given Telegram user id matches the single configured
// allowed user (CONTRACT.md §10.1). An unconfigured allowed id (0) rejects everyone.
func (b *botService) IsAllowed(userID int64) bool {
	return b.allowedUserID != 0 && userID == b.allowedUserID
}
