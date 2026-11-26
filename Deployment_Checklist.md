# Deployment Checklist

Read **Deployment_Guide.md** for the full instructions. This updated ZIP already includes the required code changes. Configure your own values in the hosting dashboards; do not edit Python or React files.

## 1. GitHub

- Extract the ZIP into a fresh folder.
- Open the inner **knight-chess** folder containing **package.json**.
- Create an empty **private** repository under your personal GitHub account.
- Do not initialize the GitHub repository with a README, .gitignore, or license.
- Push the extracted source files, not only the ZIP.
- Keep real .env files, installed dependencies, and virtual environments out of Git.

## 2. Vercel first

- Import the GitHub repository into your personal Hobby account.
- Keep Root Directory at the repository root, not frontend.
- The included vercel.json sets Vite, npm ci, npm run build, and dist.
- Use Node.js 24.x.
- Deploy the frontend and copy its stable production origin, such as https://YOUR-PROJECT.vercel.app.
- The frontend can show offline play before its online backend is connected.

## 3. Prepare Render

- New → Web Service → your GitHub repository.
- Branch: main.
- Runtime/Language: Docker.
- Root Directory: backend.
- Dockerfile Path: ./Dockerfile.
- Docker Build Context: .
- Compute plan: Free.
- Health Check Path: /api/health.
- Leave Docker Command empty; the included image handles startup.
- Keep the form open while creating Neon in another browser tab.

## 4. Neon

- Create a Free PostgreSQL project, preferably near your Render region.
- Use PostgreSQL 17 if offered.
- Open Connect and select your database/role.
- Turn connection pooling off for the simple direct connection used by this guide.
- Copy the complete PostgreSQL connection URL, including sslmode=require and channel_binding=require.
- Copy only the URL, without psql, shell quotation marks, or surrounding spaces.

## 5. Finish Render

Add these environment variables:

| Key | Value |
| --- | --- |
| DJANGO_SECRET_KEY | A new long random secret; keep it stable |
| DJANGO_DEBUG | 0 |
| DATABASE_URL | The complete Neon connection URL |
| CORS_ALLOWED_ORIGINS | Your exact Vercel production origin, with https:// and no final slash |
| STOCKFISH_PATH | /usr/games/stockfish |
| SQLITE_TEST | 0 |

Generate a secret in Windows PowerShell with:

~~~powershell
$knightSecretBytes = New-Object byte[] 48
$knightSecretGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$knightSecretGenerator.GetBytes($knightSecretBytes)
[Convert]::ToBase64String($knightSecretBytes)
$knightSecretGenerator.Dispose()
~~~

Deploy. Wait for database migrations and Gunicorn startup to succeed. Copy the actual Render service URL.

Open **https://YOUR-RENDER-HOST.onrender.com/api/health**. Expect status ok, database postgresql, database_reachable true, and stockfish true. The Stockfish field checks file availability; verify a connected bot game and review as well.

## 6. Connect Vercel to Render

In Vercel → Project → Settings → Environment Variables, add:

| Key | Value |
| --- | --- |
| VITE_API_URL | https://YOUR-RENDER-HOST.onrender.com/api |

Enable it for Production and redeploy the frontend. Include /api exactly once, without a final slash. Do not place the database URL, database password, or Django secret in Vercel's frontend variables.

## 7. Verify

- Open the Vercel production domain.
- Create an account and sign in.
- Save a profile change and reload.
- Start a bot game and confirm **Connected to Django**.
- Finish a short game and check its review method.
- Create a room and join with a second account in another browser/private window.
- Keep both players connected during a timed game.

Free Render can take about a minute to wake after being idle. The app now shows its connection attempt. Do not repeatedly submit moves or create another game while waiting. If it reports a failure, check /api/health and retry after the backend is ready.

## Later updates

~~~powershell
git add .
git status
git commit -m "Describe the update"
git push
~~~

Review the staged files before committing. Automatic deployments rebuild the connected services. New model migrations must be generated in development and committed. Changes to Vercel environment variables require a new frontend deployment.

Hosting quotas and plan details can change. See the full guide for the official references and free-plan limits.
