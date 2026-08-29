// Package pricing evaluates a catalog tour's price for a given party size and
// guide language. It is the single authority on money: the landing site mirrors
// the same rules for instant feedback, but every stored total is recomputed here.
//
// The 2026 price sheet has four shapes, all expressed by Pricing.Model:
//
//	group_tiers      — party-size brackets; small brackets quote a group total,
//	                   large brackets quote a per-person rate (Quba, Qəbələ, …)
//	flat_per_person  — one per-person rate regardless of party size (masterclass)
//	per_vehicle      — priced per jeep, capacity 4, with a per-vehicle discount
//	on_request       — no public price (rent a car, hotel)
package pricing

import (
	"errors"
	"math"
)

// Basis says what a tier's rate refers to.
type Basis string

const (
	BasisGroup     Basis = "group"      // rate is the whole party's total
	BasisPerPerson Basis = "per_person" // rate is charged per traveller
	BasisVehicle   Basis = "vehicle"    // rate is charged per vehicle
)

// Model is the overall pricing shape of a catalog tour.
type Model string

const (
	ModelGroupTiers    Model = "group_tiers"
	ModelFlatPerPerson Model = "flat_per_person"
	ModelPerVehicle    Model = "per_vehicle"
	ModelOnRequest     Model = "on_request"
)

// Guide-language rate keys. The price sheet distinguishes a Hebrew-speaking
// guide (higher) from an English/Russian-speaking one (the standard rate).
const (
	RateHebrew   = "he"
	RateStandard = "std"
)

// DefaultCurrency matches the system default (CONTRACT: USD).
const DefaultCurrency = "USD"

// Tier is one party-size bracket. Max == nil means "and above".
type Tier struct {
	Min   int            `json:"min"`
	Max   *int           `json:"max"`
	Basis Basis          `json:"basis"`
	Rates map[string]int `json:"rates"` // keyed by RateHebrew / RateStandard
}

// Discount reduces the price of a single vehicle carrying exactly WhenPax
// travellers (price sheet: "2 people in a jeep — 20 USD off").
type Discount struct {
	WhenPax int `json:"when_pax_in_vehicle"`
	Amount  int `json:"amount"`
}

// Pricing is the full price definition stored on a catalog tour.
type Pricing struct {
	Model           Model      `json:"model"`
	Currency        string     `json:"currency"`
	VehicleCapacity int        `json:"vehicle_capacity,omitempty"`
	Tiers           []Tier     `json:"tiers,omitempty"`
	Discounts       []Discount `json:"discounts,omitempty"`
}

// Quote is the computed price for a concrete party.
type Quote struct {
	Total     int     `json:"total"`
	PerPerson float64 `json:"per_person"`
	Currency  string  `json:"currency"`
	Basis     Basis   `json:"basis"`
	Pax       int     `json:"pax"`
	Vehicles  int     `json:"vehicles,omitempty"`
	GuideLang string  `json:"guide_lang"`
	OnRequest bool    `json:"on_request"`
	// FloorApplied reports that the monotonic guard raised the total — the
	// party pays what a smaller party would, never less.
	FloorApplied bool `json:"floor_applied,omitempty"`
}

// Errors returned by Calculate.
var (
	ErrNoPricing = errors.New("qiymət təyin edilməyib")
	ErrPax       = errors.New("nəfər sayı 1-dən böyük olmalıdır")
	ErrNoTier    = errors.New("bu nəfər sayı üçün tarif yoxdur")
)

// RateKey maps a UI/guide language code onto a rate column. Only Hebrew has a
// separate column; every other language uses the standard rate.
func RateKey(lang string) string {
	if lang == RateHebrew {
		return RateHebrew
	}
	return RateStandard
}

func (t Tier) contains(pax int) bool {
	if pax < t.Min {
		return false
	}
	return t.Max == nil || pax <= *t.Max
}

// rate returns the tier's rate for a language, falling back to the standard
// column when a tour does not price the languages differently (jeep tours).
func (t Tier) rate(key string) (int, bool) {
	if v, ok := t.Rates[key]; ok {
		return v, true
	}
	v, ok := t.Rates[RateStandard]
	return v, ok
}

// rawTotal is the tier price before the monotonic floor.
func (t Tier) rawTotal(pax int, key string) (int, bool) {
	r, ok := t.rate(key)
	if !ok {
		return 0, false
	}
	if t.Basis == BasisGroup {
		return r, true
	}
	return r * pax, true
}

// Calculate computes the price for pax travellers with a guide speaking guideLang.
func Calculate(p *Pricing, pax int, guideLang string) (Quote, error) {
	if p == nil || p.Model == "" {
		return Quote{}, ErrNoPricing
	}
	cur := p.Currency
	if cur == "" {
		cur = DefaultCurrency
	}
	key := RateKey(guideLang)
	q := Quote{Currency: cur, Pax: pax, GuideLang: key}

	if p.Model == ModelOnRequest {
		q.OnRequest = true
		return q, nil
	}
	if pax < 1 {
		return Quote{}, ErrPax
	}

	switch p.Model {
	case ModelPerVehicle:
		return quoteVehicles(p, pax, key, q)
	case ModelGroupTiers, ModelFlatPerPerson:
		return quoteTiers(p, pax, key, q)
	default:
		return Quote{}, ErrNoPricing
	}
}

func quoteTiers(p *Pricing, pax int, key string, q Quote) (Quote, error) {
	var tier *Tier
	for i := range p.Tiers {
		if p.Tiers[i].contains(pax) {
			tier = &p.Tiers[i]
			break
		}
	}
	if tier == nil {
		return Quote{}, ErrNoTier
	}
	total, ok := tier.rawTotal(pax, key)
	if !ok {
		return Quote{}, ErrNoPricing
	}

	// Monotonic floor (price sheet rule 3): a bigger party never pays less than
	// a smaller one. Checking each lower tier at its own largest party size is
	// enough — within a tier the total only grows with pax. This derives the
	// published minimums (Quba 400, Qəbələ 450, Qobustan 350/450) instead of
	// hardcoding them, so they stay correct when a rate changes.
	for i := range p.Tiers {
		lower := p.Tiers[i]
		if lower.Max == nil || *lower.Max >= pax {
			continue
		}
		if lt, ok := lower.rawTotal(*lower.Max, key); ok && lt > total {
			total = lt
			q.FloorApplied = true
		}
	}

	q.Total = total
	q.Basis = tier.Basis
	q.PerPerson = round2(float64(total) / float64(pax))
	return q, nil
}

func quoteVehicles(p *Pricing, pax int, key string, q Quote) (Quote, error) {
	cap := p.VehicleCapacity
	if cap < 1 {
		return Quote{}, ErrNoPricing
	}
	if len(p.Tiers) == 0 {
		return Quote{}, ErrNoPricing
	}
	rate, ok := p.Tiers[0].rate(key)
	if !ok {
		return Quote{}, ErrNoPricing
	}

	vehicles := (pax + cap - 1) / cap
	total := 0
	remaining := pax
	for v := 0; v < vehicles; v++ {
		seats := remaining
		if seats > cap {
			seats = cap
		}
		remaining -= seats
		price := rate
		// A discount applies per vehicle, based on how many travellers ride in
		// that particular vehicle.
		for _, d := range p.Discounts {
			if d.WhenPax == seats {
				price -= d.Amount
			}
		}
		if price < 0 {
			price = 0
		}
		total += price
	}

	q.Total = total
	q.Basis = BasisVehicle
	q.Vehicles = vehicles
	q.PerPerson = round2(float64(total) / float64(pax))
	return q, nil
}

// FromPrice is the cheapest total any party can pay — the "starting from"
// figure used by admin listings. Returns 0 for on-request tours.
func FromPrice(p *Pricing) int {
	if p == nil || p.Model == ModelOnRequest {
		return 0
	}
	best := 0
	for pax := 1; pax <= 12; pax++ {
		q, err := Calculate(p, pax, RateStandard)
		if err != nil || q.OnRequest {
			continue
		}
		if best == 0 || q.Total < best {
			best = q.Total
		}
	}
	return best
}

func round2(v float64) float64 { return math.Round(v*100) / 100 }
