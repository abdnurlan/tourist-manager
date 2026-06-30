package service

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"tourist-manager/backend/internal/ai"
	"tourist-manager/backend/internal/models"
	"tourist-manager/backend/internal/repository"
)

// AIAgent is the advanced, tool-calling assistant. It turns Azerbaijani natural
// language (typed or transcribed from voice) into real CRUD actions on tours and
// events, asking for confirmation before any mutation. Used by both the web /ai
// chat and the Telegram bot so behaviour is identical on every surface.
type AIAgent struct {
	ai     ai.AIService
	tours  TourService
	events EventService
	tourRepo  repository.TourRepository
	eventRepo repository.EventRepository
	tg        repository.TelegramRepository

	mu      sync.Mutex
	pending map[string]*pendingAction // keyed by user (web | tg:<id>)
}

// pendingAction is a mutation awaiting the user's "Bəli/Xeyr" confirmation.
type pendingAction struct {
	Tool string
	Args string // raw JSON arguments
}

// NewAIAgent builds the agent with everything it needs to read + mutate data.
func NewAIAgent(aiClient ai.AIService, tours TourService, events EventService, tourRepo repository.TourRepository, eventRepo repository.EventRepository, tg repository.TelegramRepository) *AIAgent {
	return &AIAgent{
		ai:        aiClient,
		tours:     tours,
		events:    events,
		tourRepo:  tourRepo,
		eventRepo: eventRepo,
		tg:        tg,
		pending:   make(map[string]*pendingAction),
	}
}

// userIDForKey maps an agent conversation key to the telegram_messages sender id
// (web → 0, tg:<id> → id) so we can scope per-user history.
func userIDForKey(key string) (int64, bool) {
	if key == webUserKey {
		return 0, true
	}
	if strings.HasPrefix(key, "tg:") {
		if id, err := strconv.ParseInt(strings.TrimPrefix(key, "tg:"), 10, 64); err == nil {
			return id, true
		}
	}
	return 0, false
}

// recentHistory returns the last few messages for this user (chronological) so
// the model can carry context across turns (multi-turn arg gathering).
func (a *AIAgent) recentHistory(userKey string) []ai.Msg {
	if a.tg == nil {
		return nil
	}
	want, ok := userIDForKey(userKey)
	if !ok {
		return nil
	}
	all, err := a.tg.History(24)
	if err != nil {
		return nil
	}
	var picked []models.TelegramMessage
	for _, m := range all { // newest-first
		if m.TelegramUserID != want {
			continue
		}
		picked = append(picked, m)
		if len(picked) >= 8 {
			break
		}
	}
	out := make([]ai.Msg, 0, len(picked))
	for i := len(picked) - 1; i >= 0; i-- { // reverse → chronological
		m := picked[i]
		content := ""
		if m.Content != nil {
			content = *m.Content
		} else if m.Transcript != nil {
			content = *m.Transcript
		}
		content = strings.TrimSpace(content)
		if content == "" {
			continue
		}
		role := "user"
		if m.Direction == "out" {
			role = "assistant"
		}
		out = append(out, ai.Msg{Role: role, Content: content})
	}
	return out
}

var agentBaku = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Baku")
	if err != nil {
		return time.FixedZone("AZT", 4*60*60)
	}
	return loc
}()

var agentMonths = [...]string{"", "Yanvar", "Fevral", "Mart", "Aprel", "May", "İyun", "İyul", "Avqust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"}

var agentTypeLabel = map[string]string{
	"transfer": "Transfer", "hotel": "Otel", "restaurant": "Restoran",
	"tour": "Tur", "flight": "Uçuş", "note": "Qeyd", "other": "Digər",
}
var agentTourStatus = map[string]string{
	"planned": "Planlaşdırılıb", "active": "Aktiv", "completed": "Tamamlanıb", "cancelled": "Ləğv edilib",
}
var agentPayment = map[string]string{
	"unpaid": "Ödənilməyib", "partial": "Qismən ödənilib", "paid": "Ödənilib",
}
var agentEventStatus = map[string]string{
	"planned": "Planlaşdırılıb", "done": "Tamamlanıb", "cancelled": "Ləğv edilib",
}

func agentToday() string    { return time.Now().In(agentBaku).Format("2006-01-02") }
func agentTomorrow() string { return time.Now().In(agentBaku).AddDate(0, 0, 1).Format("2006-01-02") }

// agentDateOnly trims a full RFC3339 timestamp ("2026-06-18T00:00:00Z") to YYYY-MM-DD.
func agentDateOnly(s string) string {
	if len(s) >= 10 {
		return s[:10]
	}
	return s
}

func agentFmtDate(d string) string {
	d = agentDateOnly(d)
	t, err := time.Parse("2006-01-02", d)
	if err != nil {
		return d
	}
	return fmt.Sprintf("%d %s", t.Day(), agentMonths[int(t.Month())])
}

// --- public entry points ---

// Handle processes one user turn and returns the assistant reply (Azerbaijani).
func (a *AIAgent) Handle(ctx context.Context, userKey, message string) (string, string, error) {
	msg := strings.TrimSpace(message)
	if msg == "" {
		return "Mesajınızı başa düşmədim. Nə etmək istəyirsiniz?", "unknown", nil
	}

	// 1) Pending confirmation? Resolve it before anything else.
	if p := a.getPending(userKey); p != nil {
		switch {
		case isAffirm(msg):
			a.clearPending(userKey)
			reply := a.execute(p.Tool, p.Args)
			return reply, p.Tool, nil
		case isDeny(msg):
			a.clearPending(userKey)
			return "Yaxşı, ləğv etdim. Başqa nə kömək edim?", "cancel", nil
		default:
			a.clearPending(userKey) // new request supersedes the stale one
		}
	}

	// 2) No API key → graceful notice.
	if !a.ai.Configured() {
		return "AI hələ tam konfiqurasiya olunmayıb (OpenAI açarı yoxdur).", "unknown", nil
	}

	// 3) Ask the model, with live data context + recent dialogue + the tool set.
	msgs := []ai.Msg{{Role: "system", Content: a.systemPrompt()}}
	msgs = append(msgs, a.recentHistory(userKey)...)
	msgs = append(msgs, ai.Msg{Role: "user", Content: msg})
	comp, err := a.ai.Complete(ctx, msgs, agentTools(), "auto")
	if err != nil {
		return "", "unknown", err
	}
	// If the model proposed an action in TEXT (e.g. "…Təsdiq edirsiniz?") instead
	// of calling a tool, force a tool call — so the user confirms only once (ours).
	if len(comp.ToolCalls) == 0 && looksLikeActionProposal(comp.Content) {
		if forced, ferr := a.ai.Complete(ctx, msgs, agentTools(), "required"); ferr == nil && len(forced.ToolCalls) > 0 {
			comp = forced
		}
	}

	if len(comp.ToolCalls) > 0 {
		tc := comp.ToolCalls[0]
		if isReadTool(tc.Name) {
			return a.executeRead(tc.Name, tc.Arguments), tc.Name, nil
		}
		// Mutation → summarize and ask for confirmation; never act blindly.
		summary := a.summarize(tc.Name, tc.Arguments)
		a.setPending(userKey, &pendingAction{Tool: tc.Name, Args: tc.Arguments})
		return summary + "\n\nTəsdiq edirsiniz? (Bəli / Xeyr)", tc.Name, nil
	}

	reply := strings.TrimSpace(comp.Content)
	if reply == "" {
		reply = "Sizə necə kömək edə bilərəm?"
	}
	return reply, "chat", nil
}

// Transcribe converts audio bytes to text via the AI client (Whisper).
func (a *AIAgent) Transcribe(ctx context.Context, audio []byte, filename string) (string, error) {
	return a.ai.TranscribeAudio(ctx, audio, filename)
}

// --- pending state helpers ---

func (a *AIAgent) getPending(k string) *pendingAction {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.pending[k]
}
func (a *AIAgent) setPending(k string, p *pendingAction) {
	a.mu.Lock()
	a.pending[k] = p
	a.mu.Unlock()
}
func (a *AIAgent) clearPending(k string) {
	a.mu.Lock()
	delete(a.pending, k)
	a.mu.Unlock()
}

func isAffirm(s string) bool {
	t := strings.ToLower(strings.TrimSpace(s))
	for _, w := range []string{"bəli", "beli", "hə", "he", "ok", "oldu", "təsdiq", "tesdiq", "tamam", "yes", "davam", "et", "razıyam", "raziyam"} {
		if t == w || strings.HasPrefix(t, w+" ") || t == w+"." {
			return true
		}
	}
	return false
}
func isDeny(s string) bool {
	t := strings.ToLower(strings.TrimSpace(s))
	for _, w := range []string{"xeyr", "yox", "yoxdur", "ləğv", "legv", "imtina", "no", "istəmirəm", "istemirem", "dayan"} {
		if t == w || strings.HasPrefix(t, w+" ") || t == w+"." {
			return true
		}
	}
	return false
}

// looksLikeActionProposal detects the model self-confirming a fully-specified
// action in text ("…Təsdiq edirsiniz?") so we can force the tool call instead.
func looksLikeActionProposal(s string) bool {
	t := strings.ToLower(s)
	return strings.Contains(t, "təsdiq edirsiniz") ||
		strings.Contains(t, "təsdiqləyirsiniz") ||
		strings.Contains(t, "təsdiqləyin")
}

func isReadTool(name string) bool {
	switch name {
	case "list_day", "list_tours", "find_events":
		return true
	}
	return false
}

// --- system prompt with live data context ---

func (a *AIAgent) systemPrompt() string {
	var sb strings.Builder
	sb.WriteString(`Sən «Tur Planlayıcı» tətbiqinin ağıllı köməkçisisən — şəxsi tur bələdçisi üçün.
HƏMİŞƏ Azərbaycan dilində, qısa və praktik cavab ver. «event» sözünü işlətmə, «tədbir» de.
İstifadəçi tur və ya tədbir yaratmaq/dəyişmək/silmək, yaxud planı görmək istəyəndə UYĞUN aləti (tool) çağır.
Söhbətin əvvəlki mesajlarını NƏZƏRƏ AL — istifadəçi məlumatı hissə-hissə verə bilər; lazımi VACİB məlumat tamamlananda dərhal aləti çağır, təkrar soruşma.
Çatmayan VACİB məlumat (məs. tarix, ad) varsa yalnız onu qısa soruş, MƏLUMAT UYDURMA. Qeyri-vacib detalları (qiymət, telefon) soruşma — onlarsız da yarat.
İstinad edilən tur AŞAĞIDAKI siyahıda VARSA, birbaşa onun id-si ilə tədbiri əlavə et — yenidən soruşma. Yalnız siyahıda HEÇ uyğun tur yoxdursa, əvvəlcə turu yaratmağı təklif et.
ÇOX VACİB: yaratma, dəyişmə və ya silmə üçün ÖZÜN «edimmi / silimmi?» deyə mətnlə soruşma. Lazımi məlumat tamamdırsa, BİRBAŞA uyğun aləti (tool) çağır — təsdiq pəncərəsini sistem özü göstərəcək. Sən yalnız çatmayan VACİB məlumatı soruşa bilərsən.
Bir mesajda bir neçə əməliyyat istənsə, əvvəlcə birincini et; təsdiqdən sonra növbətini təklif et.
Tarixlər YYYY-MM-DD, saat HH:mm formatında olmalıdır. Tədbir tipləri: transfer, hotel, restaurant, tour, flight, note, other.
Aşağıdakı id-lərdən istifadə et (istifadəçiyə id göstərmə).`)
	sb.WriteString("\n\nBu gün: " + agentToday() + " (Asia/Baku). Sabah: " + agentTomorrow() + ".")

	// Tours context.
	tours, err := a.tourRepo.List(repository.TourFilter{})
	if err == nil && len(tours) > 0 {
		sb.WriteString("\n\nMövcud turlar:")
		for _, t := range tours {
			st := agentTourStatus[t.Status]
			if st == "" {
				st = t.Status
			}
			fmt.Fprintf(&sb, "\n- [%s] %s (%s—%s, %s)", t.ID, t.Title, t.StartDate, t.EndDate, st)
		}
	} else {
		sb.WriteString("\n\nHələ tur yoxdur.")
	}

	// Events context (window: last 7 → next 60 days, capped).
	from := time.Now().In(agentBaku).AddDate(0, 0, -7).Format("2006-01-02")
	to := time.Now().In(agentBaku).AddDate(0, 0, 60).Format("2006-01-02")
	evs, err := a.eventRepo.List(repository.EventFilter{From: from, To: to})
	if err == nil && len(evs) > 0 {
		sb.WriteString("\n\nTədbirlər:")
		for i, e := range evs {
			if i >= 60 {
				break
			}
			tm := ""
			if e.Time != nil {
				tm = *e.Time
			}
			fmt.Fprintf(&sb, "\n- [%s] %s %s — %s (%s)", e.ID, agentDateOnly(e.Date), tm, e.Title, e.Type)
		}
	}
	return sb.String()
}

// --- read tools ---

func (a *AIAgent) executeRead(name, args string) string {
	switch name {
	case "list_day":
		var p struct {
			Date string `json:"date"`
		}
		_ = json.Unmarshal([]byte(args), &p)
		date := strings.TrimSpace(p.Date)
		if date == "" {
			date = agentToday()
		}
		evs, err := a.events.ListByDate(date)
		if err != nil {
			return "Məlumat alınarkən xəta baş verdi."
		}
		if len(evs) == 0 {
			return fmt.Sprintf("📅 %s — tədbir yoxdur.", agentFmtDate(date))
		}
		var sb strings.Builder
		fmt.Fprintf(&sb, "📅 %s:", agentFmtDate(date))
		for _, e := range evs {
			sb.WriteString("\n• ")
			if e.Time != nil && *e.Time != "" {
				fmt.Fprintf(&sb, "%s — ", *e.Time)
			}
			sb.WriteString(e.Title)
			if lbl, ok := agentTypeLabel[e.Type]; ok {
				fmt.Fprintf(&sb, " (%s)", lbl)
			}
			if e.Location != nil && *e.Location != "" {
				fmt.Fprintf(&sb, "\n  📍 %s", *e.Location)
			}
		}
		return sb.String()
	case "list_tours":
		var p struct {
			Status string `json:"status"`
		}
		_ = json.Unmarshal([]byte(args), &p)
		tours, err := a.tours.List(repository.TourFilter{Status: strings.TrimSpace(p.Status)})
		if err != nil {
			return "Məlumat alınarkən xəta baş verdi."
		}
		if len(tours) == 0 {
			return "Tur tapılmadı."
		}
		var sb strings.Builder
		sb.WriteString("🗺 Turlar:")
		for _, t := range tours {
			st := agentTourStatus[t.Status]
			fmt.Fprintf(&sb, "\n• %s (%s—%s) · %s", t.Title, agentFmtDate(t.StartDate), agentFmtDate(t.EndDate), st)
		}
		return sb.String()
	case "find_events":
		var p struct {
			Query string `json:"query"`
		}
		_ = json.Unmarshal([]byte(args), &p)
		evs, err := a.eventRepo.Search(strings.TrimSpace(p.Query))
		if err != nil {
			return "Axtarış zamanı xəta baş verdi."
		}
		if len(evs) == 0 {
			return "Uyğun tədbir tapılmadı."
		}
		var sb strings.Builder
		sb.WriteString("🔍 Tapılan tədbirlər:")
		for i, e := range evs {
			if i >= 15 {
				break
			}
			tm := ""
			if e.Time != nil {
				tm = " " + *e.Time
			}
			fmt.Fprintf(&sb, "\n• %s%s — %s", agentFmtDate(e.Date), tm, e.Title)
		}
		return sb.String()
	}
	return "Anladım."
}

// --- mutation arg structs ---

type tourArgs struct {
	TourID      string `json:"tour_id"`
	Title       string `json:"title"`
	StartDate   string `json:"start_date"`
	EndDate     string `json:"end_date"`
	Description string `json:"description"`
	Status      string `json:"status"`
}

type eventArgs struct {
	EventID       string   `json:"event_id"`
	TourID        string   `json:"tour_id"`
	Title         string   `json:"title"`
	Type          string   `json:"type"`
	Date          string   `json:"date"`
	Time          string   `json:"time"`
	Location      string   `json:"location"`
	Participants  string   `json:"participants"`
	Phone         string   `json:"phone"`
	Price         *float64 `json:"price"`
	Currency      string   `json:"currency"`
	PaymentStatus string   `json:"payment_status"`
	Status        string   `json:"status"`
	Notes         string   `json:"notes"`
}

func sp(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

// --- confirmation summaries ---

func (a *AIAgent) summarize(tool, args string) string {
	switch tool {
	case "create_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		return fmt.Sprintf("🗺 Yeni tur yaradım:\n• %s\n• %s — %s", p.Title, agentFmtDate(p.StartDate), agentFmtDate(p.EndDate))
	case "update_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		return "✏️ Turu yeniləyim: " + a.tourName(p.TourID) + agentChanges(p)
	case "delete_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		return "🗑 Bu turu silim: " + a.tourName(p.TourID) + " ?"
	case "create_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		return "🆕 Yeni tədbir əlavə edim:\n" + eventSummary(p) + "\n• Tur: " + a.tourName(p.TourID)
	case "update_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		ch := eventChanges(p)
		if ch == "" {
			ch = "\n• (dəyişiklik göstərilməyib)"
		}
		return "✏️ Tədbiri yeniləyim: " + a.eventName(p.EventID) + ch
	case "delete_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		return "🗑 Bu tədbiri silim: " + a.eventName(p.EventID) + " ?"
	}
	return "Bu əməliyyatı edim?"
}

func eventSummary(p eventArgs) string {
	var sb strings.Builder
	fmt.Fprintf(&sb, "• %s", p.Title)
	if lbl, ok := agentTypeLabel[p.Type]; ok {
		fmt.Fprintf(&sb, " (%s)", lbl)
	}
	if p.Date != "" {
		fmt.Fprintf(&sb, "\n• %s", agentFmtDate(p.Date))
		if p.Time != "" {
			fmt.Fprintf(&sb, " %s", p.Time)
		}
	}
	if p.Location != "" {
		fmt.Fprintf(&sb, "\n• 📍 %s", p.Location)
	}
	if p.Participants != "" {
		fmt.Fprintf(&sb, "\n• 👥 %s", p.Participants)
	}
	if p.Price != nil {
		cur := p.Currency
		if cur == "" {
			cur = "AZN"
		}
		fmt.Fprintf(&sb, "\n• 💰 %g %s", *p.Price, cur)
	}
	return sb.String()
}

func eventChanges(p eventArgs) string {
	var parts []string
	if p.Title != "" {
		parts = append(parts, "ad → "+p.Title)
	}
	if l, ok := agentTypeLabel[p.Type]; ok {
		parts = append(parts, "tip → "+l)
	}
	if p.Date != "" {
		parts = append(parts, "tarix → "+agentFmtDate(p.Date))
	}
	if p.Time != "" {
		parts = append(parts, "saat → "+p.Time)
	}
	if p.Location != "" {
		parts = append(parts, "yer → "+p.Location)
	}
	if p.Participants != "" {
		parts = append(parts, "iştirakçılar → "+p.Participants)
	}
	if p.Price != nil {
		cur := p.Currency
		if cur == "" {
			cur = "AZN"
		}
		parts = append(parts, fmt.Sprintf("qiymət → %g %s", *p.Price, cur))
	}
	if l, ok := agentPayment[p.PaymentStatus]; ok {
		parts = append(parts, "ödəniş → "+l)
	}
	if l, ok := agentEventStatus[p.Status]; ok {
		parts = append(parts, "status → "+l)
	}
	if len(parts) == 0 {
		return ""
	}
	return "\n• " + strings.Join(parts, "\n• ")
}

func agentChanges(p tourArgs) string {
	var parts []string
	if p.Title != "" {
		parts = append(parts, "ad → "+p.Title)
	}
	if p.StartDate != "" {
		parts = append(parts, "başlama → "+agentFmtDate(p.StartDate))
	}
	if p.EndDate != "" {
		parts = append(parts, "bitmə → "+agentFmtDate(p.EndDate))
	}
	if p.Status != "" {
		parts = append(parts, "status → "+agentTourStatus[p.Status])
	}
	if len(parts) == 0 {
		return ""
	}
	return "\n• " + strings.Join(parts, "\n• ")
}

func (a *AIAgent) tourName(id string) string {
	if t, err := a.tourRepo.FindByID(id); err == nil {
		return t.Title
	}
	return id
}
func (a *AIAgent) eventName(id string) string {
	if e, err := a.eventRepo.FindByID(id); err == nil {
		return e.Title
	}
	return id
}

// --- execution (after confirmation) ---

func (a *AIAgent) execute(tool, args string) string {
	switch tool {
	case "create_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		t, err := a.tours.Create(TourInput{Title: sp(p.Title), StartDate: sp(p.StartDate), EndDate: sp(p.EndDate), Description: sp(p.Description), Status: sp(p.Status)})
		if err != nil {
			return "❌ Tur yaradıla bilmədi: " + humanErr(err)
		}
		return fmt.Sprintf("✅ Tur yaradıldı: %s (%s—%s).", t.Title, agentFmtDate(t.StartDate), agentFmtDate(t.EndDate))
	case "update_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		t, err := a.tours.Update(p.TourID, TourInput{Title: sp(p.Title), StartDate: sp(p.StartDate), EndDate: sp(p.EndDate), Description: sp(p.Description), Status: sp(p.Status)})
		if err != nil {
			return "❌ Tur yenilənmədi: " + humanErr(err)
		}
		return "✅ Tur yeniləndi: " + t.Title + "."
	case "delete_tour":
		var p tourArgs
		_ = json.Unmarshal([]byte(args), &p)
		name := a.tourName(p.TourID)
		if err := a.tours.Delete(p.TourID); err != nil {
			return "❌ Tur silinmədi: " + humanErr(err)
		}
		return "✅ Tur silindi: " + name + "."
	case "create_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		src := "ai"
		e, err := a.events.Create(p.TourID, EventInput{
			Title: sp(p.Title), Type: sp(p.Type), Date: sp(p.Date), Time: sp(p.Time),
			Location: sp(p.Location), Participants: sp(p.Participants), Phone: sp(p.Phone),
			Price: p.Price, Currency: sp(p.Currency), PaymentStatus: sp(p.PaymentStatus),
			Status: sp(p.Status), Notes: sp(p.Notes), Source: &src,
		})
		if err != nil {
			return "❌ Tədbir əlavə olunmadı: " + humanErr(err)
		}
		return "✅ Tədbir əlavə olundu: " + e.Title + " (" + agentFmtDate(e.Date) + ")."
	case "update_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		e, err := a.events.Update(p.EventID, EventInput{
			Title: sp(p.Title), Type: sp(p.Type), Date: sp(p.Date), Time: sp(p.Time),
			Location: sp(p.Location), Participants: sp(p.Participants), Phone: sp(p.Phone),
			Price: p.Price, Currency: sp(p.Currency), PaymentStatus: sp(p.PaymentStatus),
			Status: sp(p.Status), Notes: sp(p.Notes),
		})
		if err != nil {
			return "❌ Tədbir yenilənmədi: " + humanErr(err)
		}
		return "✅ Tədbir yeniləndi: " + e.Title + "."
	case "delete_event":
		var p eventArgs
		_ = json.Unmarshal([]byte(args), &p)
		name := a.eventName(p.EventID)
		if err := a.events.Delete(p.EventID); err != nil {
			return "❌ Tədbir silinmədi: " + humanErr(err)
		}
		return "✅ Tədbir silindi: " + name + "."
	}
	return "Anladım."
}

func humanErr(err error) string {
	if err == nil {
		return ""
	}
	return "məlumatları yoxlayın"
}
