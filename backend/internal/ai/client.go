package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"
)

const (
	openAIChatURL = "https://api.openai.com/v1/chat/completions"
	openAIModel   = "gpt-4o-mini"
)

// systemPrompt frames the assistant as the Azerbaijani tour-planning helper.
const systemPrompt = `Sən «Tur Planlayıcı» tətbiqinin köməkçisisən — şəxsi tur bələdçisi üçün işləyirsən.
HƏMİŞƏ Azərbaycan dilində, qısa, səmimi və praktik cavab ver.
Sən turların, transferlərin, otellərin, restoranların, uçuşların və gündəlik proqramın planlaşdırılmasında kömək edirsən.
Əgər istifadəçi tur və ya event yaratmaq istəyirsə, lazımi detalları (ad, tarix, saat, yer) soruş — heç vaxt məlumat uydurma.
Cavabın yalnız mətn olsun, markdown başlıqlarından çox istifadə etmə.`

var openAIHTTPClient = &http.Client{Timeout: 30 * time.Second}

type openAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openAIChatRequest struct {
	Model       string          `json:"model"`
	Messages    []openAIMessage `json:"messages"`
	Temperature float64         `json:"temperature"`
}

type openAIChatResponse struct {
	Choices []struct {
		Message openAIMessage `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// AIService is the boundary for all AI capabilities (chat, transcription, intent).
// MVP implementation returns deterministic Azerbaijani placeholders when no API key
// is configured, so callers never change when a real LLM is swapped in.
type AIService interface {
	// Chat returns an Azerbaijani reply plus a detected intent label.
	Chat(ctx context.Context, message string) (reply string, intent string, err error)
	// Transcribe converts a voice file (by Telegram file_id / path) to text.
	Transcribe(ctx context.Context, fileRef string) (transcript string, err error)
	// DetectIntent maps free text to a known intent label.
	DetectIntent(ctx context.Context, text string) (intent string, err error)
	// Configured reports whether a real OpenAI key is wired in.
	Configured() bool
}

// service is the placeholder AIService implementation.
type service struct {
	apiKey string
}

// NewAIService builds an AIService. It reads OPENAI_API_KEY from the caller (config).
func NewAIService(openAIAPIKey string) AIService {
	return &service{apiKey: strings.TrimSpace(openAIAPIKey)}
}

// Configured reports whether a real API key is available.
func (s *service) Configured() bool { return s.apiKey != "" }

// Chat produces an Azerbaijani assistant reply. For MVP it returns a friendly
// placeholder that acknowledges the message and signals that advanced AI is coming.
// When OPENAI_API_KEY is set, it delegates to ChatWithOpenAI (the real-call boundary).
func (s *service) Chat(ctx context.Context, message string) (string, string, error) {
	intent, _ := s.DetectIntent(ctx, message)

	if !s.Configured() {
		// Graceful, friendly Azerbaijani placeholder (CONTRACT.md §6.7 / §10.5).
		return s.placeholderReply(message, intent), intent, nil
	}

	// Real OpenAI path (drop-in). On any error we fall back to the placeholder so
	// the user always receives a usable Azerbaijani reply.
	reply, err := s.ChatWithOpenAI(ctx, message, intent)
	if err != nil {
		log.Printf("ai: OpenAI chat failed, falling back to placeholder: %v", err)
	}
	if err != nil || strings.TrimSpace(reply) == "" {
		return s.placeholderReply(message, intent), intent, nil
	}
	return reply, intent, nil
}

// placeholderReply builds a friendly Azerbaijani acknowledgement. It mirrors the
// detected intent so the experience already feels responsive before the real LLM lands.
func (s *service) placeholderReply(message, intent string) string {
	msg := strings.TrimSpace(message)
	const coming = "Daha ağıllı AI köməkçi tezliklə əlavə olunacaq."

	switch intent {
	case IntentTodayPlan:
		return "Bugünkü planınızı soruşdunuz. /today əmri ilə bu günün eventlərini dəqiq görə bilərsiniz. " + coming
	case IntentTomorrowPlan:
		return "Sabahkı planınızı soruşdunuz. /tomorrow əmri ilə sabahın eventlərini görə bilərsiniz. " + coming
	case IntentListTours:
		return "Turlarınızı soruşdunuz. /tours əmri ilə bütün turlarınızı görə bilərsiniz. " + coming
	case IntentListActive:
		return "Aktiv turlarınızı soruşdunuz. /active əmri ilə aktiv turları görə bilərsiniz. " + coming
	case IntentCreateTour:
		return "Yeni tur yaratmaq istədiyinizi başa düşdüm. Hələlik turu veb tətbiqdən və ya əl ilə əlavə edə bilərsiniz. " + coming
	case IntentAddEvent:
		return "Event əlavə etmək istədiyinizi başa düşdüm. Hansı tura əlavə edilməlidir? Hələlik eventi veb tətbiqdən əlavə edə bilərsiniz. " + coming
	case IntentShowTourProgram:
		return "Tur proqramını göstərməyi xahiş etdiniz. Hələlik proqramı veb tətbiqdə tur təfərrüatından görə bilərsiniz. " + coming
	default:
		if msg == "" {
			return "Mesajınızı aldım. " + coming
		}
		return fmt.Sprintf("Mesajınızı aldım: «%s». %s", truncate(msg, 120), coming)
	}
}

// truncate shortens long text for echo-back in the placeholder reply.
func truncate(s string, max int) string {
	r := []rune(s)
	if len(r) <= max {
		return s
	}
	return string(r[:max]) + "…"
}

// ChatWithOpenAI is the CLEARLY-MARKED [PLACEHOLDER] boundary for the real OpenAI
// chat-completions call. A real implementation builds an Azerbaijani system prompt,
// calls the OpenAI Chat Completions API with s.apiKey, and returns the reply text.
//
// It is intentionally a stub for MVP: it returns an empty string with no error so
// Chat() transparently falls back to the friendly Azerbaijani placeholder. Swap the
// body below for a real HTTP call to https://api.openai.com/v1/chat/completions
// (model e.g. gpt-4o-mini) with no change to any caller.
// ChatWithOpenAI calls the OpenAI Chat Completions API with an Azerbaijani system
// prompt and returns the assistant reply. Any error bubbles up so Chat() can fall
// back to the friendly placeholder, keeping the user experience resilient.
func (s *service) ChatWithOpenAI(ctx context.Context, message, intent string) (string, error) {
	_ = intent // reserved for future context-aware prompting

	reqBody := openAIChatRequest{
		Model: openAIModel,
		Messages: []openAIMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: message},
		},
		Temperature: 0.5,
	}
	payload, err := json.Marshal(reqBody)
	if err != nil {
		return "", err
	}

	reqCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, openAIChatURL, bytes.NewReader(payload))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := openAIHTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var parsed openAIChatResponse
	if err := json.Unmarshal(data, &parsed); err != nil {
		return "", fmt.Errorf("openai: decode response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		if parsed.Error != nil {
			return "", fmt.Errorf("openai: %s", parsed.Error.Message)
		}
		return "", fmt.Errorf("openai: status %d", resp.StatusCode)
	}
	if len(parsed.Choices) == 0 {
		return "", fmt.Errorf("openai: empty choices")
	}
	return strings.TrimSpace(parsed.Choices[0].Message.Content), nil
}
