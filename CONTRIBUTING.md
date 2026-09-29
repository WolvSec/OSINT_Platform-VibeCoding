# Contributing

## Keep it in your fork

Most sources can just live in your own fork or template copy. Commit your `sources.d/*.yaml` files there and you're done.

## Share a source with everyone

Open a pull request against [WolvSec/OSINT_Platform-VibeCoding](https://github.com/WolvSec/OSINT_Platform-VibeCoding) that adds one file under `sources.d/` (or under `skills/onboard-source/examples/` if it makes a good teaching example).

A good source PR:

- needs no API key, or reads it from `${ENV_VAR}` and lists the variable in `backend/.env.example`;
- has `layer:` and `display:` blocks with a valid group, icon and colour (see `skills/onboard-source/SKILL.md`);
- polls politely (`transport.interval` no faster than the feed changes);
- passes the checks CI runs:

```bash
npm run format:check
make lint test build
```

Please don't PR a volcanoes source. That one is the first challenge for the next person.

Code changes are welcome too. Keep them small, add a test, and use [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`).
