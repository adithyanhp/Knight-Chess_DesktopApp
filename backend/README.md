# Knight backend

Python 3.12, Django 5.2, Django REST Framework, PostgreSQL, and python-chess.
The Docker image includes the local Stockfish engine. No paid engine API is needed.

## Cloud backend: Render and Neon

Use the project-root **Deployment_Guide.md** for the complete GitHub → Neon →
Render → Vercel setup. No application source edits are required. Dashboard
environment values still need your own database URL and frontend origin.

For the backend, create a Render **Web Service** with **Docker** runtime and
**backend** as the Root Directory. The Dockerfile and build context are then
`./Dockerfile` and `.`. Set the health-check path to `/api/health`. The optional
root `render.yaml` uses the same configuration.

### Render environment variables

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | The complete PostgreSQL connection URL copied from Neon, including its TLS query parameters. |
| `DJANGO_SECRET_KEY` | A long random secret; keep it stable between deploys. The Blueprint can generate it. |
| `DJANGO_DEBUG` | `0` for the hosted backend. This is also the code default. |
| `CORS_ALLOWED_ORIGINS` | The exact frontend origin, such as `https://your-project.vercel.app`. Separate multiple trusted origins with commas. |
| `SQLITE_TEST` | `0` for hosting. SQLite is enabled only by explicitly setting this to `1` for tests. |
| `STOCKFISH_PATH` | `/usr/games/stockfish`, already installed in the Docker image. |

Render supplies `RENDER_EXTERNAL_HOSTNAME`; Django automatically adds it to its
allowed hosts. You do not need to set `DJANGO_ALLOWED_HOSTS` for Render's default
hostname. If you attach a custom backend domain, set `DJANGO_ALLOWED_HOSTS` to
that hostname (no scheme or path); Render's default hostname remains included.
Render also supplies `PORT`. Gunicorn binds to `0.0.0.0:$PORT`, falling back to
port 8000 only when `PORT` is absent.

Enter CORS origins without paths or trailing slashes. Whitespace around comma-
separated origins is trimmed, but no wildcard is added. For example, a production
Vercel hostname and a custom frontend domain must each be listed. A new Vercel
preview URL is not automatically trusted. Authentication uses the Authorization
header; database credentials and `DJANGO_SECRET_KEY` belong only on the backend.

### Neon connection handling

`DATABASE_URL` takes precedence over the separate `POSTGRES_*` local settings.
Both `postgres://` and `postgresql://` are supported. Copy the connection URL
itself, without a `psql` command or surrounding shell quotes. Percent-encoded
usernames, passwords, and database names are decoded once. Explicit `sslmode`
and `channel_binding` parameters are preserved. Connections default to
`sslmode=require` and a ten-second connection timeout; remote URLs cannot
silently downgrade to unencrypted transport. Stronger `verify-ca` or
`verify-full` settings are also accepted.

Neon's pooled URLs are supported. Server-side cursors are disabled for URL-based
connections so transaction pooling does not strand a cursor on another
connection. Existing connections are health-checked before reuse. The image
includes CA certificates as well as Stockfish. `DATABASE_URL` is parsed directly
into Django/psycopg settings and is never passed to a shell or printed by the
configuration parser. Unsupported or duplicate URL query parameters fail with a
sanitized configuration error instead of silently overriding credentials.

### Startup and health

The image runs as a non-root user. `start.sh` first waits for database readiness,
then runs `manage.py migrate --noinput`, and only then replaces the startup shell
with Gunicorn using **one worker and two threads**. Readiness retries are bounded
to ten attempts with two seconds between failed attempts; each database connect
has its configured timeout. A migration failure prevents serving an incomplete
schema. This startup flow does not require an interactive Render shell or a
pre-deploy job. Keep the personal backend at one service instance; multi-instance
migration orchestration is outside this setup.

`GET /api/health` runs a real `SELECT 1` against the configured database. A healthy
response is HTTP 200 with `status:"ok"` and `database_reachable:true`. A database
failure returns HTTP 503 with `status:"unavailable"` and
`database_reachable:false`, without database hostnames, passwords, or driver
error details. The existing `service`, `database`, and `stockfish` fields remain.
Health checks require no authentication and are not rate limited. `stockfish`
reports whether the executable file exists; health requests do not start an
engine process.

## Run the full app locally

For manual Windows setup without Docker, follow the project-root
**Local_Setup_Guide.md**. Django reads process environment variables; the guide's
PowerShell step loads the generated `.env` into the process before starting it.
Local `.env` values are not uploaded to Render or Vercel.

### Optional Docker setup

Install Docker with Compose, then run from the project root:

```sh
python backend/setup_local.py
docker compose up --build -d
```

Open <http://localhost:8080>. Create an account inside the app. PostgreSQL data lives
in the named `chess_postgres` volume. `docker compose down` stops the app while
preserving data. Do not add `--volumes` unless you intend to erase the database.

`setup_local.py` creates random Django and database secrets without printing them.
It keeps an existing `.env` intact. Do not commit `.env` to source control.

### Play with another person on the same network

Set `BIND_ADDRESS=0.0.0.0` in `.env`, add the host computer’s LAN IP to
`DJANGO_ALLOWED_HOSTS`, and add `http://YOUR_LAN_IP:8080` to
`CORS_ALLOWED_ORIGINS`. Run `docker compose up --build -d` again. Both people open
that URL, sign in to separate accounts, and join the same room code.
This needs the local network but does not require an Internet chess service.
Shared-board pass-and-play works without accounts or network in the React app.

For access beyond a trusted local network, put the app behind an HTTPS reverse
proxy and configure the correct hosts. Do not expose PostgreSQL; Compose does
not publish its port. The provided default binds the web app to loopback.

## Development and tests

```sh
python -m venv .venv
. .venv/bin/activate
pip install -r backend/requirements.txt
cd backend
SQLITE_TEST=1 python manage.py test chessapp
SQLITE_TEST=1 python manage.py check
```

`SQLITE_TEST=1` is an explicit test override. PostgreSQL is the normal
configuration; a missing `DATABASE_URL` uses the existing `POSTGRES_*` settings
and never silently falls back to SQLite. For server development, configure the
`POSTGRES_*` and `DJANGO_SECRET_KEY` environment variables, run migrations, and start
`python manage.py runserver 0.0.0.0:8000`. `STOCKFISH_PATH` should point to an
installed Stockfish executable. Without it, bots use a limited local search and
reviews use a clearly labeled material/positional heuristic.

The API tests cover authentication, legal and illegal moves, castling, en passant,
underpromotion, checkmate, full-history threefold repetition, timeout with mating
material, timeout draws, multiplayer turn permissions, room occupancy, review
access during live multiplayer, bot replies, puzzle verification, and idempotent
progress/XP awards. Deployment tests cover URL decoding, TLS options, malformed
configuration, Render hosts, exact CORS origins, database readiness retries,
healthy probes, and sanitized health failures. Tests run with SQLite do not verify PostgreSQL row-lock
concurrency; run the same suite against PostgreSQL before an Internet deployment.

## Authentication

Register or log in, then include this header on protected requests:

```http
Authorization: Token YOUR_TOKEN
Content-Type: application/json
```

The API uses header token authentication, not session cookies. Passwords are
hashed by Django. Tokens remain valid until logout; logout revokes the token.
Registration and login are rate limited.

## API contract

Routes have no trailing slash. Most endpoints require authentication. Public
endpoints are health, catalog, auth, and puzzle generation/checking. Anonymous
puzzle solves do not update account progress.

| Method and path | Request | Response |
| --- | --- | --- |
| `GET /api/health` | — | Database readiness, service, database engine, Stockfish file availability; HTTP 503 when DB is unavailable |
| `POST /api/auth/register` | `username`, `password`, optional `display_name` | `{token, user}` |
| `POST /api/auth/login` | `username`, `password` | `{token, user}` |
| `POST /api/auth/logout` | — | `{ok:true}` |
| `GET /api/profile` | — | Current user profile |
| `PATCH /api/profile` | Any of `username`, `display_name`, `avatar`, `bio`, `country`, `settings` | Updated profile |
| `GET /api/games` | — | `{games:[...]}`, newest 50 |
| `POST /api/games` | `mode:"local"` or `"bot"`, `minutes:10/15/20`, `bot_name`, `bot_level:1..4`, `user_color:"w"/"b"` | New game |
| `GET /api/games/{id}` | — | Current authoritative game state |
| `POST /api/games/{id}/move` | `uci`, e.g. `e2e4`, `a7a8n` | Updated game; bot replies automatically |
| `POST /api/games/{id}/resign` | — | Finished game |
| `POST /api/games/{id}/claim-draw` | — | Draw if the position is claimable |
| `POST /api/games/{id}/agree-draw` | — | Agreed draw, owner-only local same-device games |
| `POST /api/games/{id}/review` | — | Per-move analysis and estimated accuracy |
| `POST /api/rooms` | `minutes:10/15/20` | Waiting game with an eight-character `code` |
| `POST /api/rooms/{code}/join` | — | Joined game; clock starts when the second player joins |
| `GET /api/rooms/{code}` | — | Current state; only participants |
| `GET /api/puzzles/next` | — | Generated legal mate-in-one puzzle |
| `POST /api/puzzles/check` | `puzzle_id`, `uci` | `correct`, `message`, `fen`, `xp_awarded` |
| `GET /api/progress` | — | `completed_lessons`, `xp`, `level` |
| `PATCH /api/progress` | `lesson_id` | Updated progress; only curriculum IDs accepted |
| `GET /api/catalog` | — | Five bots, four levels, time controls, opening catalog |

### Profile

Profile fields include `id`, `username`, `display_name`, `avatar`, `bio`, `country`,
`xp`, `level`, `level_progress`, `next_level_xp`, `games_played`, `wins`, `draws`, `losses`,
`practice_games`, `opponent_games`,
`puzzles_solved`, `completed_lessons`, `settings`, `achievements`, `joined_at`.

Avatar is an optional PNG, JPEG, or WebP data URL up to 1.5 MB of encoded text.
Settings is a JSON object up to 12 KB. XP and statistics cannot be patched by the
client. Level is `1 + floor(xp / 250)`. A completed game earns 20 XP and a win earns
30 additional XP; local pass-and-play has no personal win credit. New puzzle
solutions earn 15 XP and new lesson completions 25 XP. A repeated solve of the
same generated position or a repeated lesson completion earns no extra XP.

Game statistics use the complete stored history, not the 50-game history page.
`games_played` includes completed same-device practice games. `wins`, `draws`,
and `losses` count only bot and multiplayer games because a shared-device game
has no unambiguous personal result. `practice_games` and `opponent_games` expose
that distinction. Resigning a waiting room cancels it (`result:"*"`,
`termination:"cancelled"`); cancellation awards no XP and counts as no game.

### Game state and clocks

Game state includes `id`, `code`, `mode`, `white`, `black`, `owner_id`,
`user_color`, `bot_name`, `bot_level`, `initial_fen`, `fen`, `turn`, `moves`,
`minutes`, `white_seconds`, `black_seconds`, `status`, `result`, `termination`,
`opening`, `legal_moves`, `in_check`, `can_claim_draw`, `server_time`, `created_at`.

`white` and `black` are user summaries or null for a bot/empty seat. `moves` holds
`{ply,san,uci,fen,piece,capture,check,white_seconds,black_seconds}`. `opening` is
`{name,eco,description}` and uses a curated prefix catalog rather than a complete
transposition-aware opening database.

Poll a room/game about once per second. Display a local interpolated countdown
between polls; the server is authoritative. It deducts elapsed server wall time
under a database row lock before accepting a move. A move after timeout is
rejected with HTTP 409 and `{error,game}`. The result is `1-0`, `0-1`, or
`1/2-1/2`; timeout is a draw if the opponent lacks mating material. Other
terminations include checkmate, stalemate, insufficient material, automatic
75-move/fivefold draws, claimed draws, and resignation. Complete move history is
replayed, so repetition detection retains position history.

Rooms use transaction-protected seat assignment. Only the actual player to move
can submit a multiplayer move. Review is disabled until a multiplayer game ends.
This personal app uses polling rather than a public matchmaking service.

### Bots and review

The five names are Magnus Carlsen, Hikaru Nakamura, Viswanathan Anand, Garry
Kasparov, and Judit Polgar. These are fictional training bots named after players,
not endorsements, recreations of their exact play, or access to the players.
Stockfish Skill Levels 0, 6, 14, and 20 provide four difficulty settings. Level 4
uses unrestricted Stockfish with a one-second move budget. Actual playing
strength depends on hardware and thinking time.

Review analyzes each move with Stockfish at 40 ms per position and returns
white-perspective evaluation, centipawn loss, suggested best move, a label, and a
short factual explanation. Accuracy is an explicitly estimated training score,
not an official rating or the Chess.com accuracy formula. Short searches can miss
deep tactics. Without Stockfish the response explicitly says “Material and
positional heuristic.”

### Puzzle generation

`GET /api/puzzles/next` procedurally generates legal king-and-queen mating
positions, optionally mirrored to train either color. There is no request/session
cap beyond rate limiting, although positions may repeat. Every solution is
validated by actual checkmate detection; all mating moves are accepted. Puzzle
IDs are server-signed and expire after 24 hours. This endpoint provides focused
mate-in-one practice, not a licensed imported puzzle database.

## Deployment references

- [Render web services and port binding](https://render.com/docs/web-services)
- [Render default environment variables](https://render.com/docs/environment-variables)
- [Render free service limits](https://render.com/docs/free)
- [Neon PostgreSQL connection URLs](https://neon.com/docs/connect/connect-from-any-app)
- [Django database connections and transaction pooling](https://docs.djangoproject.com/en/5.2/ref/databases/)
