# Agent instructions

This repo is a starter OSINT platform: public feeds plotted on a Cesium globe. Users extend it by adding data sources, one YAML file each.

## Repo map

- `sources.d/`: data source definitions, one `*.yaml` per feed. `eonet_wildfires.yaml` is the reference.
- `skills/onboard-source/SKILL.md`: how to write a source. `skills/onboard-source/examples/` has worked JSON, GeoJSON, CSV and RSS sources.
- `backend/`: Node + Express + TypeScript + SQLite. `src/engine/` loads and polls sources (`yaml-loader.ts`, `layer-display.ts`, `expressions.ts`, `field-mapper.ts`, `scheduler.ts`). `src/api/` is the REST API, `src/websocket/` the live feed.
- `frontend/`: Vite + React + Redux Toolkit + CesiumJS globe.
- `docs/`: `data-sources.md` (full YAML schema), `api.md`, `architecture.md`, `development.md`.

## Adding a data source

Follow `skills/onboard-source/SKILL.md` step by step. In short:

- Write exactly one file, `sources.d/<name>.yaml`, modelled on `sources.d/eonet_wildfires.yaml`, with `layer:` (valid `group`) and `display:` (valid `icon`, hex `color`) blocks.
- Do not set `entity.category`; it defaults to `layer.id`.
- Never put API keys in YAML. Use `${ENV_VAR}` and `backend/.env`.
- Sources are loaded once at startup. There is no hot reload: restart the backend (`make dev`) after adding or editing a source, then check `curl "http://localhost:4000/api/entities?source_id=<name>&limit=5"` (port 4000 unless you set `PORT`). Check it again after ~70 s: `display.ttl` is measured from each record's own timestamp, so a too-short ttl silently empties the layer.
- Do not edit `backend/` or `frontend/` to add a source. Change the engine only when the YAML schema genuinely cannot express the feed, and add a test when you do.

## Commands

| Command | What it does |
| :-- | :-- |
| `make install` | `npm install` for root, backend and frontend |
| `make dev` | backend on :4000 and frontend on :3000 (open http://localhost:3000) |
| `make test` | backend Jest + frontend Vitest; also checks every loaded `sources.d/` source has a `layer` and `display` |
| `make lint` | `tsc --noEmit` in both workspaces |
| `make format` / `npm run format:check` | Prettier write / check (CI runs the check) |
| `make build` | compile backend and frontend |

Node 22.22.2 or newer. Environment variables keep the `MKOSINT_` prefix; see `docs/development.md`.
