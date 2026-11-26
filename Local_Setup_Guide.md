# Local Setup Guide

## Run Knight Chess on Windows without Docker

This guide sets up the full React frontend, Django backend, and PostgreSQL database on your own Windows computer. It also explains how to install Stockfish for backend bot games and game analysis.

**Docker is not required.** You will start Django and React in two separate PowerShell windows. PostgreSQL runs as a Windows service.

After setup, open:

**http://127.0.0.1:5173**

The instructions assume that you have already downloaded the project's source ZIP. The example project location is **C:\Projects\knight-chess**. Replace that location in the commands if you extract the project somewhere else.

> Run PowerShell commands in PowerShell. Run the database commands in SQL Shell (psql), as indicated. You do not need to run the Docker Compose command.

For cloud hosting, follow **Deployment_Guide.md** instead. That guide requires dashboard configuration, not local PostgreSQL installation.

## Contents

1. Install the required software
2. Extract the source code
3. Create the PostgreSQL user and database
4. Install the Python dependencies
5. Install Stockfish
6. Configure the environment file
7. Load the configuration and start Django
8. Start the React frontend
9. Open the app and create your account
10. Stop and restart the app
11. Troubleshooting
12. Official documentation

---

## 1. Install the required software

Use the following versions for this project's manual setup.

| Software | Version to use | Official download |
| --- | --- | --- |
| Python | Python 3.13, or an existing Python 3.12 installation | [Python for Windows](https://www.python.org/downloads/windows/) |
| Node.js | Node.js 24 LTS, or an existing supported Node.js 22 installation | [Node.js downloads](https://nodejs.org/en/download/) |
| PostgreSQL | PostgreSQL 17, matching the project's database configuration | [PostgreSQL for Windows](https://www.postgresql.org/download/windows/) |
| Stockfish | A Windows build compatible with your computer | [Stockfish downloads](https://stockfishchess.org/download/) |

### Python

Install Python 3.13 or use Python 3.12 if it is already installed. If the installer offers an option to add Python to PATH, enable it.

The commands below use the Windows Python launcher, **py**. If that launcher is unavailable but **python --version** works, use **python** as explained in the troubleshooting section.

### Node.js

Install Node.js. Its installer includes **npm**, which installs the React frontend's dependencies.

### PostgreSQL

Use the Windows installer linked from the official PostgreSQL download page.

During installation:

- Install the PostgreSQL server. The installer also provides pgAdmin.
- Keep the default port, **5432**, unless another PostgreSQL instance already uses it.
- Choose and remember the password for the PostgreSQL administrator account named **postgres**.
- Complete the installation and ensure the PostgreSQL Windows service is running.

The app will use a separate database account named **knight**, which you will create in step 3.

### Check Python and Node.js

After installing the software, open a **new PowerShell window** so that it picks up PATH changes. Run:

~~~powershell
py --version
node --version
npm.cmd --version
~~~

Each command should print a version.

If **py** is not recognized, try:

~~~powershell
python --version
~~~

The **npm.cmd** command is intentional: it avoids the PowerShell execution-policy error that can occur when Windows selects **npm.ps1**.

---

## 2. Extract the source code

Extract **knight-source.zip** into a convenient folder, for example:

~~~text
C:\Projects\knight-chess
~~~

Open the folder and locate the project root. It should contain:

- **package.json**
- **package-lock.json**
- **vite.config.js**
- **frontend**
- **backend**

If extraction creates an extra nested folder, use the inner folder that actually contains **package.json**.

Open PowerShell and change to the project root:

~~~powershell
cd "C:\Projects\knight-chess"
~~~

Keep this PowerShell window open. It will become your backend terminal.

---

## 3. Create the PostgreSQL user and database

### Open SQL Shell (psql)

Open **SQL Shell (psql)** from the Windows Start menu.

Enter the following connection values. Press Enter to accept a displayed default when it matches.

| Prompt | Value |
| --- | --- |
| Server | localhost |
| Database | postgres |
| Port | 5432 |
| Username | postgres |
| Password | The administrator password you chose during PostgreSQL installation |

If you selected another port during installation, use that port here and later in the environment file.

Once connected, you should see a prompt similar to:

~~~text
postgres=#
~~~

### Create the application database account

Run this SQL statement:

~~~sql
CREATE ROLE knight LOGIN;
~~~

Then run the following **psql command**:

~~~text
\password knight
~~~

Enter a new password for the **knight** database account when prompted, and enter it again to confirm. The password will not be displayed as you type.

Remember this password. You will put it in **POSTGRES_PASSWORD** in step 6.

### Create the application database

Run:

~~~sql
CREATE DATABASE knight OWNER knight;
~~~

The **knight** account owns the database, so Django can create its tables during migration. The application account does not need PostgreSQL superuser privileges.

Run these statements individually in SQL Shell. Do not wrap **CREATE DATABASE** in a transaction.

Exit SQL Shell:

~~~text
\q
~~~

> The commands beginning with a backslash, such as \password and \q, belong to SQL Shell (psql). They are not PowerShell commands and do not work in pgAdmin's SQL Query Tool.

### Keep the three accounts distinct

| Account | Purpose |
| --- | --- |
| PostgreSQL administrator: postgres | Installing and managing PostgreSQL |
| PostgreSQL application account: knight | Connecting Django to the knight database |
| Your chess account | Signing in to the chess website; created later in the app |

If the **knight** role or database already exists from an earlier successful setup, keep it and continue. You do not need to recreate or delete it.

---

## 4. Install the Python dependencies

Return to PowerShell in the project root:

~~~powershell
cd "C:\Projects\knight-chess"
~~~

### Create a virtual environment

If you installed Python 3.13, run:

~~~powershell
py -3.13 -m venv .venv
~~~

If you are using Python 3.12, run this **instead**:

~~~powershell
py -3.12 -m venv .venv
~~~

You only need one virtual environment.

If the **py** launcher is unavailable and **python --version** reports the supported Python installation you want to use, run this instead:

~~~powershell
python -m venv .venv
~~~

### Install the backend packages

Run:

~~~powershell
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
~~~

Wait for both commands to finish successfully.

All later Python commands use the virtual environment's interpreter directly. You do not need to activate the virtual environment or change PowerShell's execution policy.

The requirements include Gunicorn for the project's Linux deployment. For this Windows local setup, start Django with **runserver**, as shown in step 7.

---

## 5. Install Stockfish

1. Open the [official Stockfish download page](https://stockfishchess.org/download/).
2. Download a Windows build compatible with your processor. Most Windows PCs use x86-64; Windows on ARM devices need the appropriate ARM64 build.
3. Extract the entire download into a folder, for example **C:\Tools\Stockfish**.
4. Keep the extracted files together.
5. Locate the actual Stockfish executable ending in **.exe**.
6. Record its complete path.

The executable filename depends on the version and build you downloaded. Do not assume that a filename shown in an example exists on your computer.

In the next step, set **STOCKFISH_PATH** to the actual executable path.

Stockfish is a command-line chess engine. Django starts it when needed; it is not a separate graphical chess application.

Anonymous local games use the browser's JavaScript engine. Sign in to use the backend's Stockfish-powered games.

---

## 6. Configure the environment file

The project uses an environment file named **.env** in the project root.

If you already ran:

~~~powershell
python backend/setup_local.py
~~~

the file may already exist. You can edit that file and continue with these manual instructions.

The setup script is not a replacement for installing PostgreSQL, installing dependencies, or starting the two servers manually.

### Generate a Django secret key

From the project root, run:

~~~powershell
.\.venv\Scripts\python.exe -c "import secrets; print(secrets.token_urlsafe(64))"
~~~

Copy the generated value. Generate it once and keep the same value for this installation.

### Open or create .env

Run:

~~~powershell
notepad .env
~~~

If Notepad asks whether to create the file, choose Yes.

Put the following content in the file:

~~~dotenv
DJANGO_SECRET_KEY=PASTE_YOUR_GENERATED_SECRET_KEY_HERE
DJANGO_DEBUG=1
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=knight
POSTGRES_USER=knight
POSTGRES_PASSWORD=THE_PASSWORD_YOU_SET_FOR_THE_KNIGHT_DATABASE_USER
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=5432

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

STOCKFISH_PATH=C:/Tools/Stockfish/YOUR_ACTUAL_STOCKFISH_FILENAME.exe

SQLITE_TEST=0
~~~

Replace these three placeholders:

| Setting | Replace with |
| --- | --- |
| DJANGO_SECRET_KEY | The value generated by the Python command above |
| POSTGRES_PASSWORD | The password you set with \password knight |
| STOCKFISH_PATH | The full path to your actual Stockfish .exe file |

If you installed PostgreSQL on a different port, update **POSTGRES_PORT** too.

### Important configuration details

- Save the filename as **.env**, not **.env.txt**. In Notepad's Save As dialog, select **All files** if necessary.
- Do not surround values with quotation marks.
- Use one **KEY=value** pair per line.
- Put comments on their own lines beginning with **#**.
- Forward slashes in the example Stockfish path work on Windows. Use the real folder and filename on your computer.
- Use **POSTGRES_HOST=127.0.0.1** for this manual installation. The hostname **db** in the Docker configuration only works inside Docker's network.
- Keep **SQLITE_TEST=0** so the app uses PostgreSQL.
- Keep the file private because it contains your database password and Django secret.

**The backend does not automatically read .env.** It reads environment variables from the process that starts Django. You must load the file into the backend PowerShell window using the next step.

---

## 7. Load the configuration and start Django

Use the first PowerShell window, in the project root.

### Load .env into the current terminal

Copy and run this entire block:

~~~powershell
Get-Content .env | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split "=", 2

        if ($parts.Count -eq 2) {
            [System.Environment]::SetEnvironmentVariable(
                $parts[0].Trim(),
                $parts[1].Trim(),
                "Process"
            )
        }
    }
}
~~~

This imports the plain **KEY=value** entries into the current PowerShell process. It ignores blank lines and comment lines and splits each entry at its first equals sign.

It does not save those variables globally. Run the block again whenever you open a new backend terminal or change the environment file.

### Check the Stockfish path

Run:

~~~powershell
Test-Path $env:STOCKFISH_PATH
~~~

Expected result:

~~~text
True
~~~

If the result is False, correct the path in **.env**, load the file again, and repeat the check.

Now check that the executable can actually start:

~~~powershell
'uci', 'quit' | & $env:STOCKFISH_PATH
~~~

You should see Stockfish's identification and options, followed by **uciok**.

This check is useful because a file can exist at the configured path without being a compatible, working engine executable.

### Check Django and create the database tables

Run:

~~~powershell
.\.venv\Scripts\python.exe backend\manage.py check
.\.venv\Scripts\python.exe backend\manage.py migrate
~~~

The first command checks Django's configuration. The second connects to PostgreSQL and applies the project's database migrations.

Wait for the migrations to complete successfully before continuing.

You do not need to create a Django superuser for ordinary use of this app. Create your chess account through the frontend in step 9.

### Start the backend

Run:

~~~powershell
.\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
~~~

You should see a message similar to:

~~~text
Starting development server at http://127.0.0.1:8000/
~~~

**Leave this terminal open.** It is running the Django backend.

These commands are for local development on your own computer.

---

## 8. Start the React frontend

Open a **second PowerShell window**.

Change to the same project folder:

~~~powershell
cd "C:\Projects\knight-chess"
~~~

### Install frontend dependencies

Run:

~~~powershell
npm.cmd ci
~~~

This uses the project's package lock file to install its dependencies. Wait for it to complete.

You normally only need to run this after extracting a fresh copy of the project or when its dependencies change.

### Start the frontend

Run:

~~~powershell
.\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173 --strictPort
~~~

**Leave this terminal open too.**

The explicit command uses the project's installed Vite executable and starts the frontend at:

**http://127.0.0.1:5173**

The **--strictPort** option makes Vite stop with an error if port 5173 is occupied. It prevents an unnoticed switch to another port.

The supplied Vite configuration already forwards requests beginning with **/api** to:

**http://127.0.0.1:8000**

You do not need to edit the frontend's API configuration for these addresses.

---

## 9. Open the app and create your account

Open this URL in your browser:

**http://127.0.0.1:5173**

To create your chess account:

1. Open **Settings**.
2. Find **Account**.
3. Choose **Create account**.
4. Enter your desired chess username and password.
5. Sign in if you are not signed in automatically.

Your chess account is separate from both PostgreSQL accounts.

Signing in lets the app use backend account features, Stockfish-powered games, and multiplayer rooms. Anonymous local play uses the browser's JavaScript engine.

### Check backend health

Open:

**http://127.0.0.1:8000/api/health**

With the configuration above and a valid Stockfish file path, the response should look like:

~~~json
{
  "status": "ok",
  "service": "Knight Django API",
  "database": "postgresql",
  "database_reachable": true,
  "stockfish": true
}
~~~

In this updated release, the health endpoint queries the database and reports whether the Stockfish file exists. It returns HTTP 503 if the database is unreachable. A successful health response still does not prove that the engine executable can launch; use the UCI check above.

Use these checks together:

| Check | What it confirms |
| --- | --- |
| Django migrations complete successfully | Django can connect to PostgreSQL and apply the database schema |
| Stockfish UCI command returns uciok | The configured engine executable starts and responds |
| /api/health responds | The Django API is running |
| Account registration and sign-in work | The frontend can communicate with the account API and use the database |

---

## 10. Stop and restart the app

### Stop the app

In each server terminal, press:

~~~text
Ctrl+C
~~~

This stops Django or Vite in that terminal. Your saved database records remain in PostgreSQL.

PostgreSQL may continue running as a Windows service.

### Start it again later

You do not need to recreate the database, create another virtual environment, or reinstall all dependencies each time.

First, make sure the PostgreSQL Windows service is running.

#### Terminal 1: backend

Open PowerShell:

~~~powershell
cd "C:\Projects\knight-chess"
~~~

Load the environment file again:

~~~powershell
Get-Content .env | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#")) {
        $parts = $line -split "=", 2

        if ($parts.Count -eq 2) {
            [System.Environment]::SetEnvironmentVariable(
                $parts[0].Trim(),
                $parts[1].Trim(),
                "Process"
            )
        }
    }
}
~~~

Start Django:

~~~powershell
.\.venv\Scripts\python.exe backend\manage.py runserver 127.0.0.1:8000
~~~

#### Terminal 2: frontend

Open another PowerShell window:

~~~powershell
cd "C:\Projects\knight-chess"
.\node_modules\.bin\vite.cmd --host 127.0.0.1 --port 5173 --strictPort
~~~

#### Browser

Open:

**http://127.0.0.1:5173**

### Addresses to remember

| Component | Address |
| --- | --- |
| Chess frontend | http://127.0.0.1:5173 |
| Django backend | http://127.0.0.1:8000 |
| Backend health endpoint | http://127.0.0.1:8000/api/health |
| PostgreSQL database connection | 127.0.0.1:5432 |

Use **5173** for the manual frontend setup. An earlier **8080** address belongs to the Docker setup.

---

## 11. Troubleshooting

| Problem | What to do |
| --- | --- |
| py is not recognized | Try **python --version**. If it reports the supported Python installation, use **python -m venv .venv**. Otherwise install Python and reopen PowerShell. |
| No suitable Python runtime is found for py -3.13 | Use **py -3.12 -m venv .venv** if you installed Python 3.12, or install Python 3.13. |
| npm.ps1 cannot be loaded because running scripts is disabled | Use **npm.cmd**, as shown in this guide. Start Vite with **vite.cmd**. You do not need to change the execution policy. |
| npm.cmd is not recognized | Install Node.js and open a new PowerShell window. |
| package.json or backend\requirements.txt cannot be found | Change to the project root containing **package.json** and **backend**. Check for an extra nested folder after extraction. |
| Get-Content cannot find .env | Create the file in the project root. Check that Notepad did not save it as **.env.txt**. |
| Could not translate host name db | Set **POSTGRES_HOST=127.0.0.1**, load the environment file again, and restart Django. |
| Password authentication failed for user knight | Use the password set with **\password knight**, not the PostgreSQL administrator password. Correct **POSTGRES_PASSWORD**, reload the environment file, and restart Django. |
| Connection refused on port 5432 | Open Windows Services and start the PostgreSQL service. Confirm that **POSTGRES_PORT** matches the port chosen during installation. |
| Database knight does not exist | Complete step 3 to create the database, then run migrations. |
| Role knight already exists | Keep the existing role. If you need to reset its password, connect as the PostgreSQL administrator in SQL Shell and run **\password knight**. |
| Database knight already exists | Keep the existing database. Do not delete it just to repeat setup; continue with configuration and migrations if it belongs to this installation. |
| Django reports that its secret key is missing | Ensure **DJANGO_SECRET_KEY** has a generated value, then run the environment-loading block in the same terminal before starting Django. |
| Test-Path returns False | Correct **STOCKFISH_PATH** to point to the actual executable, reload the environment file, and repeat the check. |
| Stockfish exists but will not launch | Download a build compatible with your processor, extract the whole folder, update the path, reload the configuration, and repeat the UCI check. |
| The frontend opens but registration or sign-in fails | Keep Django running in the first terminal. Check **http://127.0.0.1:8000/api/health** and inspect any error printed in the Django terminal. Confirm migrations completed. |
| Port 8000 or 5173 is already in use | Stop an earlier instance of the relevant server, then rerun its startup command. |
| Configuration seems lost after opening a new terminal | Run the environment-loading block again in the backend terminal. Its variables belong only to the process where you loaded them. |
| Changes to .env are not taking effect | Stop Django with **Ctrl+C**, reload the environment file into that same terminal, then start Django again. |
| Health reports sqlite instead of postgresql | Set **SQLITE_TEST=0**, reload the environment file, and restart Django. Run migrations against PostgreSQL. |
| Health reports stockfish: false | Check the configured executable path, reload the environment file, and restart Django. |
| Vite reports that its executable cannot be found | Run **npm.cmd ci** from the project root and wait for dependency installation to finish successfully. |

When investigating an error, read the terminal output from the command that failed before moving on to the next step.

---

## 12. Official documentation

The project-specific paths and commands in this guide follow the supplied Knight Chess source code. These official references cover the software installation and command behavior:

- [Python downloads for Windows](https://www.python.org/downloads/windows/)
- [Python 3.13 virtual environments](https://docs.python.org/3.13/library/venv.html)
- [Node.js downloads](https://nodejs.org/en/download/)
- [Django 5.2 on Windows](https://docs.djangoproject.com/en/5.2/howto/windows/)
- [PostgreSQL downloads for Windows](https://www.postgresql.org/download/windows/)
- [PostgreSQL 17: CREATE DATABASE](https://www.postgresql.org/docs/17/sql-createdatabase.html)
- [PostgreSQL 17: psql](https://www.postgresql.org/docs/17/app-psql.html)
- [Stockfish downloads](https://stockfishchess.org/download/)

