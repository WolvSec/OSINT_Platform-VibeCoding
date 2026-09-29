# Development

How to install, run, test and check the platform locally.

## Prerequisites

- **Node.js 24 or newer** (root `package.json` `engines.node` is `>=24`, enforced by `.npmrc` `engine-strict`). `better-sqlite3` 13 bundles prebuilt binaries, but npm 10 (shipped with Node 22) still runs `node-gyp rebuild` for it, which fails without Visual Studio / Xcode / make. npm 11 (Node 24+) skips that. CI runs Node 24 and the current release on Linux, macOS and Windows.
- **npm**. The repo uses npm workspaces (`backend`, `frontend`) and ships a `package-lock.json`.
- **make**, optional. Every Makefile target wraps an npm script.
- A C/C++ toolchain only if `better-sqlite3` has no prebuilt binary for your platform (it ships win32, darwin and linux, x64 and arm64).
- Internet access, for the data feeds and the globe's map tiles.

## Install

```bash
make install    # same as: npm install
```

Installs the root, `backend` and `frontend` workspaces in one pass. Do not add an `install` script to any `package.json`: npm runs it during `npm install`, so `make install` would loop forever.

## Running

```bash
make dev        # same as: npm run dev
```

| Process | Command | Port | Notes |
| :-- | :-- | :-- | :-- |
| Backend | `tsx watch src/index.ts` (in `backend/`) | 4000 (`PORT`) | REST at `/api/*`, WebSocket at `/ws/telemetry`. Restarts when its TypeScript changes, **not** when a YAML file in `sources.d/` changes. |
| Frontend | `vite` (in `frontend/`) | 3000 | Proxies `/api`, `/config.json` and `/ws` to `http://localhost:4000`. |

Open http://localhost:3000.

**Sources are read once, at startup.** After adding or editing a file in `sources.d/`, stop `make dev` (Ctrl+C) and start it again.

Run one side on its own with `npm run dev --prefix backend` or `npm run dev --prefix frontend`. The Vite proxy target is hard-coded to `localhost:4000` in `frontend/vite.config.ts`; change it too if you change `PORT`.

### Production build

```bash
make build                  # backend: tsc -> backend/dist; frontend: tsc && vite build -> frontend/dist
npm start --prefix backend  # node dist/index.js
```

With `NODE_ENV=production` (or `MKOSINT_SERVE_FRONTEND=true`) the backend also serves `frontend/dist`, so one process on port 4000 is the whole app.

## Environment variables

All optional. Template: [`backend/.env.example`](../backend/.env.example). `dotenv` loads `.env` from the process working directory, which is `backend/` under the npm scripts, so put overrides in `backend/.env` (gitignored).

| Variable | Default | Meaning |
| :-- | :-- | :-- |
| `PORT` | `4000` | HTTP and WebSocket port. |
| `SOURCES_DIR` | `<repo>/sources.d` | Directory of source YAML files. |
| `DB_PATH` | `mk-osint.db` | SQLite file, relative to the working directory (so `backend/mk-osint.db` in dev). |
| `INGEST_ENABLED` | enabled | `false` registers sources without polling them. |
| `MKOSINT_SERVE_FRONTEND` | unset | `true` serves the built frontend from the backend; `false` never does; unset serves it only when `NODE_ENV=production` and the build exists. |
| `MKOSINT_FRONTEND_DIR` | `<repo>/frontend/dist` | Where the built frontend lives. |
| `MKOSINT_APP_NAME` | `WolvSec OSINT` | Browser tab title, delivered through `/config.json`. |
| `MKOSINT_CESIUM_ION_TOKEN` | unset | Cesium ion token, delivered through `/config.json`. Browser-visible by design. |
| `MKOSINT_DEFAULT_GLOBE_STYLE` | `tactical` | Initial globe imagery: `tactical`, `blue_marble`, `night_lights`, `neon_vector`, `terrain_relief` or `holographic`. |
| `MKOSINT_DB_MAX_MB` | `500` | Database size ceiling; above it the oldest observations are pruned. `0` disables the guard. |

API keys for sources are environment variables too. Source YAML references them as `${NAME}` (or `${NAME:-default}`); a source whose variable is unset is skipped at startup with `source <name> disabled: missing env <NAME>`. See [Secrets and environment variables](data-sources.md#secrets-and-environment-variables).

To start from an empty database, stop the backend and delete `backend/mk-osint.db*`.

## Testing

```bash
make test       # backend (Jest) then frontend (Vitest)
```

- Backend: `backend/src/__tests__/*.test.ts` (Jest + ts-jest). `yaml-loader.test.ts` also loads `sources.d/` and checks every loaded source has a declared `layer` and `display` (invalid files are skipped, not failed). Run one file from `backend/` with `npx jest src/__tests__/yaml-loader.test.ts`.
- Frontend: `__tests__/` folders next to the code (Vitest + jsdom, config in `frontend/vite.config.ts`). Watch mode: `npx vitest` from `frontend/`.

## Type checking and formatting

```bash
make lint              # tsc --noEmit in backend, then frontend (there is no ESLint)
make format            # prettier --write "**/*.{ts,tsx,json,md,yaml}"
npm run format:check   # same glob, check only; CI runs this
```

`.prettierignore` skips `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/` and `skills/`. YAML in `sources.d/` **is** checked, so run `make format` after adding a source.

## Docker

One container serves the UI, the REST API and the WebSocket on port 4000.

```bash
make docker-up      # docker compose up -d --build, then open http://localhost:4000
make docker-down    # docker compose down (the data volume is kept)
make docker-build   # build the image only
```

- `Dockerfile`: multi-stage `node:22-slim` build; the runtime stage copies `backend/dist`, `frontend/dist`, production `node_modules` and `sources.d`, runs as the `node` user and starts `node backend/dist/index.js`. A `HEALTHCHECK` calls `GET /api/health`.
- `compose.yaml`: service `osint-platform` on port 4000, named volume `osint-data` at `/data` (database `/data/osint.db`), `./sources.d` bind-mounted read-only, `backend/.env` loaded if present. After changing a source, run `docker compose restart`.

## Continuous integration

`.github/workflows/ci.yml` runs on every push and pull request to `main`/`master` on Linux, macOS and Windows (Node 24 and current): `npm ci`, `npm run format:check`, `npm run lint`, `npm test`, `npm run build`, then `npm run check-source` against the live wildfire feed and a running backend. Reproduce locally with `npm run format:check && make lint test build`.
