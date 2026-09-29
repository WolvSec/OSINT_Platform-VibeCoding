# OSINT Platform (Vibe Coding starter)

A small open-source intelligence dashboard: public data feeds plotted live on a 3D Cesium globe. Each feed is one YAML file in `sources.d/`. You add feeds by describing them to an AI coding tool, which writes the YAML for you.

This repo is the starter kit for the WolvSec talk **"Make your own OSINT platform"**. It ships with one source (NASA EONET wildfires, no API key) so the globe works on first run. Your job is to add more.

## Credits

- Based on Lenin Alevski's [Vibe Coding an OSINT Platform](https://github.com/Alevsk/vibe-coding-osint-platform) workshop from the DEF CON 34 Recon Village.
- Stripped down from [mk-osint](https://github.com/ayushmk7/mk-osint), a fuller build of that workshop with 100+ sources.

## Quickstart

You need **Node.js 22.22.2 or newer** (`node -v`), npm and git. `make` is optional; each target is a thin wrapper around an npm script.

```bash
# Click "Use this template" (or fork) on GitHub first, then clone your copy:
git clone https://github.com/<you>/OSINT_Platform-VibeCoding.git
cd OSINT_Platform-VibeCoding

make install   # npm install (root + backend + frontend workspaces)
make dev       # backend on :4000, frontend on :3000
```

Open **http://localhost:3000**. Wildfire markers show up after the first poll, a few seconds after startup.

No `make`? Use `npm install` and `npm run dev`.

### Docker (optional)

```bash
make docker-up     # build and start one container, then open http://localhost:4000
make docker-down   # stop it (the database volume is kept)
```

`sources.d/` is mounted into the container. After adding a source, run `docker compose restart`.

## Repo map

```
sources.d/                 data sources, one YAML per feed (the only folder you need to touch)
skills/onboard-source/     instructions + examples that teach an AI tool to write a source
backend/                   Node + Express + SQLite: loads sources.d, polls feeds, serves /api and a WebSocket
frontend/                  React + Cesium globe
docs/                      source schema, API, architecture, development notes
```

## Your first source: volcanoes

NASA EONET also tracks volcanoes, in the same format as the wildfires feed:
`https://eonet.gsfc.nasa.gov/api/v3/events/geojson?category=volcanoes&status=open`

Paste this into your AI tool of choice, from the repo root:

> Read `skills/onboard-source/SKILL.md` and follow it. Use `sources.d/eonet_wildfires.yaml` as the template. Add a new source for NASA EONET open volcano events from `https://eonet.gsfc.nasa.gov/api/v3/events/geojson?category=volcanoes&status=open`. Put it in the `Hazards` group with the `volcano` icon. Volcano events keep their eruption start date, which can be months old, so do not copy the template's `ttl`. Run the verification steps in the skill and show me the output.

Then restart `make dev` (sources load only at startup) and look for the new layer in the legend.

Stuck? Diff your file against `sources.d/eonet_wildfires.yaml`. Almost everything carries over, except `ttl`: if the layer shows up and then empties a minute later, delete that line.

## More ideas

Same prompt, different URL. Some keyless feeds to try:

- **Wikipedia articles near Ann Arbor**: `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=42.2780%7C-83.7382&gsradius=10000&gslimit=100&format=json` (JSON, records at `query.geosearch`, id `pageid`, coordinates `lat`/`lon`).
- **USGS earthquakes**: `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson` (GeoJSON; colour by magnitude).
- **ISS position**: `https://api.wheretheiss.at/v1/satellites/25544` (a single JSON object; use `recording.mode: append` and a trail).
- **Other EONET categories**: `severeStorms`, `seaLakeIce`, `floods`, `dustHaze`, and more at `https://eonet.gsfc.nasa.gov/api/v3/categories`.
- Anything else with coordinates in it. A feed without lat/lon can't go on the map (the Tor Onionoo API, for example, no longer includes them).

`skills/onboard-source/examples/` has four finished sources (JSON, GeoJSON, CSV, RSS) to crib from.

## AI tools that cost nothing (or close to it)

Any tool that can read files in this repo and run shell commands works. Point it at `skills/onboard-source/SKILL.md`.

- **GitHub Copilot**: free for students through the [GitHub Student Developer Pack](https://education.github.com/pack). Use agent mode in VS Code.
- **Gemini CLI**: free tier with a personal Google account.
- **OpenRouter**: free models (`:free` suffix) you can plug into agent tools like Aider, Cline or opencode.
- **Ollama**: run a model locally, no account needed. Smaller models may need a nudge to follow the skill exactly.
- **Claude Code** and **OpenAI Codex CLI** read `AGENTS.md` / `CLAUDE.md` in this repo automatically.

## Share it

Post a screenshot of your globe in the **WolvSec Discord**. To share a source with everyone, see [CONTRIBUTING.md](CONTRIBUTING.md).

## Docs

- [docs/data-sources.md](docs/data-sources.md): the full YAML schema
- [docs/development.md](docs/development.md): commands, environment variables, tests, Docker
- [docs/api.md](docs/api.md): REST and WebSocket API
- [docs/architecture.md](docs/architecture.md): how the pieces fit together
