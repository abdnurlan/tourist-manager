#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# M4ST Trip — public kataloqun sinxronlaşdırılması
#
# deploy/data/catalog-tours.json faylını bazadaki catalog_tours cədvəlinə
# köçürür. İdempotentdir: JSON-da olan slug varsa UPDATE, yoxsa INSERT edir;
# JSON-da OLMAYAN kataloq turlarını isə silir. Yəni JSON tək həqiqət mənbəyidir.
#
# Silinən kataloq turuna bağlı daxili turlar (tours.catalog_tour_id) silinmir —
# yalnız bağı qopardılır, beləliklə rezervasiya tarixçəsi qalır.
#
# Əl ilə:  bash deploy/scripts/seed-catalog.sh
#          bash deploy/scripts/seed-catalog.sh başqa-fayl.json
#
# XƏBƏRDARLIQ: JSON-da olmayan turlar silinir. Skript əvvəlcə backup alır.
# ─────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/../.."   # repo kökü

set -a; source .env; set +a
COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env"
DATA="${1:-deploy/data/catalog-tours.json}"

[[ -f "$DATA" ]] || { echo "XƏTA: $DATA tapılmadı." >&2; exit 1; }

# JSON sintaksisini serverdə yazmaqdan əvvəl yerli yoxla (python3 hər Ubuntu-da var).
python3 -c "import json,sys; d=json.load(open(sys.argv[1])); assert isinstance(d,list) and d, 'boş massiv'; print(f'✓ JSON qüvvədədir — {len(d)} tur')" "$DATA"

echo "### 1/3 Dəyişiklikdən əvvəl backup ..."
bash deploy/scripts/backup.sh

echo "### 2/3 Kataloq sinxronlaşdırılır ..."
JSON=$(cat "$DATA")

$COMPOSE exec -T db psql -v ON_ERROR_STOP=1 --quiet \
  -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" <<SQL
BEGIN;

CREATE TEMP TABLE incoming ON COMMIT DROP AS
SELECT * FROM jsonb_to_recordset(\$json\$
$JSON
\$json\$::jsonb) AS x(
  slug        text,
  category    text,
  price       int,
  rating      numeric,
  duration    int,
  group_size  text,
  image_url   text,
  published   boolean,
  sort_order  int,
  title       jsonb,
  region      jsonb,
  overview    jsonb,
  highlights  jsonb,
  itinerary   jsonb,
  included    jsonb,
  excluded    jsonb
);

-- Silinəcək kataloq turlarına bağlı daxili turların bağını qopar (turlar qalır).
UPDATE tours SET catalog_tour_id = NULL
 WHERE catalog_tour_id IN (
   SELECT id FROM catalog_tours WHERE slug NOT IN (SELECT slug FROM incoming)
 );

DELETE FROM catalog_tours WHERE slug NOT IN (SELECT slug FROM incoming);

INSERT INTO catalog_tours (
  slug, category, price, rating, duration, group_size, image_url,
  published, sort_order, title, region, overview, highlights,
  itinerary, included, excluded, created_at, updated_at)
SELECT
  slug, category::catalog_category, price, rating, duration, group_size,
  image_url, published, sort_order, title, region, overview, highlights,
  itinerary, included, excluded, now(), now()
FROM incoming
ON CONFLICT (slug) DO UPDATE SET
  category   = EXCLUDED.category,
  price      = EXCLUDED.price,
  rating     = EXCLUDED.rating,
  duration   = EXCLUDED.duration,
  group_size = EXCLUDED.group_size,
  image_url  = EXCLUDED.image_url,
  published  = EXCLUDED.published,
  sort_order = EXCLUDED.sort_order,
  title      = EXCLUDED.title,
  region     = EXCLUDED.region,
  overview   = EXCLUDED.overview,
  highlights = EXCLUDED.highlights,
  itinerary  = EXCLUDED.itinerary,
  included   = EXCLUDED.included,
  excluded   = EXCLUDED.excluded,
  updated_at = now();

COMMIT;
SQL

echo "### 3/3 Nəticə:"
$COMPOSE exec -T db psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -c \
  "SELECT sort_order AS n, slug, category, price, duration,
          title->>'he' AS he_title,
          jsonb_array_length(highlights->'he') AS he_stops
     FROM catalog_tours ORDER BY sort_order;"

echo "✓ Kataloq sinxronlaşdırıldı."
