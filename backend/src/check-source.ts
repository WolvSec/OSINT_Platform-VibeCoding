/**
 * Check one source without starting the server. From the repo root:
 *
 *   npm run check-source -- <name>
 *
 * Loads sources.d, fetches the feed once, maps the records, and warns when `display.ttl` would
 * expire them. Plain Node, so it behaves the same in bash, zsh, PowerShell and cmd.
 */
import path from 'path';
import dotenv from 'dotenv';
import { loadSourcesFromDir } from './engine/yaml-loader';
import { parsePayload } from './engine/parsers';
import { expressionContext, mapRecord, passesFilter } from './engine/field-mapper';
import { substituteEnv } from './engine/env';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SOURCES_DIR = process.env.SOURCES_DIR || path.resolve(__dirname, '../../sources.d');
const PORT = process.env.PORT || 4000;

function fail(message: string): never {
  console.error(`FAIL ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const name = process.argv[2];
  const sources = loadSourcesFromDir(SOURCES_DIR);
  if (!name) {
    for (const s of sources)
      console.log(s.name, s.layer?.id, s.layer?.group, s.display?.icon, s.display?.color);
    console.log('\nUsage: npm run check-source -- <name>');
    return;
  }

  // 1. The file loads (loadSourcesFromDir already printed why, if it did not).
  const c = sources.find((s) => s.name === name);
  if (!c?.display || !c.layer)
    fail(`${name} did not load; fix the problems printed above (or check the name).`);
  console.log(
    `ok   loads: layer ${c.layer.id} (${c.layer.group}), icon ${c.display.icon}, ${c.display.color}`
  );

  // 2. The mapping produces points.
  // ponytail: http_poll with url + headers only; auth/body/websocket sources are checked by `npm run dev`.
  if (c.transport.type !== 'http_poll' || c.transport.auth || c.transport.body) {
    console.log(
      `skip fetch: ${c.transport.type} transport with auth/body; start the backend to test it`
    );
    return;
  }
  const res = await fetch(substituteEnv(c.transport.url), {
    headers: substituteEnv(c.transport.headers ?? {})
  }).catch((e: Error) => fail(`fetch ${c.transport.url}: ${e.message}`));
  if (!res.ok) fail(`fetch returned HTTP ${res.status} ${res.statusText}`);
  const records = parsePayload(
    await res.text(),
    c.parser.format,
    c.parser.records_path,
    c.parser.max_records,
    c.parser
  );
  const ctx = expressionContext(c);
  const kept = records.filter((r) => passesFilter(r, c.filter, ctx));
  const mapped = kept.map((r) => mapRecord(r, c, c.name)).filter((m) => m !== null);
  console.log(
    `${mapped.length ? 'ok  ' : 'FAIL'} ${records.length} records, ${kept.length} after filter, ${mapped.length} mapped`
  );
  if (!mapped.length) fail('0 mapped: check records_path, external_id and the [lon, lat] order.');
  console.log(mapped.slice(0, 2).map((m) => m.entity));

  // 3. ttl: the retention sweep deletes entities whose own timestamp is older than display.ttl.
  const ttl = c.display.ttl_seconds;
  if (ttl) {
    const cutoff = Date.now() - ttl * 1000;
    const expired = mapped.filter((m) => Date.parse(m.entity.timestamp) < cutoff).length;
    if (expired === mapped.length)
      fail(
        `all ${expired} records are older than ttl ${c.display.ttl}; the layer will empty within a minute. Delete or raise display.ttl.`
      );
    if (expired)
      console.log(
        `warn ${expired} of ${mapped.length} records are older than ttl ${c.display.ttl} and will be deleted`
      );
  }

  // 4. The running backend has data (optional: it only loads sources at startup).
  try {
    const api = await fetch(`http://localhost:${PORT}/api/entities?source_id=${name}&limit=1`);
    const { total } = (await api.json()) as { total?: number };
    console.log(
      total
        ? `ok   backend has ${total} ${name} entities`
        : `note backend has 0 ${name} entities; restart npm run dev to load the source`
    );
  } catch {
    console.log(`note backend not running on :${PORT}; start it with npm run dev`);
  }
  console.log('PASS');
}

main();
