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
- Check the file with `npm run check-source -- <name>` (loads it, fetches the feed, maps the records, flags a `display.ttl` shorter than the records' age). It must end in `PASS`.
- Sources are loaded once at startup. There is no hot reload: restart the backend (`npm run dev`) after adding or editing a source, then run `npm run check-source -- <name>` again to see the entity count.
- Do not edit `backend/` or `frontend/` to add a source. Change the engine only when the YAML schema genuinely cannot express the feed, and add a test when you do.

## Commands

Use the `npm` commands: they work in every shell. `make <target>` does the same on macOS and Linux, but Windows usually has no `make`.

| Command | What it does |
| :-- | :-- |
| `npm install` | install root, backend and frontend |
| `npm run dev` | backend on :4000 and frontend on :3000 (open http://localhost:3000) |
| `npm run check-source -- <name>` | load, fetch and map one source; flags a too-short `ttl` |
| `npm test` | backend Jest + frontend Vitest; also checks every loaded `sources.d/` source has a `layer` and `display` |
| `npm run lint` | `tsc --noEmit` in both workspaces |
| `npm run format` / `npm run format:check` | Prettier write / check (CI runs the check) |
| `npm run build` | compile backend and frontend |

Node 24 or newer (Node 22 ships npm 10, which tries to compile `better-sqlite3` and fails without a C++ toolchain). Environment variables keep the `MKOSINT_` prefix; see `docs/development.md`.
