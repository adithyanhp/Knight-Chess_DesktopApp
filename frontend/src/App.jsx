import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import {
  Swords,
  Lightbulb,
  BookOpen,
  GraduationCap,
  Sparkles,
  User,
  Settings as SettingsIcon,
  HelpCircle,
  Bell,
  Menu,
  X,
  ChevronRight,
  Flame,
  Heart,
  Check,
  Keyboard,
  WifiOff,
  LoaderCircle,
} from "lucide-react";
import { KnightLogo, Avatar } from "./components/Piece";
import Play, { BOT_UI, makePgn } from "./components/Play";
import Puzzles from "./components/Puzzles";
import Review from "./components/Review";
import Settings from "./components/Settings";
import Learn from "./components/Learn";
import Coach from "./components/Coach";
import Profile from "./components/Profile";
import {
  useStorage,
  DEFAULT_SETTINGS,
  readStorage,
  writeStorage,
} from "./lib/storage";
import {
  api,
  getConnectionStatus,
  subscribeConnection,
  retryConnection,
} from "./lib/api";
import { normalizeServerGame } from "./lib/server";
const NAV = [
  { id: "play", label: "Play", icon: Swords },
  { id: "puzzles", label: "Puzzles", icon: Lightbulb },
  { id: "learn", label: "Learn", icon: BookOpen },
  { id: "coach", label: "Coach", icon: GraduationCap, badge: "FOR YOU" },
  { id: "review", label: "Game Review", icon: Sparkles },
  { id: "profile", label: "My Profile", icon: User },
];
const TITLES = {
  play: ["Let’s play chess.", "A good day for a great move."],
  puzzles: [
    "Find your next brilliant move.",
    "A little practice. A sharper chess mind.",
  ],
  learn: [
    "Learn something. Play better.",
    "Build your chess knowledge, one idea at a time.",
  ],
  coach: [
    "A little guidance goes a long way.",
    "Build good habits. Find your own style.",
  ],
  review: ["Look back. Move forward.", "Every position is a chance to learn."],
  profile: [
    "Your chess journey.",
    "Celebrate the small wins. Keep making moves.",
  ],
  settings: [
    "A space that feels like you.",
    "Set up your board, your profile, and your game.",
  ],
};
export default function App() {
  const connection = useSyncExternalStore(
    subscribeConnection,
    getConnectionStatus,
    getConnectionStatus,
  );
  const [page, setPage] = useState(() => {
    const hash = location.hash.slice(1);
    return TITLES[hash] ? hash : "play";
  });
  const [profile, setProfile] = useStorage("profile", {
    username: "Adithyan",
    display_name: "Adithyan",
    bio: "Every move is a new possibility.",
    country: "India",
    avatar: "",
    xp: 0,
    created_at: new Date().toISOString(),
  });
  const [savedSettings, setSettings] = useStorage("settings", DEFAULT_SETTINGS);
  const settings = { ...DEFAULT_SETTINGS, ...savedSettings };
  const [games, setGames] = useStorage("games", []);
  const [stats, setStats] = useStorage("stats", {
    games: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    puzzlesSolved: 0,
    streak: 0,
    lastPractice: null,
  });
  const [completed, setCompleted] = useStorage("completedLessons", []);
  const [solved, setSolved] = useStorage("solvedPuzzles", []);
  const [sessionKey, setSessionKey] = useState(0);
  const [selectedReview, setSelectedReview] = useState(null);
  const [settingsTab, setSettingsTab] = useState("appearance");
  const [lessonId, setLessonId] = useState(null);
  const [practiceFen, setPracticeFen] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [mobileNav, setMobileNav] = useState(false);
  const [help, setHelp] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const toastTimer = useRef();
  const toast = useCallback((message) => {
    clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(""), 5000);
  }, []);
  const navigate = useCallback((p) => {
    setPage(p);
    location.hash = p;
    setMobileNav(false);
    setNotifications(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);
  useEffect(() => {
    const update = () => {
      const p = location.hash.slice(1);
      if (TITLES[p]) setPage(p);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {});
  }, []);
  const practice = useCallback(
    (xp = 0) => {
      setProfile((p) => ({ ...p, xp: (p.xp || 0) + xp }));
      const today = new Date().toLocaleDateString("en-CA");
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString(
        "en-CA",
      );
      setStats((s) => ({
        ...s,
        streak:
          s.lastPractice === today
            ? s.streak
            : s.lastPractice === yesterday
              ? s.streak + 1
              : 1,
        lastPractice: today,
      }));
    },
    [setProfile, setStats],
  );
  const applyServerProfile = useCallback(
    (p) => {
      setProfile(p);
      setStats((s) => ({
        ...s,
        games: p.games_played || 0,
        wins: p.wins || 0,
        draws: p.draws || 0,
        losses: p.losses || 0,
        puzzlesSolved: p.puzzles_solved || 0,
        opponentGames: p.opponent_games || 0,
        practiceGames: p.practice_games || 0,
      }));
    },
    [setProfile, setStats],
  );
  const finishGame = useCallback(
    (g) => {
      if (g.result === "*" || g.reason === "Cancelled") return;
      const current = readStorage("games", []);
      if (current.some((existing) => existing.id === g.id)) return;
      const result = String(g.result || "*")
        .replace(/[–—−]/g, "-")
        .replace(/½/g, "1/2");
      const playerColor = g.humanColor || "w";
      const win = g.winner === playerColor;
      const draw = !g.winner;
      const personal = g.mode !== "local";
      const normalized = {
        ...g,
        result,
        playerColor,
        bot_name: BOT_UI.find((b) => b.id === g.botId)?.name,
        pgn:
          g.serverId && g.pgn
            ? g.pgn
            : makePgn({ ...g, result }, readStorage("profile", {}).username),
      };
      setGames((list) => [normalized, ...list].slice(0, 100));
      setStats((s) => ({
        ...s,
        games: s.games + 1,
        opponentGames: (s.opponentGames || 0) + (personal ? 1 : 0),
        practiceGames: (s.practiceGames || 0) + (personal ? 0 : 1),
        wins: s.wins + (personal && win ? 1 : 0),
        draws: s.draws + (personal && draw ? 1 : 0),
        losses: s.losses + (personal && !win && !draw ? 1 : 0),
      }));
      practice(g.serverId ? 0 : personal && win ? 50 : 20);
      if (g.serverId && readStorage("token", ""))
        api("/profile")
          .then(applyServerProfile)
          .catch(() => {});
    },
    [setGames, setStats, practice, applyServerProfile],
  );
  const solvedPuzzle = useCallback(
    (id, xp, server = false) => {
      if (readStorage("solvedPuzzles", []).includes(id)) return;
      setSolved((list) => [...list, id].slice(-1000));
      setStats((s) => ({ ...s, puzzlesSolved: s.puzzlesSolved + 1 }));
      practice(xp);
      if (server)
        api("/profile")
          .then(applyServerProfile)
          .catch(() => {});
    },
    [setSolved, setStats, practice, applyServerProfile],
  );
  const completeLesson = useCallback(
    async (id) => {
      if (readStorage("completedLessons", []).includes(id)) return;
      const next = [...readStorage("completedLessons", []), id];
      if (readStorage("token", "")) {
        try {
          const data = await api("/progress", {
            method: "PATCH",
            body: JSON.stringify({ lesson_id: id }),
          });
          setCompleted(data.completed_lessons);
          setProfile((p) => ({ ...p, xp: data.xp }));
          practice(0);
          toast("Lesson complete. +25 XP. Progress saved to your account.");
        } catch (e) {
          toast(e.message);
        }
      } else {
        setCompleted(next);
        practice(25);
        toast("Lesson complete. +25 XP. Keep that curiosity going.");
      }
    },
    [setCompleted, setProfile, practice, toast],
  );
  const openSettings = useCallback(
    (action) => {
      if (action === "sound") {
        setSettings((s) => ({ ...DEFAULT_SETTINGS, ...s, sound: !s.sound }));
        return;
      }
      setSettingsTab("appearance");
      navigate("settings");
    },
    [navigate, setSettings],
  );
  const review = useCallback(
    (g) => {
      setSelectedReview(g);
      navigate("review");
    },
    [navigate],
  );
  const goLesson = (id) => {
    setLessonId(id);
    navigate("learn");
  };
  const startPractice = (fen) => {
    setPracticeFen(
      fen || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    navigate("play");
  };
  const onAccount = async (p) => {
    if (p) {
      if (!readStorage("sessionOwner", null))
        writeStorage("guestBackup", {
          profile,
          settings,
          stats,
          games,
          completed,
          solved,
          active: readStorage("activeGame", null),
        });
      writeStorage("sessionOwner", p.username);
      applyServerProfile(p);
      setCompleted(p.completed_lessons || []);
      setSolved([]);
      setSettings({ ...DEFAULT_SETTINGS, ...p.settings });
      setSelectedReview(null);
      let history = [];
      try {
        const data = await api("/games");
        history = (data.games || []).map((g) =>
          normalizeServerGame(g, p.username),
        );
      } catch (e) {
        toast(e.message);
      }
      setGames(
        history.filter((g) => g.status === "finished" && g.result !== "*"),
      );
      writeStorage(
        "activeGame",
        history.find((g) => g.status === "playing" || g.status === "waiting") ||
          null,
      );
      setSessionKey((n) => n + 1);
    } else {
      const guest = readStorage("guestBackup", null);
      writeStorage("sessionOwner", null);
      if (guest) {
        setProfile(guest.profile);
        setSettings(guest.settings);
        setStats(guest.stats);
        setGames(guest.games);
        setCompleted(guest.completed);
        setSolved(guest.solved || []);
        writeStorage("activeGame", guest.active || null);
      } else {
        writeStorage("activeGame", null);
      }
      setSelectedReview(null);
      setSessionKey((n) => n + 1);
    }
  };
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (mobileNav ? "sidebar-open" : "")}>
        <button
          className="brand"
          onClick={() => navigate("play")}
          aria-label="Knight home"
        >
          <span className="brand-icon">
            <KnightLogo size={41} />
          </span>
          <span>
            knight<span className="brand-dot">.</span>
          </span>
        </button>
        <div className="sidebar-kicker">YOUR PERSONAL CHESS CLUB</div>
        <nav className="main-nav" aria-label="Main navigation">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? "nav-item active" : "nav-item"}
              onClick={() => navigate(item.id)}
            >
              <item.icon size={22} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="daily-reminder">
            <div className="reminder-icon">
              <Flame size={21} />
            </div>
            <strong>A little better, every day.</strong>
            <p>Your next move is a step forward.</p>
            <button onClick={() => navigate("learn")}>
              Keep learning <ChevronRight size={14} />
            </button>
          </div>
          <button
            className={"nav-item " + (page === "settings" ? "active" : "")}
            onClick={() => openSettings()}
          >
            <SettingsIcon size={21} />
            <span>Settings</span>
          </button>
          <button
            className="sidebar-profile"
            onClick={() => navigate("profile")}
          >
            <Avatar name={profile.username} src={profile.avatar} size={38} />
            <span>
              <strong>{profile.username}</strong>
              <small>
                Level {1 + Math.floor((profile.xp || 0) / 250)} ·{" "}
                {(profile.xp || 0).toLocaleString()} XP
              </small>
            </span>
            <ChevronRight size={16} />
          </button>
          <div className="sidebar-footer">
            Made for the love of the game <Heart size={11} />
          </div>
        </div>
      </aside>
      {mobileNav && (
        <button
          className="sidebar-scrim"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <main className="main-content">
        <header className="page-header">
          <div className="page-heading">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobileNav(true)}
            >
              <Menu size={25} />
            </button>
            <div>
              <div className="breadcrumb">YOUR MOVE, YOUR JOURNEY</div>
              <h1>{TITLES[page][0]}</h1>
              <p>{TITLES[page][1]}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="quick-guide" onClick={() => setHelp(true)}>
              <HelpCircle size={18} />
              <span>Quick guide</span>
            </button>
            <div className="notification-wrap">
              <button
                className={"icon-button " + (notifications ? "selected" : "")}
                aria-label="View your progress"
                onClick={() => setNotifications((n) => !n)}
              >
                <Bell size={21} />
              </button>
              {notifications && (
                <div className="notification-panel">
                  <h3>Your daily check-in</h3>
                  <p>
                    {stats.lastPractice ===
                    new Date().toLocaleDateString("en-CA")
                      ? "You made time for chess today. Keep it up."
                      : "A quick puzzle is a great place to start today."}
                  </p>
                  <div>
                    <Flame size={18} />
                    {stats.streak || 0} day practice streak
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => navigate("puzzles")}
                  >
                    Try a puzzle
                  </button>
                </div>
              )}
            </div>
            <span className="header-divider" />
            <button
              className="header-avatar"
              onClick={() => navigate("profile")}
              aria-label="Your profile"
            >
              <Avatar name={profile.username} src={profile.avatar} size={38} />
            </button>
          </div>
        </header>
        {(connection.phase === "connecting" ||
          connection.phase === "offline") && (
          <div
            className={"server-connection-banner " + connection.phase}
            role="status"
            aria-live="polite"
          >
            {connection.phase === "connecting" ? (
              <LoaderCircle className="spin" size={20} />
            ) : (
              <WifiOff size={20} />
            )}
            <p>{connection.message}</p>
            {connection.phase === "offline" && (
              <button
                className="small-text-button"
                onClick={() =>
                  retryConnection().catch((error) => toast(error.message))
                }
              >
                Retry connection
              </button>
            )}
          </div>
        )}
        <div className="page-content">
          <div style={{ display: page === "play" ? "block" : "none" }}>
            <Play
              key={sessionKey}
              profile={profile}
              settings={settings}
              onSettings={openSettings}
              onGameComplete={finishGame}
              onReview={review}
              onNavigate={navigate}
              toast={toast}
              practiceFen={practiceFen}
              clearPractice={() => setPracticeFen(null)}
            />
          </div>
          {page === "puzzles" && (
            <Puzzles
              settings={settings}
              stats={stats}
              onSolved={solvedPuzzle}
              toast={toast}
            />
          )}{" "}
          {page === "learn" && (
            <Learn
              completedLessons={completed}
              onComplete={completeLesson}
              onPractice={startPractice}
              initialLessonId={lessonId}
            />
          )}{" "}
          {page === "coach" && (
            <Coach
              completedLessons={completed}
              onLesson={goLesson}
              onPractice={() => navigate("puzzles")}
            />
          )}{" "}
          {page === "profile" && (
            <Profile
              profile={profile}
              stats={stats}
              completedLessons={completed}
              games={games}
              onEditProfile={() => {
                setSettingsTab("profile");
                navigate("settings");
              }}
              onReview={review}
            />
          )}{" "}
          {page === "review" && (
            <Review
              game={selectedReview}
              games={games}
              settings={settings}
              onNavigate={navigate}
              toast={toast}
            />
          )}{" "}
          {page === "settings" && (
            <Settings
              key={settingsTab}
              settings={settings}
              onChange={setSettings}
              profile={profile}
              onProfile={setProfile}
              toast={toast}
              initialTab={settingsTab}
              onAccount={onAccount}
            />
          )}
        </div>
        <footer className="main-footer">
          <span>
            <KnightLogo size={18} />A little focus. A world of possibilities.
          </span>
          <span>
            Your personal chess space <span>✦</span>
          </span>
        </footer>
      </main>
      {toastMessage && (
        <div className="toast" role="status">
          <Check size={18} />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {help && (
        <div className="modal-backdrop" onClick={() => setHelp(false)}>
          <div
            className="modal-card guide-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-button"
              aria-label="Close guide"
              onClick={() => setHelp(false)}
            >
              <X size={21} />
            </button>
            <div className="guide-logo">
              <KnightLogo size={48} />
            </div>
            <h2>Welcome to your chess club.</h2>
            <p>Everything you need for a little practice or a great game.</p>
            <div className="guide-steps">
              <div>
                <Swords />
                <span>
                  <strong>Make your move</strong>
                  <small>
                    Choose a bot or a local friend, set your clock, and start.
                    Click or drag pieces to move.
                  </small>
                </span>
              </div>
              <div>
                <Lightbulb />
                <span>
                  <strong>Build your chess instinct</strong>
                  <small>
                    Solve endless mate-in-one puzzles and work through 30
                    lessons with quizzes.
                  </small>
                </span>
              </div>
              <div>
                <SettingsIcon />
                <span>
                  <strong>Make yourself at home</strong>
                  <small>
                    Change board themes, piece styles, colors, and your profile
                    in Settings.
                  </small>
                </span>
              </div>
              <div>
                <WifiOff />
                <span>
                  <strong>Your board goes with you</strong>
                  <small>
                    Browser games and progress stay on this device. The full
                    Sign in to save games and play private online rooms.
                  </small>
                </span>
              </div>
            </div>
            <button
              className="primary-button large-button"
              onClick={() => setHelp(false)}
            >
              Let’s play
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
