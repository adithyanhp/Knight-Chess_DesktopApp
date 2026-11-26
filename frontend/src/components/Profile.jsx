import React from "react";
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Crown,
  Flame,
  Flag,
  Globe2,
  Medal,
  Pencil,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import { LESSONS } from "../data/lessons";
import { BOTS } from "../chess/bots";
import "./learning.css";

function initial(name) {
  return (name || "Player").trim().slice(0, 1).toUpperCase();
}
function readableDate(value) {
  const date = new Date(value || Date.now());
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
export function gameResult(game) {
  if (game.mode === "local") return { label: "Practice", type: "saved" };
  const result = String(game.result || "")
    .replace(/[–—−]/g, "-")
    .replace(/½/g, "1/2")
    .trim();
  const color =
    game.playerColor ||
    game.player_color ||
    game.humanColor ||
    game.user_color ||
    "w";
  const black = color === "b" || color === "black";
  if (result === "1/2-1/2" || result === "draw")
    return { label: "Draw", type: "draw" };
  if (result === "1-0")
    return { label: black ? "Loss" : "Win", type: black ? "loss" : "win" };
  if (result === "0-1")
    return { label: black ? "Win" : "Loss", type: black ? "win" : "loss" };
  if (result === "win" || result === "loss")
    return { label: result === "win" ? "Win" : "Loss", type: result };
  return {
    label: ["active", "playing"].includes(game.status)
      ? "In progress"
      : game.status === "waiting"
        ? "Waiting"
        : "Saved",
    type: "saved",
  };
}

function opponentName(game) {
  if (game.mode === "bot" || game.bot_name || game.botName) {
    const botId = game.botId === "garry" ? "kasparov" : game.botId;
    return (
      game.bot_name ||
      game.botName ||
      game.bot?.name ||
      BOTS.find((bot) => bot.id === botId)?.name ||
      "Computer opponent"
    );
  }
  const named =
    typeof game.opponent === "string"
      ? game.opponent
      : game.opponent?.display_name ||
        game.opponent?.username ||
        game.opponent?.name;
  if (named) return named;
  return game.mode === "local"
    ? "Local opponent"
    : ["online", "multiplayer"].includes(game.mode) || game.code
      ? "Multiplayer opponent"
      : "Practice game";
}

export default function Profile({
  profile = {},
  stats = {},
  completedLessons = [],
  games = [],
  onEditProfile = () => {},
  onReview = () => {},
}) {
  const name =
    profile.display_name || profile.displayName || profile.username || "Player";
  const xp = Math.max(0, Number(profile.xp) || 0);
  const level = Math.floor(xp / 250) + 1;
  const levelProgress = xp % 250;
  const completed = LESSONS.filter((lesson) =>
    (completedLessons || []).includes(lesson.id),
  ).length;
  const recordedResults = games.map(gameResult);
  const played =
    Number(
      stats.games ??
        profile.games_played ??
        recordedResults.filter((result) => result.type !== "saved").length,
    ) || 0;
  const wins =
    Number(
      stats.wins ??
        profile.wins ??
        recordedResults.filter((result) => result.type === "win").length,
    ) || 0;
  const draws =
    Number(
      stats.draws ??
        recordedResults.filter((result) => result.type === "draw").length,
    ) || 0;
  const losses =
    Number(
      stats.losses ??
        recordedResults.filter((result) => result.type === "loss").length,
    ) || 0;
  const puzzles =
    Number(
      stats.puzzlesSolved ?? stats.puzzles_solved ?? profile.puzzles_solved,
    ) || 0;
  const streak = Number(stats.streak) || 0;
  const joinedAt =
    profile.joined_at || profile.date_joined || profile.created_at;
  const joinedDate = joinedAt ? new Date(joinedAt) : null;
  const joinedLabel =
    joinedDate && !Number.isNaN(joinedDate.getTime())
      ? `Joined ${joinedDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`
      : "Your personal chess space";
  const achievements = [
    {
      id: "first-game",
      title: "First move",
      description: "Complete your first game",
      icon: Flag,
      value: played,
      target: 1,
      color: "green",
    },
    {
      id: "first-win",
      title: "Victory lap",
      description: "Win your first game",
      icon: Trophy,
      value: wins,
      target: 1,
      color: "gold",
    },
    {
      id: "ten-games",
      title: "Regular at the board",
      description: "Complete 10 games",
      icon: Shield,
      value: played,
      target: 10,
      color: "blue",
    },
    {
      id: "puzzle-starter",
      title: "Pattern finder",
      description: "Solve 10 puzzles",
      icon: Target,
      value: puzzles,
      target: 10,
      color: "purple",
    },
    {
      id: "puzzle-master",
      title: "Tactical vision",
      description: "Solve 50 puzzles",
      icon: Zap,
      value: puzzles,
      target: 50,
      color: "gold",
    },
    {
      id: "first-lesson",
      title: "Curious mind",
      description: "Complete your first lesson",
      icon: BookOpen,
      value: completed,
      target: 1,
      color: "green",
    },
    {
      id: "ten-lessons",
      title: "Dedicated student",
      description: "Complete 10 lessons",
      icon: Medal,
      value: completed,
      target: 10,
      color: "blue",
    },
    {
      id: "all-lessons",
      title: "A stronger foundation",
      description: "Complete all 30 lessons",
      icon: Crown,
      value: completed,
      target: LESSONS.length,
      color: "purple",
    },
  ];
  const unlocked = achievements.filter(
    (item) => item.value >= item.target,
  ).length;

  return (
    <section className="academy-page profile-page">
      <header className="academy-page-heading">
        <div>
          <span className="academy-eyebrow">YOUR CHESS JOURNEY</span>
          <h1>Every game tells your story.</h1>
          <p>
            Your progress, your milestones, and the moves that got you here.
          </p>
        </div>
      </header>
      <div className="profile-hero">
        <div className="profile-avatar">
          {profile.avatar ? (
            <img src={profile.avatar} alt={`${name} profile`} />
          ) : (
            <span>{initial(name)}</span>
          )}
          <span className="profile-level-chip">{level}</span>
        </div>
        <div className="profile-person">
          <div className="profile-name-row">
            <h2>{name}</h2>
            <span className="profile-member-badge">
              <Sparkles size={13} />
              Player
            </span>
          </div>
          <span className="profile-username">
            @{profile.username || "player"}
          </span>
          <p>{profile.bio || "Every move is a new possibility."}</p>
          <div className="profile-meta">
            {profile.country && (
              <span>
                <Globe2 size={15} />
                {profile.country}
              </span>
            )}
            <span>
              <CalendarDays size={15} />
              {joinedLabel}
            </span>
          </div>
        </div>
        <button
          className="academy-secondary profile-edit"
          onClick={onEditProfile}
        >
          <Pencil size={16} />
          Edit profile
        </button>
      </div>
      <div className="profile-overview-grid">
        <div className="profile-level-card">
          <span className="profile-level-emblem">
            <Award size={38} />
          </span>
          <div>
            <span className="academy-eyebrow">KEEP MOVING FORWARD</span>
            <h3>
              Level {level}{" "}
              <span>
                {level < 5
                  ? "Explorer"
                  : level < 10
                    ? "Strategist"
                    : "Dedicated player"}
              </span>
            </h3>
            <div className="academy-progress-track">
              <span style={{ width: `${(levelProgress / 250) * 100}%` }} />
            </div>
            <p>
              {levelProgress} / 250 XP to level {level + 1}
              <strong>{xp.toLocaleString()} total XP</strong>
            </p>
          </div>
        </div>
        <div className="profile-stat-card">
          <span>
            <Target size={23} />
          </span>
          <strong>{puzzles}</strong>
          <p>Puzzles solved</p>
        </div>
        <div className="profile-stat-card">
          <span>
            <BookOpen size={23} />
          </span>
          <strong>
            {completed}
            <small>/{LESSONS.length}</small>
          </strong>
          <p>Lessons completed</p>
        </div>
        <div className="profile-stat-card">
          <span>
            <Flame size={23} />
          </span>
          <strong>
            {streak}
            <small> days</small>
          </strong>
          <p>Practice streak</p>
        </div>
      </div>
      <div className="profile-columns">
        <section className="profile-games-panel">
          <div className="academy-section-heading">
            <h2>Your results</h2>
            <span className="academy-small-label">{played} games played</span>
          </div>
          <div className="profile-result-metrics">
            <div>
              <strong className="profile-win-text">{wins}</strong>
              <span>Wins</span>
            </div>
            <div>
              <strong>{draws}</strong>
              <span>Draws</span>
            </div>
            <div>
              <strong className="profile-loss-text">{losses}</strong>
              <span>Losses</span>
            </div>
            <div>
              <strong>
                {played ? Math.min(100, Math.round((wins / played) * 100)) : 0}
                <small>%</small>
              </strong>
              <span>Win rate</span>
            </div>
          </div>
          <div
            className="profile-results-bar"
            aria-label={`${wins} wins, ${draws} draws, ${losses} losses`}
          >
            {played > 0 ? (
              <>
                <span className="is-win" style={{ flex: wins || 0 }} />
                <span className="is-draw" style={{ flex: draws || 0 }} />
                <span className="is-loss" style={{ flex: losses || 0 }} />
              </>
            ) : (
              <span className="is-empty" />
            )}
          </div>
          <div className="academy-section-heading profile-recent-heading">
            <h2>Recent games</h2>
            <span className="academy-small-label">
              {games.length
                ? "Select a game to review"
                : "Your history starts here"}
            </span>
          </div>
          {games.length ? (
            <div className="profile-games-list">
              {games.slice(0, 8).map((game, index) => {
                const result = gameResult(game);
                const opponent = opponentName(game);
                return (
                  <button
                    className="profile-game-row"
                    key={game.id || index}
                    onClick={() => onReview(game)}
                  >
                    <span
                      className={`profile-result-indicator is-${result.type}`}
                    >
                      {result.type === "win"
                        ? "+"
                        : result.type === "loss"
                          ? "−"
                          : result.type === "draw"
                            ? "="
                            : "·"}
                    </span>
                    <div>
                      <strong>{opponent}</strong>
                      <span>
                        {game.opening?.name ||
                          (typeof game.opening === "string"
                            ? game.opening
                            : "") ||
                          `${game.mode === "local" ? "Over the board" : "Chess game"} · ${game.minutes || game.timeControl || 10} min`}
                      </span>
                    </div>
                    <div className="profile-game-result">
                      <strong className={`is-${result.type}`}>
                        {result.label}
                      </strong>
                      <span>
                        {readableDate(
                          game.date || game.created_at || game.createdAt,
                        )}
                      </span>
                    </div>
                    <ChevronRight size={17} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="profile-empty-games">
              <Trophy size={35} />
              <h3>Your first game is a fresh start.</h3>
              <p>Completed games will appear here, ready for another look.</p>
            </div>
          )}
        </section>
        <section className="profile-achievements-panel">
          <div className="academy-section-heading">
            <h2>Achievements</h2>
            <span className="profile-achievement-count">
              {unlocked}/{achievements.length}
            </span>
          </div>
          <p className="profile-panel-description">
            Little milestones. Real progress.
          </p>
          <div className="profile-achievements-grid">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              const earned = achievement.value >= achievement.target;
              return (
                <div
                  className={`profile-achievement ${earned ? "is-earned" : ""}`}
                  key={achievement.id}
                >
                  <span
                    className={`profile-achievement-icon color-${achievement.color}`}
                  >
                    <Icon size={27} />
                    {earned && (
                      <CheckCircle2
                        size={14}
                        className="profile-achievement-check"
                      />
                    )}
                  </span>
                  <strong>{achievement.title}</strong>
                  <p>{achievement.description}</p>
                  <span className="profile-achievement-progress">
                    {earned
                      ? "Unlocked"
                      : `${Math.min(achievement.value, achievement.target)} / ${achievement.target}`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <p className="academy-footnote">
        Levels reflect your activity in this app. They are not an official chess
        rating or title.
      </p>
    </section>
  );
}
