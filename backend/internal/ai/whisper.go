package ai

import "context"

// TranscribeVoice is the CLEARLY-MARKED [PLACEHOLDER] boundary for OpenAI Whisper
// voice transcription. A real implementation downloads the Telegram voice file by
// fileRef, POSTs it to https://api.openai.com/v1/audio/transcriptions (model whisper-1)
// with s.apiKey, and returns the Azerbaijani transcript.
//
// For MVP it returns a deterministic Azerbaijani notice (no external call) so the
// voice -> AI -> intent pipeline is fully wired and swappable with no caller change.
func (s *service) TranscribeVoice(ctx context.Context, fileRef string) (string, error) {
	_ = ctx
	_ = fileRef
	if !s.Configured() {
		return "Səs tanıma hələ konfiqurasiya olunmayıb.", nil
	}
	// [PLACEHOLDER] real Whisper transcription goes here.
	return "Səs tanıma hələ konfiqurasiya olunmayıb.", nil
}

// Transcribe satisfies the AIService interface and delegates to the TranscribeVoice
// placeholder boundary.
func (s *service) Transcribe(ctx context.Context, fileRef string) (string, error) {
	return s.TranscribeVoice(ctx, fileRef)
}
