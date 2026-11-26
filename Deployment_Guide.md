# Knight Chess — GitHub, Vercel, Render, and Neon deployment guide

**For the updated hosting-ready source ZIP. Provider documentation checked: 26 November 2026.**

This guide puts your React frontend on Vercel, your Django backend and Stockfish on Render, and your PostgreSQL database on Neon. GitHub stores the complete project and supplies the code to Vercel and Render.

**The necessary source-code changes are already included in this ZIP.** Follow the dashboard settings and commands below. You do not need to edit Python, JavaScript, Docker, or configuration files to complete this deployment. You also do not need Docker, Python, Node.js, or PostgreSQL installed on your computer for these cloud steps. Git for Windows is the only local development tool used here; Render builds the Docker image on its servers.

The sequence is **GitHub → Vercel → prepare Render → Neon → finish Render → connect Vercel**. Preparing the Render form before creating Neon lets you choose nearby hosting regions. You finish the Render deployment after you have the database connection string.

## What each service does

| Service | What you put there | What you get |
| --- | --- | --- |
| GitHub | The complete extracted source, in a private repository under your personal account | A repository such as `https://github.com/YOUR_USERNAME/knight-chess` |
| Vercel Hobby | The React/Vite frontend built from the repository root | Your website, such as `https://YOUR-SITE.vercel.app` |
| Render Free web service | The Docker service in `backend/` | Your API, such as `https://YOUR-API.onrender.com` |
| Neon Free | A PostgreSQL 17 database | A private database connection string beginning with `postgresql://` |

The URLs in this guide are examples. Replace `YOUR_USERNAME`, `YOUR-SITE`, and `YOUR-API` with the actual values assigned to your accounts and deployments.

## Before you start

1. Download the **updated hosting-ready ZIP** supplied with this guide.
2. In Windows File Explorer, right-click the ZIP and choose **Extract All**. Extract into a **new folder**, for example `C:\Projects\KnightHosting`. Keep your previous local copy separately. A fresh extraction avoids carrying old configuration or mixing different versions of the project.
3. Open the extracted `knight-chess` folder. This is the project root: it should contain `package.json`, `vercel.json`, `frontend`, `backend`, and this guide.
4. Install [Git for Windows](https://git-scm.com/install/windows), using the normal installer options, then reopen PowerShell so that Windows can find `git`.
5. Have accounts available at [GitHub](https://github.com), [Vercel](https://vercel.com), [Render](https://render.com), and [Neon](https://console.neon.tech). Choose their personal/free options for this guide.

Use the folder that directly contains `package.json` when a step says **project root**. If extraction created two nested folders, open the inner one that contains that file.

The included ignore files exclude local secrets, installed dependencies, and generated build output from Git. The hosting build also leaves the full-source download ZIP out of the public frontend. Your source stays in your private GitHub repository. The production website itself can still be visited at its public URL; repository privacy and website access are separate settings.

No new project license has been chosen for you. For this personal private repository, leave GitHub's license selection empty and retain `THIRD_PARTY_NOTICES.md` and the dependencies' existing notices.

## 1. Upload the complete project to GitHub

### 1.1 Create an empty private repository

1. Sign in to [GitHub](https://github.com).
2. Use **+ → New repository**, or open [github.com/new](https://github.com/new).
3. Under **Owner**, choose your personal account.
4. Set **Repository name** to `knight-chess`, or choose another unused name.
5. Choose **Private**.
6. Leave **Add a README** and **Add .gitignore** unselected. For the license dropdown, keep **None / No license**. The extracted source already contains its documentation and ignore rules; starting with an empty repository also makes the first push straightforward.
7. Click **Create repository**.
8. Keep this page open. Copy the repository's **HTTPS** address, which looks like `https://github.com/YOUR_USERNAME/knight-chess.git`.

Choose a repository owned by your personal GitHub account for this Hobby-plan setup. Vercel documents its GitHub integration and private-repository support in [Vercel for GitHub](https://vercel.com/docs/git/vercel-for-github).

### 1.2 Open PowerShell in the extracted project root

Open PowerShell and move into the folder you extracted. Adjust the path to match your computer:

```powershell
cd "C:\Projects\KnightHosting\knight-chess"
git --version
Get-ChildItem
```

The file listing should show `package.json`, `vercel.json`, `frontend`, and `backend`. This confirms that you are about to upload the complete application. Uploading only the `frontend` folder would leave Vercel without the root build files and Render without the backend.

### 1.3 Create your first commit and push it

Run the commands below one line at a time. Replace the name, email, and repository address before running them. The email can be your GitHub-provided private `noreply` address from **GitHub Settings → Emails**.

```powershell
git init -b main
git config user.name "Your Name"
git config user.email "YOUR_GITHUB_EMAIL"
git add .
git status --short
```

Review the staged files. You should see application files and documentation. `.env.example` is a template and can be included. Actual secret files such as `.env` should be absent, as should `node_modules` and `.venv`.

Then run:

```powershell
git commit -m "Add Knight Chess hosting-ready source"
git remote add origin https://github.com/YOUR_USERNAME/knight-chess.git
git push -u origin main
```

Git for Windows may open your browser for GitHub sign-in. Complete that sign-in with the account that owns the repository. If you chose a different repository name, use the exact HTTPS address copied from GitHub.

Refresh the repository page. Confirm that `package.json` and `vercel.json` are visible at the top level, with the `frontend` and `backend` folders beside them. You should see individual files, rather than only the original ZIP file.

These commands follow GitHub's [instructions for importing locally hosted code](https://docs.github.com/en/migrations/importing-source-code/using-the-command-line-to-import-source-code/adding-locally-hosted-code-to-github).

## 2. Deploy the frontend on Vercel

This first deployment gives you the permanent frontend origin that Render will allow. The site can display its local chess features before the backend is connected.

### 2.1 Import your GitHub repository

1. Sign in to [Vercel](https://vercel.com).
2. Use your personal **Hobby** workspace for this personal project.
3. Choose **Add New → Project**, or open [vercel.com/new](https://vercel.com/new).
4. Connect GitHub when prompted. Give Vercel access to the `knight-chess` repository.
5. Find that repository and click **Import**.
6. Choose an available project name.

### 2.2 Check the build settings

The included `vercel.json` and `package.json` already supply the deployment settings. Check the following values in the import screen; leave correctly detected values in place:

| Vercel field | Value |
| --- | --- |
| Framework Preset | **Vite** |
| Root Directory | Repository root: `./` |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js version | `24.x` |
| Production branch | `main` |

Keep **Root Directory** at the repository root. This project keeps its package file and Vite configuration there, even though the React source is inside `frontend/`.

The package specifies Node 24. If the version selector is only available after creation, you can confirm it under **Project Settings → Build and Deployment → Node.js Version**. Vercel documents [Node version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).

Leave `VITE_API_URL` unset for this first deployment. You will add the actual Render URL in step 6. Database credentials belong in Render, not in Vercel's frontend variables.

Click **Deploy** and wait for the deployment to show **Ready**.

### 2.3 Copy your production website address

Open the project's **Overview** or **Settings → Domains** and copy its stable production domain. It will resemble:

```text
https://YOUR-SITE.vercel.app
```

Use that production domain throughout the guide. A temporary preview address or a deployment-specific address is a different origin.

Open the website. The chess interface and local features should load. Account sign-in and online rooms will start working after the remaining services are connected.

Vercel Hobby is intended for personal, non-commercial use; see the [Hobby plan documentation](https://vercel.com/docs/plans/hobby).

## 3. Prepare the Render backend form

You will fill the Render form now and finish it after creating the Neon database. Keep this browser tab open while you complete step 4.

### 3.1 Select the repository and Docker runtime

1. Sign in to the [Render Dashboard](https://dashboard.render.com).
2. Choose **New + → Web Service**.
3. Choose the option to deploy from a Git repository.
4. Connect GitHub and grant access to your private `knight-chess` repository.
5. Select that repository.
6. Set **Language** or **Runtime** to **Docker**.

Render builds the included Dockerfile remotely. Your computer does not need a Docker installation. The Dockerfile also installs Stockfish, which the chess backend uses for server-side bot play and reviews. Render explains this workflow in [Docker on Render](https://render.com/docs/docker).

### 3.2 Enter these service settings

| Render field | Value |
| --- | --- |
| Name | An available name, such as `knight-chess-api-YOURNAME` |
| Branch | `main` |
| Region | A region near you; note the choice for Neon |
| Language / Runtime | **Docker** |
| Root Directory | `backend` |
| Dockerfile Path | `./Dockerfile` |
| Docker Build Context Directory, if shown | `.` |
| Instance type / Compute plan | **Free** |
| Docker Command | Leave blank; use the included Dockerfile command |
| Pre-deploy Command, if shown | Leave blank |
| Health Check Path, under Advanced if available | `/api/health` |
| Auto-deploy | Enable deployment on commits to `main` |

**Set Root Directory to `backend` first.** Dockerfile Path and Docker Build Context are then relative to that directory. `./Dockerfile` resolves to the file inside `backend/`, and `.` means the contents of `backend/`. Render documents these [root-relative settings](https://render.com/docs/monorepo-support#root-relative-settings).

There is no separate build or start command to invent. The included Docker startup already applies Django migrations, listens on Render's assigned port, and starts Gunicorn with one worker and two threads.

**Leave the creation form open before the final Deploy/Create action.** Open Neon in another tab and continue with step 4. If Render exposes some Advanced settings only after creation, you can set those on the service's Settings page after step 5.

## 4. Create the PostgreSQL database on Neon

### 4.1 Create a Free project

1. Open [console.neon.tech](https://console.neon.tech) in a new browser tab and sign in.
2. Choose **New Project** or **Create Project**.
3. Give the project a name such as `knight-chess`.
4. Choose the **Free** plan.
5. Select **PostgreSQL 17**.
6. Choose a region close to the Render region you selected. The same city or nearby region, when available, reduces the distance between the API and database.
7. Create the project. Keep its default database, role, and branch unless you have a specific reason to rename them.

Neon creates the initial database resources for you. You do not need to install PostgreSQL, run `CREATE DATABASE`, or set up tables manually. Django's migrations will create the application tables when Render starts. See [Neon's project documentation](https://neon.com/docs/manage/projects).

### 4.2 Copy the direct connection string

1. In the Neon project dashboard, click **Connect**.
2. Select the project's default branch, normally `production` in the dashboard.
3. Select its database and role.
4. Choose a **direct connection**. If **Connection pooling** is enabled, switch it off for this guide. A direct Neon hostname does not have `-pooler` in its endpoint name.
5. Copy the complete **connection string / database URL**.

Its shape will be similar to this example:

```text
postgresql://DB_USER:DB_PASSWORD@ep-example-123456.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

Use the real string from your Neon dashboard. Preserve the database name, password encoding, and query parameters, including `sslmode=require` and `channel_binding=require` when supplied. The updated backend reads the complete URL and passes its connection options to PostgreSQL.

If Neon displays a command such as `psql 'postgresql://…'`, copy only the URL beginning with `postgresql://`, without `psql`, surrounding quotes, or a trailing line break. You will paste this as a Render environment-variable value. It contains your database password, so keep it out of GitHub files and frontend settings.

The official [Neon connection guide](https://neon.com/docs/connect/connect-from-any-app) explains the connection dialog and URL format.

## 5. Finish and deploy the Render backend

Return to the Render creation form you left open in step 3.

### 5.1 Generate a Django secret

For `DJANGO_SECRET_KEY`, use Render's random-value generation option if it is available beside the environment-variable field.

Alternatively, generate a value locally in PowerShell using the following commands. This does not edit any project file and does not require Python:

```powershell
$knightSecretBytes = New-Object byte[] 48
$knightSecretGenerator = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$knightSecretGenerator.GetBytes($knightSecretBytes)
[Convert]::ToBase64String($knightSecretBytes)
$knightSecretGenerator.Dispose()
```

Copy the long value displayed by the fourth line. Paste it directly into the Render value field without adding quotation marks. Keep the same secret across future deployments; there is no need to generate a replacement for each update.

### 5.2 Add the six backend environment variables

Under **Environment Variables**, add these names and values:

| Key | Value to enter |
| --- | --- |
| `DJANGO_SECRET_KEY` | The generated secret from step 5.1 |
| `DJANGO_DEBUG` | `0` |
| `DATABASE_URL` | The full direct Neon connection string from step 4.2 |
| `CORS_ALLOWED_ORIGINS` | Your actual Vercel production origin, such as `https://YOUR-SITE.vercel.app` |
| `STOCKFISH_PATH` | `/usr/games/stockfish` |
| `SQLITE_TEST` | `0` |

Enter the key in the **Key** box and its value in the **Value** box. Dashboard fields do not need surrounding quotes or a leading `KEY=` inside the value.

For `CORS_ALLOWED_ORIGINS`, use the Vercel address from step 2.3. Include `https://`; omit a trailing slash, page path, and `#settings` or other hash. This setting allows your website to make browser requests to Django.

This hosting-ready version reads `DATABASE_URL` directly. The older local instructions using five separate `POSTGRES_*` variables are not needed for this Neon setup. Render's own assigned hostname is automatically allowed by the updated backend, so you do not need to guess its hostname before service creation or add `DJANGO_ALLOWED_HOSTS` for the default Render domain.

### 5.3 Start the deployment

1. Confirm that the service still uses **Docker**, **Root Directory `backend`**, and the **Free** instance type.
2. Confirm that all six environment variables are present.
3. Click **Create Web Service** or **Deploy Web Service**.
4. Watch the build and deployment logs. The first build downloads Python dependencies and Stockfish, then startup applies database migrations.
5. Wait until the service is shown as **Live**.

A successful first startup normally shows Django migration messages ending in `OK`, followed by Gunicorn startup messages. Later startups can report that there are no migrations to apply.

Keep **Docker Command** and **Pre-deploy Command** blank. The supplied image already contains the startup sequence, including migrations; the Free service does not require a dashboard shell for this setup.

If you could not set the health check during creation, open the service's **Settings**, find **Health Check Path**, set it to `/api/health`, and save.

### 5.4 Verify the backend URL

Copy Render's public service URL from the service overview. It will resemble:

```text
https://YOUR-API.onrender.com
```

Open its health endpoint in a new tab:

```text
https://YOUR-API.onrender.com/api/health
```

Use `/api/health` exactly, without a trailing slash. In this updated release, a successful response confirms that a database query succeeded. With the supplied Docker image and the Neon connection, the response should contain:

```json
{
  "status": "ok",
  "service": "Knight Django API",
  "database": "postgresql",
  "stockfish": true,
  "database_reachable": true
}
```

This is an example of what the endpoint displays, not a file you need to create. A failed database check returns an unavailable response with HTTP status 503 and `database_reachable: false`.

The `stockfish` flag checks whether the engine file exists. The signed-in game and review check in step 7 verifies an actual engine-backed feature.

Opening the bare Render address can return **404 Not Found** because the backend has no homepage route. Use the health endpoint for this check and the Vercel address to play chess.

## 6. Connect the Vercel frontend to Render

### 6.1 Add the frontend API URL

1. Open your Vercel project.
2. Go to **Settings → Environment Variables**.
3. Add this variable:

| Field | Value |
| --- | --- |
| Name / Key | `VITE_API_URL` |
| Value | `https://YOUR-API.onrender.com/api` |
| Environment | **Production** |

Replace `YOUR-API` with your real Render hostname. Include `/api` once, with **no slash after it**.

For example, if Render gives you `https://knight-example.onrender.com`, enter:

```text
https://knight-example.onrender.com/api
```

This is a public API address, not a database connection string. The Neon `DATABASE_URL` and `DJANGO_SECRET_KEY` stay in Render's environment settings.

### 6.2 Redeploy after saving

1. Save the environment variable.
2. Open the Vercel **Deployments** tab.
3. On the latest **Production** deployment, use the menu to choose **Redeploy**.
4. Confirm the redeployment and wait for **Ready**.
5. Close any open Knight website tabs, then reopen your stable Vercel production address. This also allows the app's offline cache to activate an available update.

Vite compiles `VITE_API_URL` into the frontend during the build. Saving a variable does not alter an already built deployment; the new build is necessary. Vercel explains when changes apply in its [environment-variable documentation](https://vercel.com/docs/environment-variables).

Use the production domain for the checks below. Preview deployments have different origins and would need their own Vercel environment selection and explicit backend CORS entries if you decide to enable them later.

## 7. Check the complete application

Keep the Render health page available while making these checks. If the free backend has been idle, give it time to wake before trying account actions.

### Accounts and profile

1. Open your Vercel production website.
2. Open **Settings → Account**.
3. Create a Knight account using a username and password. This is your chess-app account, separate from your GitHub, Vercel, Render, or Neon login.
4. Update your display name or bio and save it.
5. Optionally choose a PNG, JPEG, or WebP profile picture smaller than 1 MB, then save.
6. Reload the page and verify your saved profile. Signing out and back in is another useful persistence check.

Profile pictures are stored in PostgreSQL as image data. This release does not need a Render persistent disk or a separate image-storage service for avatars.

### Bots and game review

1. While signed in, start a bot game.
2. Play a few moves and finish or resign the game.
3. Open that game's **Review**.
4. Check that the analysis identifies **Stockfish**. This verifies more than the file-existence flag in the health endpoint.

Server-backed play needs a working account/API connection. A browser-local game or local review can still work when the server is unavailable, so use a new signed-in game for this integration check.

### Multiplayer

1. Open the production site in your normal browser and sign in with one account.
2. Open it in a private/incognito window or another browser and create/sign in with a second account.
3. In the multiplayer section, create a room in one window.
4. Enter its room code in the other window.
5. Verify that both players see the moves and that the selected clock runs.

Using separate browser sessions keeps the players' sign-in tokens separate. Internet multiplayer needs both clients and the backend online. Same-device pass-and-play remains available for local play.

### Existing data

The new Neon database starts empty. Your previous local PostgreSQL database, accounts, and game history are **not automatically moved** by uploading code to GitHub. Browser-local progress also belongs to its original website address; opening a different domain does not copy that storage. Keep your old local installation and any exports if you want to transfer that data separately later.

## 8. What to expect from the free plans

This setup is suitable for personal use and testing within the providers' quotas. The plans are not a guarantee of unlimited compute, storage, availability, or strongest-engine performance.

| Service | Relevant free-plan behavior |
| --- | --- |
| Vercel Hobby | Intended for personal, non-commercial projects. Your React files are served as a static frontend. |
| Render Free | 512 MB RAM and 0.1 CPU. An idle web service sleeps after 15 minutes; a later request can take about one minute to wake it. |
| Neon Free | 1 GB PostgreSQL storage per project and 100 CU-hours of compute per project per month. Compute scales to zero after inactivity; other usage quotas also apply. |

Sources checked on 26 November 2026: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Render free-service behavior](https://render.com/docs/free), [Render compute plans](https://render.com/docs/compute-plans), and [Neon plans](https://neon.com/docs/introduction/plans). Check those pages and your dashboard before choosing any paid upgrade; plan limits can change.

The included frontend allows more time for a sleeping API to respond and avoids starting overlapping background polls. Even so, a cold service may require a retry. If sign-in takes a while after you have not used the app, open the Render `/api/health` address, wait for a successful response, and retry the website action.

The small Render CPU allowance can make Stockfish and game reviews slow. The strongest bot level still has the configured thinking-time limit; its practical strength depends on the available compute. Start with one game or review at a time if the service is under load.

Render's service filesystem is temporary. Account data survives service restarts because the app uses Neon PostgreSQL. Keep the Neon project and connection details intact; deleting or replacing the database changes the data the app can access. You do not need to create a separate Render Postgres service for this guide.

## 9. Publish future code updates

After you intentionally update files in this same local Git folder, open PowerShell there and run:

```powershell
git status
git add .
git commit -m "Update Knight Chess"
git push
```

Review the changed files before committing. Vercel will build a new production deployment from pushes to `main`. Render will redeploy for changes under its configured `backend` root when auto-deploy is enabled. After the deployments finish, reopen the website and check the changed feature. The [Render monorepo documentation](https://render.com/docs/monorepo-support) explains how root directories affect automatic deploys.

For a **dashboard-only setting change**:

- **Vercel `VITE_API_URL`:** save it and redeploy the frontend.
- **Render `DATABASE_URL`, CORS, or another backend variable:** save it using Render's redeploy option, or trigger **Manual Deploy → Deploy latest commit** afterward.
- **Neon role password:** copy the new complete connection URL into Render's `DATABASE_URL`, then redeploy Render.

Migrations already run when the backend starts. You do not need to upload or recreate the database for a normal code update.

## 10. Troubleshooting

### GitHub and local commands

| Symptom | What to check |
| --- | --- |
| `git` is not recognized | Install Git for Windows, close PowerShell, and open a new PowerShell window. |
| `Author identity unknown` | Run the `git config user.name` and `git config user.email` commands in step 1, then retry the commit. |
| `Repository not found` or authentication fails | Use the exact HTTPS repository address and sign in with the account that owns it. Check that the repository exists and that your browser authorization completed. |
| `remote origin already exists` | You are likely using a previously initialized folder. Run `git remote -v` to inspect its address. For a new deployment, use the fresh extraction and empty repository described in step 1. |
| The first push is rejected because the remote has commits | The GitHub repository may have been initialized with a README or license. Use a new empty repository for this guide; avoid force-pushing over work you want to keep. |

### Vercel build or website problems

| Symptom | What to check |
| --- | --- |
| `package.json` cannot be found | Vercel Root Directory must be the repository root, `./`, and the individual source files must be committed there. |
| The frontend fails to build | Confirm `npm ci`, `npm run build`, `dist`, and Node `24.x`. Open the build log and read the first actual error. Confirm that you uploaded the updated ZIP, including `package-lock.json` and `vercel.json`. |
| Chess loads, but account requests go to Vercel `/api/...` | `VITE_API_URL` was absent from the build. Set it for Production to your Render address ending in `/api`, then redeploy. |
| Requests contain `/api/api` or a double slash | Use exactly `https://YOUR-API.onrender.com/api` as the variable, without a final slash. |
| You still see old behavior after a deployment | Confirm the production deployment is Ready. Close all Knight tabs and reopen the production domain. Try a hard refresh with `Ctrl+Shift+R`. Clearing website storage can erase browser-local games, so keep that as a separate recovery step after exporting anything you need. |
| A preview URL fails while the production site works | Use the stable production URL from step 2. The guide configures its Production environment and exact CORS origin. |

### Render, Neon, and cross-origin requests

| Symptom | What to check |
| --- | --- |
| Docker build cannot find `requirements.txt` | Set Render Root Directory to `backend`, Dockerfile Path to `./Dockerfile`, and context to `.`. Check that `backend/requirements.txt` exists in GitHub. |
| Render asks for a Python build/start command | Select the Docker runtime for this project. Its Dockerfile contains the installation and startup instructions. |
| `Set DJANGO_SECRET_KEY...` appears in logs | Add a non-empty `DJANGO_SECRET_KEY` in Render, then redeploy. |
| Connection attempts mention host `db` | The cloud `DATABASE_URL` is missing or the deployed backend is an old copy. Confirm the full Neon URL is present and the updated settings file was pushed. |
| Database password, TLS, or connection error | Copy the complete direct URL again from Neon's Connect dialog. Preserve its SSL/channel-binding parameters and encoded password; omit `psql` and surrounding quotes. Save it in Render and redeploy. |
| Neon compute is suspended or quota is exhausted | Check the Neon project's status and usage. A valid URL cannot connect while the provider has suspended its compute. |
| Backend health fails with a database-unavailable response | Read Render's logs and verify the Neon URL/project first. The updated health check performs a real database query. |
| Bare Render URL gives 404 | Open `/api/health`; the backend does not have a homepage route. |
| Health works directly, but the browser reports CORS | In Render, set `CORS_ALLOWED_ORIGINS` to the website's exact production origin, including `https://` and excluding a trailing slash/path. Save and redeploy Render. Confirm you are visiting that same domain. |
| `DisallowedHost` appears | Confirm the hosting-ready code is deployed. It automatically allows Render's assigned hostname. A separately configured backend custom domain needs its hostname added through `DJANGO_ALLOWED_HOSTS`. |
| Health reports `stockfish: false` | Confirm the service uses the included Dockerfile and `STOCKFISH_PATH=/usr/games/stockfish`. Redeploy and inspect the Stockfish installation build step. |
| Sign-in is slow immediately after a long break | Allow the free backend to wake. Open its health endpoint, wait for success, then retry the frontend action. |
| Service restarts during heavy reviews | Check Render logs for memory exhaustion or timeouts. Test one review at a time. More demanding usage can require more compute than the Free plan provides. |

If you ask for help, share the exact error text and which step failed. Remove passwords, tokens, and the secret portions of connection strings from screenshots and logs before sharing them.

## Final quick checklist

- [ ] Extracted the updated ZIP into a fresh folder.
- [ ] Uploaded the complete project to an empty private repository owned by my personal GitHub account.
- [ ] Confirmed `package.json`, `vercel.json`, `frontend`, and `backend` are at the repository root.
- [ ] Imported the repository into Vercel with root `./`, Vite, `npm ci`, `npm run build`, output `dist`, and Node `24.x`.
- [ ] Copied the stable Vercel production origin.
- [ ] Prepared Render as a Docker web service with root `backend`, Dockerfile `./Dockerfile`, context `.`, and Free compute.
- [ ] Created a Neon Free PostgreSQL 17 project in a nearby region.
- [ ] Copied its complete direct database URL, including SSL options.
- [ ] Added the six Render environment variables from step 5.2.
- [ ] Deployed Render and verified `/api/health` succeeds.
- [ ] Added `VITE_API_URL=https://MY-ACTUAL-RENDER-HOST/api` to Vercel's Production environment.
- [ ] Redeployed Vercel after adding that variable.
- [ ] Created a Knight account and saved a profile successfully.
- [ ] Verified a signed-in bot game/review and, if needed, a room with two separate accounts.
- [ ] Kept my old local data separately; this deployment did not migrate it.

Your normal playing address is the **Vercel production website URL**. The Render dashboard manages the API, and the Neon dashboard manages the database.
