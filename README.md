# Knight Chess — ready for GitHub, Vercel, Render, and Neon

This is the complete updated source project: React frontend, Django API, PostgreSQL persistence, Stockfish integration, profiles, lessons, puzzles, bots, and multiplayer rooms.

**You do not need to change source code before hosting.** Enter your own service URLs and secrets in the hosting dashboards, following [Deployment_Guide.md](Deployment_Guide.md).

## Download Knight Chess

Download the latest Windows and Linux installers:

[Download Knight Chess](https://github.com/adithyanhp/Knight-Chess_DesktopApp/releases/latest)

## Start here

1. Extract this ZIP into a fresh folder. Open the inner **knight-chess** folder that contains **package.json**.
2. Follow [Deployment_Guide.md](Deployment_Guide.md) for GitHub → Vercel → the Render setup form → Neon → finish Render and connect Vercel.
3. Use [Deployment_Checklist.md](Deployment_Checklist.md) as a short reference after reading the guide.
4. For Windows local development without Docker, use [Local_Setup_Guide.md](Local_Setup_Guide.md).

GitHub stores code. Vercel serves React. Render runs Django and Stockfish. Neon stores PostgreSQL data. Your computer does not need Docker to deploy: Render builds the included backend Dockerfile.

## Hosting changes already applied

- Vercel build configuration is included in **vercel.json**. Keep Vercel's Root Directory at the repository root.
- Django accepts Neon's complete **DATABASE_URL**, including its SSL options. Local **POSTGRES_*** variables remain supported.
- Django automatically allows its Render hostname and accepts your exact frontend origin through **CORS_ALLOWED_ORIGINS**.
- The backend container installs Stockfish, waits briefly for the database, applies migrations, and starts Gunicorn on Render's port.
- The frontend handles a sleeping server with a bounded connection check. Mutations are never automatically replayed and game polling does not overlap.
- The website does not generate or expose a full source-code download. Manual packaging writes to **release/**, outside the public website.
- Secret files, virtual environments, installed dependencies, and build output are excluded from Git/source exports.

The interface and artwork are original. Knight is independent of Chess.com and the players referenced by its training features.

## Features

| Area | Included behavior |
| --- | --- |
| Chessboard | Click or drag to move, legal-move hints, captures, castling, en passant, promotion, board flipping, and coordinates a–h / 1–8. |
| Practice opponents | Five bots: Magnus Carlsen, Hikaru Nakamura, Viswanathan Anand, Garry Kasparov, and Judit Polgár. Each has Beginner, Club, Advanced, and Master levels. |
| Multiplayer | Two players on one device, or separate signed-in accounts in a private room on your Django server. |
| Clocks | 10, 15, or 20 minutes per player, without increment. Games finish on timeout and show the result; the server checks whether timeout should instead be a draw. |
| Profiles | Username, display name, profile picture, country, bio, game history, achievements, XP, and progression levels. |
| Puzzles | Unlimited generated mate-in-one practice with verified solutions, plus curated mating patterns. |
| Learning | Thirty lessons with explanations, quizzes, and board practice across fundamentals, tactics, openings, defense, strategy, calculation, and endings. |
| Coach | Guided study paths and training advice with a Magnus-inspired presentation. |
| Game review | Move replay, evaluations, suggested moves, move labels, estimated accuracy, and PGN import/export. |
| Opening recognition | More than 70 curated opening lines with names, ECO codes, and short explanations. |
| Customization | Six board themes, two piece styles, piece colors, coordinates, sounds, legal-move hints, promotion preferences, and automatic board flipping. |

**Board themes and piece appearance are changed only in Settings.** The board’s settings link opens that page.

XP levels track activity in this app; they are not FIDE or online chess ratings. Same-device games count as practice and do not assign a personal win to either account.

## Play, learn, and review

1. In **Play**, choose a computer opponent or **Multiplayer → Same device**. Pick the time control and start the game.
2. For separate devices, create accounts on the same Django installation, select **Online room**, and share the room code with the other player.
3. Use **Puzzles** for repeated mating practice. Each generated solution is checked against legal chess moves and actual checkmate.
4. Work through **Learn** at your own pace. All 30 lessons are available from the start; quizzes and practice positions reinforce each topic.
5. Open **Game Review** after a game, or import a PGN. Step through the moves and export the game when needed. Live multiplayer games cannot receive server analysis before they finish.
6. Edit your profile and appearance in **Settings**. **Settings → Your data** exports a JSON backup without your password or sign-in token.

Opening recognition matches move-sequence prefixes. It is a curated catalog, not a complete database that identifies every transposition.

The unlimited puzzle generator focuses on **mate in one**. It is not a broad imported tactical collection or an unlimited multi-move puzzle curriculum. Generated positions can repeat across sessions; browser generation avoids repeats within the current session.

The learning path progresses from beginner topics to advanced study habits. It is a practical curriculum, not a guarantee of grandmaster strength. The named bots and coach are independent training features, not endorsements, exact recreations of the players’ strength, or access to the real players.

## Engines and analysis

The browser engine uses bounded alpha-beta search and a positional evaluation in a Web Worker so the board stays responsive. The four levels vary its search budget. “Master” is its highest setting, not a certified playing-strength claim.

The Django image installs Stockfish. Its four settings use Skill Levels 0, 6, 14, and 20; the highest setting uses a one-second move budget. Actual strength depends on hardware and available thinking time. Without an available Stockfish executable, the backend reports its limited local search or material/positional fallback.

Review accuracy is an **estimated training score**, not Chess.com’s formula or an official rating. Short searches can miss tactics. Browser review limits search time to keep long games responsive; any remaining moves receive static evaluation and an `unrated` label. Accuracy excludes those unrated moves, and the result reports analysis coverage.

## Persistence and offline use

Browser profiles, preferences, progress, and local games are saved on the current device. Clearing the browser’s site data removes them. Export a backup first if you want to retain a copy.

Signed-in account records, connected games, server-awarded XP, and supported progress updates live in PostgreSQL. Existing anonymous browser games are not automatically uploaded or merged into the account’s server history. Device data and server records have separate storage lifecycles.

Production builds include a service worker that caches the app, piece assets, and chess engine after the first successful online load. Once installation completes, browser bots, same-device chess, lessons, and local puzzles can run without an Internet connection. Accounts, private rooms, and Stockfish still require the Django server.

For reliable offline loading, use the self-hosted app at `localhost` or over HTTPS. Service workers do not install on ordinary HTTP LAN addresses. The development server does not register the production service worker.

## Local frontend development

Use Node.js 24. From this folder:

```sh
npm ci
npm run dev
```

The Vite development server forwards **/api** to **http://127.0.0.1:8000**. Start Django separately using the Windows local guide or the backend documentation.

For a production frontend, configure **VITE_API_URL** before building. For the hosted setup, its value is **https://YOUR-RENDER-HOST.onrender.com/api**. Then:

```sh
npm run build
```

Vercel supplies that variable from its dashboard. Changing it requires a new frontend deployment.

## Optional local Docker setup

Docker is optional. If you already have it installed:

```sh
python backend/setup_local.py
docker compose up --build -d
```

Open **http://localhost:8080**. The database remains in the named PostgreSQL volume when the containers stop. Removing that volume deletes its data.

## Verification

Frontend checks:

```sh
npm test
npm run build
```

Backend checks, with the requirements installed, from the backend directory on a Unix-like shell:

```sh
SQLITE_TEST=1 python manage.py test chessapp
SQLITE_TEST=1 python manage.py check
```

The test override uses SQLite and does not replace the PostgreSQL cloud configuration. See [VERIFICATION.md](VERIFICATION.md) for the checks performed for this delivered release and the limits of those checks.

## Export the source again

From the project root:

```sh
npm run package:source
```

The result is **release/knight-chess-hosting-ready.zip**. The script includes source, deployment configuration, documentation, and an optional LICENSE/COPYING if you add one. It excludes secrets, Git metadata, installed dependencies, runtime data, and build output.

**SOURCE_VERSION.json** inside the ZIP records the version and SHA-256 hashes of the included files. The normal **npm run build** command does not create a source ZIP.

## Project map

| Path | Purpose |
| --- | --- |
| frontend/src/components/ | Board, game modes, account settings, lessons, puzzles, and review |
| frontend/src/chess/ | Browser chess engine, workers, and chess tests |
| frontend/src/lib/ | API connection, storage, and server-game normalization |
| frontend/src/data/ | Lesson content, opening catalog, and puzzles |
| backend/chessapp/ | Django models, accounts, games, rooms, engine integration, and tests |
| backend/config/ | Django configuration and database URL support |
| backend/Dockerfile | Render's Django and Stockfish image |
| vercel.json | Frontend build and service-worker cache configuration |
| render.yaml | Optional Render Blueprint for the backend only |
| docker-compose.yml | Optional local PostgreSQL, Django, and nginx setup |
| offline-plugin.js | Offline app-shell service worker |

## Licensing and third-party components

No new project-wide open-source license has been selected on your behalf. The deployment guide assumes a personal private repository. Dependencies retain their upstream licenses, including the GPL terms of python-chess and Stockfish; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Choose an appropriate project license before a public open-source release. A private repository does not make the deployed website private.

For the API contract, see [backend/README.md](backend/README.md).


## License

The project's original code is licensed under the GNU General
Public License, version 3 only. See LICENSE for the full terms.

Third-party components retain their respective licenses.
See THIRD_PARTY_NOTICES.md.
