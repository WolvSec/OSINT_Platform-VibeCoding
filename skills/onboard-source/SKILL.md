---
name: onboard-source
description: 'Turn a public HTTP endpoint (JSON, GeoJSON, CSV, XML, RSS/Atom) into a sources.d/<name>.yaml file that the engine polls and the globe draws with its own legend layer, icon and colour.'
---

# Onboard a data source (`onboard-source`)

Goal: given an endpoint URL, write **one** file, `sources.d/<name>.yaml` at the repository root. The backend engine (`backend/src/engine/`) loads it at startup, polls the URL, maps every record to a point, and the frontend draws those points on the globe as a new legend layer. No TypeScript changes are needed. Do not edit `backend/` or `frontend/` to add a source.

**Canonical template: `sources.d/eonet_wildfires.yaml`.** Read it first and copy its structure. It has every block a finished source needs: top-level ids, `layer:`, `display:`, `transport:`, `parser:`, optional `filter:`, `entity:`, `observation:` and `recording:`.

More worked examples, each with `layer:` and `display:` blocks, are in `skills/onboard-source/examples/`:

| File | Format | Shows |
| :-- | :-- | :-- |
| `safecast_radiation.yaml` | `json` (top-level array) | `color_by` stops, `coalesce()` |
| `submarine_cable_landings.yaml` | `geojson` | `color_by` map, link built with `concat()` |
| `wri_power_plants.yaml` | `csv` (header row) | `filter` expression, `number()` |
| `ptwc_tsunami_bulletins.yaml` | `rss` (Atom) | `observation.optional`, constant strings |

Source of truth when this page and the code disagree: `backend/src/engine/yaml-loader.ts` (`SourceConfig`, `validateSourceConfig`), `backend/src/engine/layer-display.ts` (layer groups, icon keys, display rules), `backend/src/engine/expressions.ts` (the `=` expression language) and `backend/src/engine/field-mapper.ts`. The long-form reference is `docs/data-sources.md`.

---

## Step 1: Fetch a sample

```bash
curl -s "<URL>" | head -c 3000
```

Work out:

- The shape: a top-level JSON array, a JSON object holding the array (note the path, e.g. `query.geosearch`), a single JSON object, a GeoJSON `FeatureCollection`, CSV, XML, or RSS/Atom.
- Which field is a stable unique id, which is a human name, and where latitude and longitude are. **No coordinates = not a map source.** (For example, the Tor Onionoo API no longer returns lat/lon; skip it.)
- Whether the feed returns records right now. A 200 with an empty list plots nothing.
- Whether it needs a key. The engine supports static `headers`, `${ENV_VAR}` placeholders and `transport.auth`; never write a secret into the YAML (see "Secrets" below). Prefer keyless feeds.

## Step 2: Pick the parser

| Response body | `parser.format` | `parser.records_path` |
| :-- | :-- | :-- |
| Top-level JSON array | `json` | omit |
| JSON object holding the array, e.g. `{"query": {"geosearch": [...]}}` | `json` | `query.geosearch` (dots only, no `[0]`) |
| One JSON object that is itself the record (e.g. an ISS position API) | `json` | omit; the object becomes one record |
| GeoJSON `FeatureCollection` | `geojson` | omit (defaults to `features`) |
| CSV with a header row | `csv` | omit; each row is an object keyed by column name, all values strings |
| XML | `xml` | path to the repeated element, e.g. `markers.marker`; attributes appear as `@_name` |
| RSS 2.0 / RDF / Atom | `rss` | omit; items become `{title, link, description, published, guid, categories, author, lat, lon}` |

Valid formats: `json`, `geojson`, `xml`, `csv`, `rss`, `tle`, `omm_json`. Anything else rejects the file. `parser.max_records: N` keeps the first N records per poll (before `filter`). CSV without a header, or delimited by `|` or whitespace, uses `parser.csv: { delimiter, has_header, columns, skip_lines, comment_prefix }`; see `docs/data-sources.md`.

## Step 3: Map the fields

Every mapping value is either a **path** into one raw record, or, if it starts with `=`, an **expression**.

Paths: `id`, `properties.title`, `geometry.coordinates[1]`, `[0]` (when each record is an array). A bare number such as `'0'` is a literal when no field of that name exists.

Expressions (`backend/src/engine/expressions.ts`, sandboxed, no JavaScript):

- Operators: `+ - * / %`, `== != < <= > >=`, `&& || !` (or `and or not`), `a ?? b`, `cond ? a : b`. Field access `a.b`, `a[0]`, `$['key-with:odd.chars']` (`$` is the whole record). Literals `'text'`, `1.5`, `true`, `null`.
- Helpers: `now()`, `unix_ms(x)`, `unix_s(x)`, `parse_date(x)`, `number(x)`, `string(x)`, `lower(x)`, `upper(x)`, `trim(x)`, `concat(a, b, ...)`, `coalesce(a, b, ...)`, `round(x, digits)`, `floor(x)`, `ceil(x)`, `abs(x)`, `min(...)`, `max(...)`, `contains(haystack, needle)`, `lookup(table, key, default)`.
- A syntax error rejects the file at load time. Quote expressions in YAML: `"=geometry.type == 'Point' ? geometry.coordinates[1] : geometry.coordinates[0][1]"`.
- A constant string is `"='some text'"`.

Fields:

| Field | Required | Notes |
| :-- | :-- | :-- |
| `entity.external_id` | **yes** | Stable id, unique within this feed. Stored as `<name>:<external_id>`. Records where it is missing or `""` are skipped. |
| `entity.name` | recommended | Label on the globe and the entity card. Falls back to the id. |
| `entity.metadata` | no | Map of output key to path/expression. These are what `display.fields` and `display.color_by` read as `metadata.<key>`. Missing values are dropped. |
| `observation.latitude` / `longitude` | **yes** | Decimal degrees. **GeoJSON order is `[lon, lat]`**: latitude is `coordinates[1]`. Records without finite coordinates are skipped, never drawn at 0,0. Strings like `"42.27"` are fine. |
| `observation.timestamp` | no | Epoch seconds, epoch ms, or any date string. Omit it if the feed has none (ingest time is used). Never map it to `"now"`. |
| `observation.altitude` | no | Metres. Use `observation.scale: { altitude: 1000 }` for km. |
| `observation.speed`, `heading` | no | Numbers, default 0. |
| `observation.optional` | no | `true` for feeds where only some records have coordinates (RSS). Unlocated records are dropped quietly. |

**Do not set `entity.category`.** It defaults to `layer.id`, which is what the legend and the backend tests expect.

Optional `filter:` is a list of rules; a record must pass all of them:

```yaml
filter:
  - field: 'properties.date'
    not_empty: true
  - field: 'type'
    in: ['large_airport', 'medium_airport']
  - expr: 'number(mag) >= 2.5'
```

## Step 4: Choose the layer and the look

`layer:` puts the source in the legend. `display:` controls the marker and the entity card. Both are validated strictly: a bad value rejects the whole file, except an unknown `icon`, which only warns and falls back to `dot`.

```yaml
layer:
  id: eonet_wildfires # lowercase snake_case, ^[a-z][a-z0-9_]*$; use the source name unless several sources share one layer
  name: Wildfires # legend label
  group: Hazards # must be one of the groups below
  description: NASA EONET open wildfire events, past 60 days

display:
  icon: fire # must be one of the icon keys below
  color: '#ff6d00' # hex, quoted
  size: 1.0 # (0, 10]
  ttl: '30d' # delete entities whose own timestamp is older than this; omit if the feed's dates can be old
  fields: # entity card rows, in order
    - { path: metadata.category, label: Category }
    - { path: metadata.magnitude, label: Magnitude, format: number, precision: 1 }
    - { path: timestamp, label: Last position, format: datetime }
    - { path: metadata.url, label: EONET record, format: link }
```

**Layer groups** (`layer.group`, exact spelling): `Aviation`, `Maritime`, `Space`, `Hazards`, `Weather`, `Environment`, `Conflict`, `Infrastructure`, `Cyber`, `News`, `Other`.

**Icon keys** (`display.icon`): `dot`, `plane`, `helicopter`, `ship`, `satellite`, `rocket`, `iss`, `quake`, `volcano`, `fire`, `storm`, `lightning`, `flood`, `tsunami`, `radiation`, `nuclear`, `biohazard`, `factory`, `power`, `cable`, `tower`, `antenna`, `port`, `airport`, `military`, `conflict`, `explosion`, `alert`, `news`, `shield`, `bug`, `buoy`, `balloon`, `camera`, `pin`. (Defined in `backend/src/engine/layer-display.ts` `ICON_KEYS` and drawn by `frontend/src/components/markerIcons.ts`.) Pick the closest one; `pin` is a good generic choice.

Other `display` keys:

- `fields[].path` reads the stored entity: `metadata.<key>`, `name`, `timestamp`, `altitude`, `latitude`, `longitude`. `format`: `text` (default), `number` (+ `precision` 0-10), `datetime`, `link` (http/https only), `bool`. Optional `prefix` / `suffix`.
- `color_by`: colour per entity from a value. Exactly one of `stops` (ascending `[number, '#hex']` pairs, interpolated) or `map` (exact match on the stringified value), plus optional `default`:
  ```yaml
  color_by:
    field: metadata.magnitude
    stops: [[0, '#ffd166'], [3, '#ff9e00'], [5, '#ff3b3b']]
  ```
- `rotate: true` turns the icon to its heading (for `plane`, `helicopter`, `ship`, `rocket`). `trail: { enabled: true, max_points: 50 }` draws a track for moving things (use with `recording.mode: append`).
- `max_visible`: most entities drawn for this layer (default 2000, max 5000).

## Step 5: Transport and recording

```yaml
transport:
  type: http_poll
  url: 'https://...'
  headers:
    Accept: 'application/json'
  timeout: '30s' # per attempt, default 10s
  interval: '30m' # poll period, default 60s. Match how often the feed changes; be polite.
  retry:
    max_attempts: 3
    backoff: exponential # exponential | linear | fixed; anything else rejects the file
    initial_delay: '5s'
    max_delay: '60s'

recording:
  mode: upsert # upsert: one row per entity (events, sensors, places). append: keep a track (ISS, aircraft).
```

Durations: `'1500ms'`, `'30s'`, `'5m'`, `'24h'`, `'7d'`, or a bare number of seconds.

Some APIs (Wikipedia, for example) reject requests without a descriptive User-Agent. Add one under `headers`, e.g. `User-Agent: 'WolvSec-OSINT/1.0 (student project)'`.

**Secrets.** Never paste a key into the YAML. Write `${MY_API_KEY}` in `url`, `headers` or `auth`, and put `MY_API_KEY=...` in `backend/.env` (gitignored). A source whose variable is unset is skipped at startup with `source <name> disabled: missing env MY_API_KEY`.

## Step 6: Write the file

Save as `sources.d/<name>.yaml`. `name` must be unique across `sources.d/`, lowercase snake_case, and should match the file name. Start from a copy of `sources.d/eonet_wildfires.yaml` and change every value; keep the key order. Check `display.ttl` against the feed: it is measured from each record's own timestamp, not from when it was fetched, so records dated older than the ttl are deleted by the retention sweep within a minute. If the feed reports start dates that can be weeks or years old (volcano events, static datasets), delete the `ttl` line. Required top-level keys: `name`, `source_type` (any short string naming the upstream), plus `display_name` (shown in the source list) and `layer_type` (set it to the same value as `layer.id`). Keep `schema_version: 1` (any other value rejects the file).

Do not add keys the engine does not know (`kind`, `labels`, `cache`, `history`, ...). Unknown keys are ignored silently, so they only mislead.

## Step 7: Verify

1. **The file loads** (no server needed). From the repository root:

   ```bash
   cd backend && npx tsx -e "
   const { loadSourcesFromDir } = require('./src/engine/yaml-loader');
   for (const s of loadSourcesFromDir('../sources.d'))
     console.log(s.name, s.layer.id, s.layer.group, s.display.icon, s.display.color);"
   ```

   Your source must be listed with the group, icon and colour you chose. If it is missing, the line above it reads `Skipping invalid source definition <path>: <problems>`; fix every problem listed. A line `unknown display.icon "x", using "dot"` means the icon key is wrong.

2. **The mapping produces points.** Fetch the URL and run a few records through the mapper; every one should give real coordinates:

   ```bash
   cd backend && npx tsx -e "
   const { loadSourcesFromDir } = require('./src/engine/yaml-loader');
   const { parsePayload } = require('./src/engine/parsers');
   const fm = require('./src/engine/field-mapper');
   (async () => {
     const c = loadSourcesFromDir('../sources.d').find(s => s.name === '<name>');
     const body = await (await fetch(c.transport.url, { headers: c.transport.headers })).text();
     const recs = parsePayload(body, c.parser.format, c.parser.records_path, c.parser.max_records, c.parser);
     const ctx = fm.expressionContext(c);
     const kept = recs.filter(r => fm.passesFilter(r, c.filter, ctx));
     const out = kept.map(r => fm.mapRecord(r, c, c.name)).filter(Boolean);
     console.log(recs.length, 'records,', kept.length, 'after filter,', out.length, 'mapped');
     console.log(out.slice(0, 2).map(o => o.entity));
   })();"
   ```

   `0 mapped` means `records_path`, the id or the coordinate paths are wrong (check `[lon, lat]` order).

3. **Restart the backend.** There is no hot reload for sources: `SOURCES_DIR` is read once at startup. Stop `make dev` (Ctrl+C) and run `make dev` again. Watch the backend log for `Error polling source <name>` (network/HTTP/parse failure) or `skipped N record(s) with missing id/coordinates`.

4. **The API has data** (backend on port 4000, or your `PORT`):

   ```bash
   curl -s "http://localhost:4000/api/entities?source_id=<name>&limit=5"
   curl -s http://localhost:4000/api/sources   # your source, with its resolved layer + display
   ```

   `total` should be above 0 after the first poll (the first poll runs right after startup). Wait about 70 seconds and run the first curl again: if `total` dropped to 0, the retention sweep deleted everything because `display.ttl` is shorter than the age of the records' timestamps. Remove or raise the `ttl`. Neither the log nor `make test` reports this.

5. **Look at the globe** at http://localhost:3000. The layer appears in the legend under its `group` with its icon, the markers use your colour, and clicking one shows the `display.fields` rows.

6. **Tests and formatting.** `make test` checks that every source that loads from `sources.d/` has a declared `layer` and `display` and a category equal to `layer.id` (an invalid file is skipped rather than failed, so step 1 is the real load check). `npm run format:check` covers `sources.d/*.yaml`; run `make format` if it flags your file.
