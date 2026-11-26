# Knight Chess 1.1.0 — release verification

Verified on **26 November 2026** for the source package prepared for GitHub, Vercel, Render, and Neon.

## Completed checks

| Check | Result |
| --- | --- |
| Frontend automated tests (`npm test`) | **17 passed; 0 failed** using Node.js 24.22.3. |
| Production frontend build (`npm run build`) | **Passed** with Vite 6.4.6; generated the app, engine worker, bundled fonts, styles, and offline service worker in `dist/`. |
| Django automated tests | **33 passed** with the explicit SQLite test override and the project's installed Python dependencies. |
| Django system check with production-shaped settings | **Passed**. |
| Backend shell syntax | **Passed** for `backend/start.sh`. |
| Backend startup smoke check | **Passed**: database wait, migrations, and Gunicorn startup completed using a temporary SQLite database and an explicit port; an HTTP health request returned 200 with `database_reachable: true`. |
| Browser interface smoke check | **Passed**: the updated interface loaded, Settings retained personal-data export without a public source download, the server connection banner showed connecting/unavailable states, and a local game accepted `e4`, received the bot's `Nc6` reply, and updated the opening and move list. |

The frontend test suite covers legal engine moves, terminal positions, legal opening lines, puzzle solutions, move review, shared server warm-up, bounded retries of the health GET only, mutation timeouts without replay, cancellation, serial polling, and read-only recovery after an uncertain game-creation response.

The backend suite includes the existing account/game tests and new deployment checks for database-URL parsing, connection options, host/origin handling, real database health checks, and bounded startup readiness.

## What these checks do not establish

- No deployment was made to your GitHub, Vercel, Render, or Neon account. You must complete the dashboard steps in `Deployment_Guide.md` with your own URLs and secrets.
- A Docker daemon and a live Neon/PostgreSQL service were not available for this release verification. The Docker image was not built here, and the real Neon network/TLS connection has not been exercised here.
- The backend smoke check used SQLite only as a temporary test substitute. The deployment configuration uses PostgreSQL with `SQLITE_TEST=0`.
- Stockfish was not installed in the verification environment. Its Docker installation and real engine operation must be confirmed after Render deploys; the guide includes a signed-in bot-game and review check.
- This is not a load test or an assurance of uninterrupted service on free hosting. Free-service startup delays and compute quotas still apply.

## Source archive

The manual `npm run package:source` command creates `release/knight-chess-hosting-ready.zip`. The archive contains the complete source and deployment documentation, rather than installed dependencies or generated build output. Cloud builds install dependencies from the included lockfile and requirements file.

`SOURCE_VERSION.json` inside the ZIP records the release version, creation time, and SHA-256 hashes of every other included file. The archive excludes real environment files, Git metadata, virtual environments, installed packages, local databases, and previous source archives. `.env.example` is an intentionally included template.

The normal frontend build does not create or publish the source ZIP.
