package ai

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"time"
)

// Low-level OpenAI primitives that power the agent: tool-calling chat completions
// and Whisper audio transcription. The service-layer agent builds on these.

const (
	openAIWhisperURL = "https://api.openai.com/v1/audio/transcriptions"
	whisperModel     = "whisper-1"
)

// Msg is one chat message (system/user/assistant/tool).
type Msg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ToolDef describes a callable function exposed to the model.
type ToolDef struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  json.RawMessage `json:"parameters"` // JSON Schema
}

// ToolCall is a function the model decided to invoke, with raw JSON arguments.
type ToolCall struct {
	ID        string
	Name      string
	Arguments string // raw JSON
}

// Completion is the model's response: free text and/or tool calls.
type Completion struct {
	Content   string
	ToolCalls []ToolCall
}

// --- request/response wire types ---

type toolWire struct {
	Type     string        `json:"type"`
	Function toolFuncWire  `json:"function"`
}
type toolFuncWire struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  json.RawMessage `json:"parameters"`
}

type chatReqWire struct {
	Model       string     `json:"model"`
	Messages    []Msg      `json:"messages"`
	Tools       []toolWire `json:"tools,omitempty"`
	ToolChoice  string     `json:"tool_choice,omitempty"`
	Temperature float64    `json:"temperature"`
}

type chatRespWire struct {
	Choices []struct {
		Message struct {
			Content   string `json:"content"`
			ToolCalls []struct {
				ID       string `json:"id"`
				Function struct {
					Name      string `json:"name"`
					Arguments string `json:"arguments"`
				} `json:"function"`
			} `json:"tool_calls"`
		} `json:"message"`
	} `json:"choices"`
	Error *struct {
		Message string `json:"message"`
	} `json:"error,omitempty"`
}

// Complete runs a tool-calling chat completion. toolChoice is "auto" (model
// decides) or "required" (force some tool call); empty defaults to auto.
func (s *service) Complete(ctx context.Context, messages []Msg, tools []ToolDef, toolChoice string) (*Completion, error) {
	wireTools := make([]toolWire, 0, len(tools))
	for _, t := range tools {
		wireTools = append(wireTools, toolWire{
			Type: "function",
			Function: toolFuncWire{Name: t.Name, Description: t.Description, Parameters: t.Parameters},
		})
	}

	body := chatReqWire{
		Model:       openAIModel,
		Messages:    messages,
		Temperature: 0.2,
	}
	if len(wireTools) > 0 {
		body.Tools = wireTools
		if toolChoice == "" {
			toolChoice = "auto"
		}
		body.ToolChoice = toolChoice
	}

	payload, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	reqCtx, cancel := context.WithTimeout(ctx, 40*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, openAIChatURL, bytes.NewReader(payload))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+s.apiKey)

	resp, err := openAIHTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var parsed chatRespWire
	if err := json.Unmarshal(data, &parsed); err != nil {
		return nil, fmt.Errorf("openai: decode: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		if parsed.Error != nil {
			return nil, fmt.Errorf("openai: %s", parsed.Error.Message)
		}
		return nil, fmt.Errorf("openai: status %d", resp.StatusCode)
	}
	if len(parsed.Choices) == 0 {
		return nil, fmt.Errorf("openai: empty choices")
	}

	m := parsed.Choices[0].Message
	out := &Completion{Content: m.Content}
	for _, tc := range m.ToolCalls {
		out.ToolCalls = append(out.ToolCalls, ToolCall{
			ID:        tc.ID,
			Name:      tc.Function.Name,
			Arguments: tc.Function.Arguments,
		})
	}
	return out, nil
}

// TranscribeAudio sends raw audio bytes to OpenAI Whisper and returns the transcript.
// filename hints the format (e.g. "voice.ogg", "voice.webm").
func (s *service) TranscribeAudio(ctx context.Context, audio []byte, filename string) (string, error) {
	if !s.Configured() {
		return "", fmt.Errorf("ai: no api key")
	}
	if filename == "" {
		filename = "audio.ogg"
	}

	var buf bytes.Buffer
	w := multipart.NewWriter(&buf)
	fw, err := w.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}
	if _, err := fw.Write(audio); err != nil {
		return "", err
	}
	_ = w.WriteField("model", whisperModel)
	// Azerbaijani transcription hint.
	_ = w.WriteField("language", "az")
	if err := w.Close(); err != nil {
		return "", err
	}

	reqCtx, cancel := context.WithTimeout(ctx, 60*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, http.MethodPost, openAIWhisperURL, &buf)
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", w.FormDataContentType())
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
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("whisper: status %d: %s", resp.StatusCode, string(data))
	}

	var out struct {
		Text  string `json:"text"`
		Error *struct {
			Message string `json:"message"`
		} `json:"error"`
	}
	if err := json.Unmarshal(data, &out); err != nil {
		return "", err
	}
	if out.Error != nil {
		return "", fmt.Errorf("whisper: %s", out.Error.Message)
	}
	return out.Text, nil
}
