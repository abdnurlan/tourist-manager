package pricing

import "testing"

func ptr(i int) *int { return &i }

// groupTiers builds a five-bracket tour from the 2026 price sheet row:
// (1-3, 4, 5-7 group totals; 8-10, 11+ per person), each as {hebrew, standard}.
func groupTiers(r [5][2]int) *Pricing {
	return &Pricing{
		Model:    ModelGroupTiers,
		Currency: "USD",
		Tiers: []Tier{
			{Min: 1, Max: ptr(3), Basis: BasisGroup, Rates: map[string]int{RateHebrew: r[0][0], RateStandard: r[0][1]}},
			{Min: 4, Max: ptr(4), Basis: BasisGroup, Rates: map[string]int{RateHebrew: r[1][0], RateStandard: r[1][1]}},
			{Min: 5, Max: ptr(7), Basis: BasisGroup, Rates: map[string]int{RateHebrew: r[2][0], RateStandard: r[2][1]}},
			{Min: 8, Max: ptr(10), Basis: BasisPerPerson, Rates: map[string]int{RateHebrew: r[3][0], RateStandard: r[3][1]}},
			{Min: 11, Max: nil, Basis: BasisPerPerson, Rates: map[string]int{RateHebrew: r[4][0], RateStandard: r[4][1]}},
		},
	}
}

var (
	quba       = groupTiers([5][2]int{{200, 150}, {240, 190}, {300, 230}, {55, 40}, {50, 35}})
	qabala     = groupTiers([5][2]int{{220, 170}, {260, 210}, {320, 250}, {60, 45}, {55, 40}})
	cityCenter = groupTiers([5][2]int{{160, 110}, {180, 130}, {220, 170}, {35, 25}, {35, 25}})
	qobustan   = groupTiers([5][2]int{{180, 130}, {220, 170}, {280, 230}, {45, 35}, {40, 30}})
	nightTour  = groupTiers([5][2]int{{120, 90}, {140, 90}, {180, 130}, {25, 20}, {25, 20}})
)

// TestPriceSheetCells walks every published cell: each group bracket must quote
// exactly the printed figure, for both guide languages.
func TestPriceSheetCells(t *testing.T) {
	cases := []struct {
		name string
		p    *Pricing
		// pax -> {hebrew total, standard total}
		want map[int][2]int
	}{
		{"Quba", quba, map[int][2]int{1: {200, 150}, 3: {200, 150}, 4: {240, 190}, 5: {300, 230}, 7: {300, 230}, 8: {440, 320}, 10: {550, 400}}},
		{"Qəbələ", qabala, map[int][2]int{1: {220, 170}, 3: {220, 170}, 4: {260, 210}, 5: {320, 250}, 7: {320, 250}, 8: {480, 360}, 10: {600, 450}}},
		{"CityCenter", cityCenter, map[int][2]int{1: {160, 110}, 3: {160, 110}, 4: {180, 130}, 5: {220, 170}, 7: {220, 170}, 8: {280, 200}, 10: {350, 250}}},
		{"Qobustan", qobustan, map[int][2]int{1: {180, 130}, 3: {180, 130}, 4: {220, 170}, 5: {280, 230}, 7: {280, 230}, 8: {360, 280}, 10: {450, 350}}},
		{"GecəTuru", nightTour, map[int][2]int{1: {120, 90}, 3: {120, 90}, 4: {140, 90}, 5: {180, 130}, 7: {180, 130}, 8: {200, 160}, 10: {250, 200}}},
	}
	for _, c := range cases {
		for pax, want := range c.want {
			for i, lang := range []string{RateHebrew, RateStandard} {
				q, err := Calculate(c.p, pax, lang)
				if err != nil {
					t.Fatalf("%s pax=%d lang=%s: %v", c.name, pax, lang, err)
				}
				if q.Total != want[i] {
					t.Errorf("%s pax=%d lang=%s: total=%d, want %d", c.name, pax, lang, q.Total, want[i])
				}
			}
		}
	}
}

// TestMonotonicFloorDerivesPublishedMinimums checks rule 3: the floor must
// reproduce the four minimums printed on the sheet without them being stored.
func TestMonotonicFloorDerivesPublishedMinimums(t *testing.T) {
	cases := []struct {
		name  string
		p     *Pricing
		lang  string
		want  int
		floor bool
	}{
		{"Quba std 11 → 400", quba, RateStandard, 400, true},
		{"Qəbələ std 11 → 450", qabala, RateStandard, 450, true},
		{"Qobustan std 11 → 350", qobustan, RateStandard, 350, true},
		{"Qobustan he 11 → 450", qobustan, RateHebrew, 450, true},
		// Not printed on the sheet: the floor never bites for these.
		{"Quba he 11 → 550", quba, RateHebrew, 550, false},
		{"Qəbələ he 11 → 605", qabala, RateHebrew, 605, false},
		{"CityCenter std 11 → 275", cityCenter, RateStandard, 275, false},
		{"GecəTuru he 11 → 275", nightTour, RateHebrew, 275, false},
	}
	for _, c := range cases {
		q, err := Calculate(c.p, 11, c.lang)
		if err != nil {
			t.Fatalf("%s: %v", c.name, err)
		}
		if q.Total != c.want {
			t.Errorf("%s: total=%d, want %d", c.name, q.Total, c.want)
		}
		if q.FloorApplied != c.floor {
			t.Errorf("%s: floorApplied=%v, want %v", c.name, q.FloorApplied, c.floor)
		}
	}
}

// TestTariffNormalFromTwelve — the sheet promises the 11+ rate behaves normally
// from 12 travellers on, i.e. the floor stops applying.
func TestTariffNormalFromTwelve(t *testing.T) {
	cases := []struct {
		name string
		p    *Pricing
		lang string
		want int
	}{
		{"Quba std", quba, RateStandard, 420},
		{"Qəbələ std", qabala, RateStandard, 480},
		{"Qobustan std", qobustan, RateStandard, 360},
		{"Qobustan he", qobustan, RateHebrew, 480},
	}
	for _, c := range cases {
		q, err := Calculate(c.p, 12, c.lang)
		if err != nil {
			t.Fatalf("%s: %v", c.name, err)
		}
		if q.Total != c.want || q.FloorApplied {
			t.Errorf("%s: total=%d floor=%v, want %d floor=false", c.name, q.Total, q.FloorApplied, c.want)
		}
	}
}

// TestNeverCheaperWithMorePeople is the general invariant behind rule 3.
func TestNeverCheaperWithMorePeople(t *testing.T) {
	for _, p := range []*Pricing{quba, qabala, cityCenter, qobustan, nightTour} {
		for _, lang := range []string{RateHebrew, RateStandard} {
			prev := 0
			for pax := 1; pax <= 40; pax++ {
				q, err := Calculate(p, pax, lang)
				if err != nil {
					t.Fatalf("pax=%d: %v", pax, err)
				}
				if q.Total < prev {
					t.Errorf("pax=%d lang=%s: total %d < previous %d", pax, lang, q.Total, prev)
				}
				prev = q.Total
			}
		}
	}
}

func TestFlatPerPerson(t *testing.T) {
	master := &Pricing{Model: ModelFlatPerPerson, Currency: "USD", Tiers: []Tier{
		{Min: 1, Basis: BasisPerPerson, Rates: map[string]int{RateHebrew: 60, RateStandard: 50}},
	}}
	for _, c := range []struct {
		pax  int
		lang string
		want int
	}{{1, RateHebrew, 60}, {1, RateStandard, 50}, {7, RateHebrew, 420}, {12, RateStandard, 600}} {
		q, err := Calculate(master, c.pax, c.lang)
		if err != nil {
			t.Fatal(err)
		}
		if q.Total != c.want {
			t.Errorf("pax=%d lang=%s: total=%d, want %d", c.pax, c.lang, q.Total, c.want)
		}
		if q.Basis != BasisPerPerson {
			t.Errorf("pax=%d: basis=%s", c.pax, q.Basis)
		}
	}
}

func TestPerVehicle(t *testing.T) {
	jeep := &Pricing{
		Model: ModelPerVehicle, Currency: "USD", VehicleCapacity: 4,
		Tiers:     []Tier{{Min: 1, Basis: BasisVehicle, Rates: map[string]int{RateStandard: 260}}},
		Discounts: []Discount{{WhenPax: 2, Amount: 20}},
	}
	cases := []struct {
		pax, want, vehicles int
	}{
		{1, 260, 1},
		{2, 240, 1}, // exactly two riders — 20 off
		{3, 260, 1},
		{4, 260, 1},
		{5, 520, 2}, // 4 + 1
		{6, 500, 2}, // 4 + 2 → the second jeep gets the discount
		{8, 520, 2},
		{10, 760, 3}, // 4 + 4 + 2
	}
	for _, c := range cases {
		q, err := Calculate(jeep, c.pax, RateHebrew) // no language split for jeeps
		if err != nil {
			t.Fatal(err)
		}
		if q.Total != c.want || q.Vehicles != c.vehicles {
			t.Errorf("pax=%d: total=%d vehicles=%d, want %d/%d", c.pax, q.Total, q.Vehicles, c.want, c.vehicles)
		}
	}
}

func TestOnRequestAndErrors(t *testing.T) {
	q, err := Calculate(&Pricing{Model: ModelOnRequest}, 3, RateStandard)
	if err != nil || !q.OnRequest || q.Total != 0 {
		t.Errorf("on_request: %+v err=%v", q, err)
	}
	if _, err := Calculate(nil, 2, RateStandard); err != ErrNoPricing {
		t.Errorf("nil pricing: err=%v", err)
	}
	if _, err := Calculate(quba, 0, RateStandard); err != ErrPax {
		t.Errorf("pax=0: err=%v", err)
	}
}

func TestFromPrice(t *testing.T) {
	if got := FromPrice(quba); got != 150 {
		t.Errorf("Quba from=%d, want 150", got)
	}
	if got := FromPrice(nightTour); got != 90 {
		t.Errorf("Gecə turu from=%d, want 90", got)
	}
	if got := FromPrice(&Pricing{Model: ModelOnRequest}); got != 0 {
		t.Errorf("on_request from=%d, want 0", got)
	}
}
