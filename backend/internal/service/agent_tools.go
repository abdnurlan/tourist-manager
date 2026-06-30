package service

import (
	"encoding/json"

	"tourist-manager/backend/internal/ai"
)

// agentTools is the full tool set exposed to the model — one per app capability.
// Schemas are intentionally permissive on optional fields; the agent validates
// through the real services on execution.
func agentTools() []ai.ToolDef {
	j := func(s string) json.RawMessage { return json.RawMessage(s) }
	return []ai.ToolDef{
		{
			Name:        "create_tour",
			Description: "Yeni tur yarat. Tələb: ad, başlama və bitmə tarixi (YYYY-MM-DD). 1 günlük tur üçün başlama=bitmə.",
			Parameters: j(`{"type":"object","properties":{
				"title":{"type":"string","description":"Tur adı"},
				"start_date":{"type":"string","description":"YYYY-MM-DD"},
				"end_date":{"type":"string","description":"YYYY-MM-DD"},
				"description":{"type":"string"},
				"status":{"type":"string","enum":["planned","active","completed","cancelled"]}
			},"required":["title","start_date","end_date"]}`),
		},
		{
			Name:        "update_tour",
			Description: "Mövcud turu yenilə. tour_id konteksdəki id-lərdən götürülür. Yalnız dəyişən sahələri ver.",
			Parameters: j(`{"type":"object","properties":{
				"tour_id":{"type":"string"},
				"title":{"type":"string"},
				"start_date":{"type":"string"},
				"end_date":{"type":"string"},
				"description":{"type":"string"},
				"status":{"type":"string","enum":["planned","active","completed","cancelled"]}
			},"required":["tour_id"]}`),
		},
		{
			Name:        "delete_tour",
			Description: "Turu sil. tour_id konteksdəki id-lərdən götürülür.",
			Parameters:  j(`{"type":"object","properties":{"tour_id":{"type":"string"}},"required":["tour_id"]}`),
		},
		{
			Name:        "create_event",
			Description: "Bir tura tədbir əlavə et (transfer, otel, restoran, uçuş və s.). tour_id konteksdəki turlardan götürülür.",
			Parameters: j(`{"type":"object","properties":{
				"tour_id":{"type":"string","description":"Hansı tur"},
				"title":{"type":"string"},
				"type":{"type":"string","enum":["transfer","hotel","restaurant","tour","flight","note","other"]},
				"date":{"type":"string","description":"YYYY-MM-DD"},
				"time":{"type":"string","description":"HH:mm"},
				"location":{"type":"string"},
				"participants":{"type":"string","description":"iştirakçılar / insanlar"},
				"phone":{"type":"string"},
				"price":{"type":"number"},
				"currency":{"type":"string","enum":["AZN","USD","EUR","GBP","TRY","RUB"]},
				"payment_status":{"type":"string","enum":["unpaid","partial","paid"]},
				"status":{"type":"string","enum":["planned","done","cancelled"]},
				"notes":{"type":"string"}
			},"required":["tour_id","title","type","date"]}`),
		},
		{
			Name:        "update_event",
			Description: "Mövcud tədbiri yenilə (qiymət, ödəniş, status, tarix, saat və s.). event_id konteksdəki tədbirlərdən götürülür.",
			Parameters: j(`{"type":"object","properties":{
				"event_id":{"type":"string"},
				"title":{"type":"string"},
				"type":{"type":"string","enum":["transfer","hotel","restaurant","tour","flight","note","other"]},
				"date":{"type":"string"},
				"time":{"type":"string"},
				"location":{"type":"string"},
				"participants":{"type":"string"},
				"phone":{"type":"string"},
				"price":{"type":"number"},
				"currency":{"type":"string","enum":["AZN","USD","EUR","GBP","TRY","RUB"]},
				"payment_status":{"type":"string","enum":["unpaid","partial","paid"]},
				"status":{"type":"string","enum":["planned","done","cancelled"]},
				"notes":{"type":"string"}
			},"required":["event_id"]}`),
		},
		{
			Name:        "delete_event",
			Description: "Tədbiri sil. event_id konteksdəki tədbirlərdən götürülür.",
			Parameters:  j(`{"type":"object","properties":{"event_id":{"type":"string"}},"required":["event_id"]}`),
		},
		{
			Name:        "list_day",
			Description: "Müəyyən günün planını göstər (default bu gün). date YYYY-MM-DD.",
			Parameters:  j(`{"type":"object","properties":{"date":{"type":"string"}}}`),
		},
		{
			Name:        "list_tours",
			Description: "Turları göstər. İstəyə bağlı status filtri.",
			Parameters:  j(`{"type":"object","properties":{"status":{"type":"string","enum":["planned","active","completed","cancelled"]}}}`),
		},
		{
			Name:        "find_events",
			Description: "Açar sözə görə tədbir axtar (ad, yer, iştirakçı).",
			Parameters:  j(`{"type":"object","properties":{"query":{"type":"string"}},"required":["query"]}`),
		},
	}
}
