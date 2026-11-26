# Knight Chess — desktop editions

The desktop app packages the same offline-capable React chess game inside Electron. It includes the bundled frontend, bot engine worker, puzzles, lessons, local multiplayer and game reviews. It **does not embed Django, PostgreSQL or Stockfish**: to sign in, save to Neon, use the server's Stockfish, or play over the internet, use **Desktop → Connect to Django server…** and enter your Render backend URL, for example `https://your-service.onrender.com/api`. The desktop app proxies `/api/` requests through a localhost-only server, so the browser view does not need another CORS entry.

## Download installers from GitHub Actions (no Docker required)

1. Copy this complete project into your GitHub `knight-chess` repository and push it to `main`.
2. Open **GitHub → Actions → Build Knight Chess desktop installers**.
3. Click **Run workflow**, choose `main`, and run it.
4. Wait for both jobs to succeed. Under the run's **Artifacts**, download `Knight-Chess-Windows-Installer` and `Knight-Chess-Linux-DEB`.
5. Extract those artifact ZIPs to get the `.exe` installer and `.deb` file.

Windows uses an NSIS installer with a **Choose Install Location** step, desktop/Start Menu shortcuts, and an uninstaller. Linux uses a `.deb` package for Debian/Ubuntu (Debian packages install in system paths set by the package manager; installation-directory selection is not a normal part of a `.deb` install).

### Windows
Double-click `Knight-Chess-1.1.0-win-x64.exe` (the exact name may vary). Select your installation folder when prompted. The build is not code-signed, so Windows may warn that the publisher is unknown; review the source/build before deciding whether to run it.

### Ubuntu / Debian
`sudo apt install ./Knight-Chess-1.1.0-linux-amd64.deb` (use your actual downloaded filename). Open **Knight Chess** from the applications menu.

## Build locally instead

Requires Node 24, npm, and Internet for Electron dependencies.

```sh
npm ci
npm install --no-save electron@38.2.0 electron-builder@26.0.12
npm run desktop:package:linux
```

On Windows PowerShell use `npm.cmd` and `npm.cmd run desktop:package:windows` rather than the Linux command. Running `npm ci` restores the web-app lockfile; the second command installs desktop packagers without changing project dependencies permanently.

## What this package is not

The Windows and Linux builds are *desktop installations*, not local backend servers. Cloud multiplayer needs your deployed Django server and Neon DB. The online server URL must be configured separately on each computer. Offline chess features operate without that connection.

## Verification and dependencies

The GitHub Actions workflow builds separately on native Windows and Linux runners. The current chat environment has no npm registry connectivity, so the actual Electron installers cannot be built or tested in the chat; use the provided Actions workflow and check its build results. This is why we provide the complete build source instead of misleadingly naming an unbuilt executable as an installer.

Electron and electron-builder are third-party packages with their own licenses. This project also uses `python-chess` and optional Stockfish as described in `THIRD_PARTY_NOTICES.md`.
