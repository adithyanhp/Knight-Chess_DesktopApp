import React, { useState, useRef, useEffect } from "react";
import {
  Palette,
  Volume2,
  User,
  Shield,
  Database,
  Check,
  Upload,
  Download,
  LogIn,
  LogOut,
  LoaderCircle,
  Camera,
  Grid3X3,
  SlidersHorizontal,
  Monitor,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import ChessBoard from "./ChessBoard";
import Piece, { Avatar } from "./Piece";
import {
  BOARD_THEMES,
  DEFAULT_SETTINGS,
  readStorage,
  writeStorage,
  downloadText,
} from "../lib/storage";
import { api, authenticate } from "../lib/api";
const previewFen =
  "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 4";
export default function Settings({
  settings,
  onChange,
  profile,
  onProfile,
  toast,
  initialTab = "appearance",
  onAccount,
}) {
  const [tab, setTab] = useState(initialTab);
  const [draft, setDraft] = useState(profile);
  const [authMode, setAuthMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [signedIn, setSignedIn] = useState(!!readStorage("token", ""));
  const upload = useRef();
  const [connection, setConnection] = useState(null);
  useEffect(() => setDraft(profile), [profile.username, profile.avatar]);
  const update = (key, value) => {
    const next = { ...settings, [key]: value };
    onChange(next);
    if (signedIn)
      api("/profile", {
        method: "PATCH",
        body: JSON.stringify({ settings: next }),
      }).catch(() => {});
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(draft.username)) {
      toast("Choose a username with 3–30 letters, numbers, or underscores.");
      return;
    }
    setBusy(true);
    try {
      if (signedIn) {
        const result = await api("/profile", {
          method: "PATCH",
          body: JSON.stringify({
            username: draft.username,
            display_name: draft.display_name,
            bio: draft.bio,
            country: draft.country,
            avatar: draft.avatar,
          }),
        });
        onProfile({ ...profile, ...result });
      } else onProfile({ ...profile, ...draft });
      toast("Your profile is updated.");
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  };
  const selectPhoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("Choose a JPG, PNG, or WebP image.");
      return;
    }
    if (file.size > 1000000) {
      toast("Choose an image smaller than 1 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, avatar: reader.result }));
    reader.readAsDataURL(file);
  };
  const submitAuth = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await authenticate(authMode, username, password);
      const p = await api("/profile");
      setSignedIn(true);
      setDraft(p);
      await onAccount?.(p);
      setPassword("");
      toast(
        authMode === "register"
          ? "Your account is ready. Welcome to Knight."
          : "Welcome back. You’re signed in.",
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {}
    writeStorage("token", "");
    setSignedIn(false);
    onAccount?.(null);
    toast("Signed out. You can still play offline.");
  };
  const exportData = () => {
    const data = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      games: readStorage("games", []),
      stats: readStorage("stats", {}),
      completedLessons: readStorage("completedLessons", []),
    };
    downloadText(
      "knight-personal-backup.json",
      JSON.stringify(data, null, 2),
      "application/json",
    );
    toast("Your personal backup is ready.");
  };
  return (
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings categories">
        {[
          { id: "appearance", label: "Board & pieces", icon: Palette },
          { id: "gameplay", label: "Gameplay", icon: SlidersHorizontal },
          { id: "profile", label: "Your profile", icon: User },
          { id: "account", label: "Account", icon: Shield },
          { id: "data", label: "Your data", icon: Database },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={tab === item.id ? "active" : ""}
          >
            <item.icon size={19} />
            {item.label}
            <ChevronRight size={15} />
          </button>
        ))}
        <div className="settings-save-note">
          <CheckCircle2 size={15} />
          Preferences save automatically
        </div>
      </nav>
      <section className="settings-content">
        {tab === "appearance" ? (
          <>
            <div className="settings-section-heading">
              <div>
                <h2>Make this board yours.</h2>
                <p>A familiar place for your next great move.</p>
              </div>
              <Palette size={26} />
            </div>
            <div className="appearance-grid">
              <div>
                <h3>Board theme</h3>
                <div className="board-theme-grid">
                  {BOARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      className={
                        settings.boardTheme === theme.id ? "selected" : ""
                      }
                      onClick={() => update("boardTheme", theme.id)}
                    >
                      <div className="theme-swatch">
                        {Array.from({ length: 8 }, (_, i) => (
                          <span
                            key={i}
                            style={{
                              background:
                                (Math.floor(i / 4) + (i % 4)) % 2 === 0
                                  ? theme.light
                                  : theme.dark,
                            }}
                          />
                        ))}
                        {settings.boardTheme === theme.id && (
                          <span className="theme-check">
                            <Check size={17} />
                          </span>
                        )}
                      </div>
                      <span>{theme.name}</span>
                    </button>
                  ))}
                </div>
                <h3 className="settings-subheading">Piece style</h3>
                <div className="piece-style-grid">
                  {["classic", "modern"].map((style) => (
                    <button
                      className={
                        settings.pieceTheme === style ? "selected" : ""
                      }
                      onClick={() => update("pieceTheme", style)}
                      key={style}
                    >
                      <div>
                        {["n", "k", "b"].map((p) => (
                          <Piece
                            key={p}
                            type={p}
                            color="w"
                            settings={{ ...settings, pieceTheme: style }}
                          />
                        ))}
                      </div>
                      <span>
                        {style === "classic" ? "Classic" : "Modern outline"}
                      </span>
                    </button>
                  ))}
                </div>
                <h3 className="settings-subheading">Piece colors</h3>
                <div className="piece-colors">
                  <label>
                    <input
                      type="color"
                      value={settings.lightPiece}
                      onChange={(e) => update("lightPiece", e.target.value)}
                    />
                    <span>White pieces</span>
                  </label>
                  <label>
                    <input
                      type="color"
                      value={settings.darkPiece}
                      onChange={(e) => update("darkPiece", e.target.value)}
                    />
                    <span>Black pieces</span>
                  </label>
                </div>
              </div>
              <div className="settings-board-preview">
                <ChessBoard
                  fen={previewFen}
                  settings={settings}
                  disabled
                  small
                />
                <span>
                  <Monitor size={15} />
                  Live preview
                </span>
                <button
                  className="text-button"
                  onClick={() => {
                    const next = {
                      ...settings,
                      boardTheme: "green",
                      pieceTheme: "classic",
                      lightPiece: DEFAULT_SETTINGS.lightPiece,
                      darkPiece: DEFAULT_SETTINGS.darkPiece,
                    };
                    onChange(next);
                    if (signedIn)
                      api("/profile", {
                        method: "PATCH",
                        body: JSON.stringify({ settings: next }),
                      }).catch(() => {});
                    toast("Classic board restored.");
                  }}
                >
                  Restore classic look
                </button>
              </div>
            </div>
            <Toggle
              label="Board coordinates"
              description="Show ranks 1–8 and files a–h on the board."
              value={settings.coordinates}
              onChange={(v) => update("coordinates", v)}
            />
          </>
        ) : tab === "gameplay" ? (
          <>
            <div className="settings-section-heading">
              <div>
                <h2>Play your way.</h2>
                <p>The little details that make a game feel right.</p>
              </div>
              <SlidersHorizontal size={26} />
            </div>
            <Toggle
              label="Move sounds"
              description="A subtle sound when a piece moves or captures."
              value={settings.sound}
              onChange={(v) => update("sound", v)}
            />
            <Toggle
              label="Legal move hints"
              description="Show the squares your selected piece can move to."
              value={settings.legalMoves}
              onChange={(v) => update("legalMoves", v)}
            />
            <Toggle
              label="Always promote to queen"
              description="Skip the promotion picker and choose a queen automatically."
              value={settings.autoQueen}
              onChange={(v) => update("autoQueen", v)}
            />
            <Toggle
              label="Auto-flip in local games"
              description="Rotate the board to face the player whose turn it is."
              value={settings.autoFlip}
              onChange={(v) => update("autoFlip", v)}
            />
            <div className="tip-card">
              <h3>Good to know</h3>
              <p>
                You can move a piece by clicking its starting and ending square,
                or by dragging it. All games use standard chess rules, including
                castling, en passant, and promotion.
              </p>
            </div>
          </>
        ) : tab === "profile" ? (
          <form onSubmit={saveProfile}>
            <div className="settings-section-heading">
              <div>
                <h2>A face behind the moves.</h2>
                <p>Personalize how you appear at the board.</p>
              </div>
              <User size={26} />
            </div>
            <div className="profile-photo-editor">
              <Avatar
                name={draft.display_name || draft.username}
                src={draft.avatar}
                size={88}
              />
              <div>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => upload.current?.click()}
                >
                  <Camera size={17} />
                  Upload photo
                </button>
                <p>JPG, PNG, or WebP · up to 1 MB</p>
                {draft.avatar && (
                  <button
                    className="text-button"
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, avatar: "" }))}
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={upload}
                hidden
                accept="image/png,image/jpeg,image/webp"
                onChange={selectPhoto}
              />
            </div>
            <div className="form-grid">
              <label>
                Username
                <input
                  required
                  minLength={3}
                  maxLength={30}
                  value={draft.username || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, username: e.target.value })
                  }
                />
              </label>
              <label>
                Display name
                <input
                  maxLength={80}
                  value={draft.display_name || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, display_name: e.target.value })
                  }
                />
              </label>
              <label>
                Country
                <input
                  maxLength={80}
                  value={draft.country || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, country: e.target.value })
                  }
                />
              </label>
              <label className="full-width">
                About you
                <textarea
                  maxLength={500}
                  rows={3}
                  value={draft.bio || ""}
                  onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                />
              </label>
            </div>
            <button className="primary-button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={18} />
              ) : (
                <Check size={18} />
              )}
              Save profile
            </button>
          </form>
        ) : tab === "account" ? (
          <>
            <div className="settings-section-heading">
              <div>
                <h2>Your personal chess account.</h2>
                <p>Save your progress and play private online games.</p>
              </div>
              <Shield size={26} />
            </div>
            {signedIn ? (
              <div className="account-connected">
                <CheckCircle2 size={35} />
                <h3>Signed in as {profile.username}</h3>
                <p>
                  Your account can create private rooms and save games on the
                  connected server.
                </p>
                <button className="secondary-button" onClick={logout}>
                  <LogOut size={17} />
                  Sign out
                </button>
              </div>
            ) : (
              <>
                <div className="account-server-note">
                  <Monitor size={22} />
                  <div>
                    <strong>Your account connects your chess progress</strong>
                    <p>
                      Sign in to save games, use Stockfish, and play online
                      rooms. Your first connection may take about a minute. You
                      can also play offline without an account.
                    </p>
                  </div>
                </div>
                <div className="segmented-control auth-tabs">
                  <button
                    className={authMode === "login" ? "selected" : ""}
                    onClick={() => setAuthMode("login")}
                  >
                    Sign in
                  </button>
                  <button
                    className={authMode === "register" ? "selected" : ""}
                    onClick={() => setAuthMode("register")}
                  >
                    Create account
                  </button>
                </div>
                <form className="auth-form" onSubmit={submitAuth}>
                  <label>
                    Username
                    <input
                      required
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={30}
                      placeholder="Your chess name"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      required
                      type="password"
                      autoComplete={
                        authMode === "login"
                          ? "current-password"
                          : "new-password"
                      }
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                    />
                  </label>
                  {error && <div className="inline-error">{error}</div>}
                  <button
                    className="primary-button large-button"
                    disabled={busy}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={18} />
                    ) : (
                      <LogIn size={18} />
                    )}{" "}
                    {authMode === "login" ? "Sign in" : "Create account"}
                  </button>
                </form>
              </>
            )}
            <button
              className="text-button connection-test"
              onClick={async () => {
                setConnection("Checking connection…");
                try {
                  await api("/health");
                  setConnection(
                    "Online server and database connected. Accounts are available.",
                  );
                } catch (error) {
                  setConnection(error.message);
                }
              }}
            >
              Check server connection
            </button>
            {connection && <p className="tiny-note">{connection}</p>}
          </>
        ) : (
          <>
            <div className="settings-section-heading">
              <div>
                <h2>Your progress belongs to you.</h2>
                <p>Take a copy of your personal chess journey.</p>
              </div>
              <Database size={26} />
            </div>
            <div className="data-export-card">
              <Download size={32} />
              <h3>Download your personal data</h3>
              <p>
                Export your profile, settings, completed games, puzzle
                statistics, and lesson progress as a JSON file. Your password
                and sign-in token are excluded.
              </p>
              <button className="primary-button" onClick={exportData}>
                <Download size={18} />
                Export backup
              </button>
            </div>
            <div className="tip-card">
              <h3>Where your progress lives</h3>
              <p>
                Browser mode stores your progress on this device. Signed-in
                server games and your account are stored in PostgreSQL. Export a
                backup before clearing your browser’s site data.
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function Toggle({ label, description, value, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button
        role="switch"
        aria-label={label}
        aria-checked={!!value}
        className={"toggle-switch " + (value ? "on" : "")}
        onClick={() => onChange(!value)}
      >
        <span />
      </button>
    </div>
  );
}
