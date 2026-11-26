import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Chess } from "chess.js";
import {
  Bot,
  Users,
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCcw,
  RefreshCw,
  Volume2,
  VolumeX,
  Expand,
  Flag,
  Handshake,
  BookOpen,
  Sparkles,
  Swords,
  Globe,
  Copy,
  Check,
  LoaderCircle,
  X,
  Trophy,
  Download,
  Lightbulb,
} from "lucide-react";
import ChessBoard from "./ChessBoard";
import Piece, { Avatar, KnightLogo } from "./Piece";
import { getBotMove } from "../chess/client";
import { getOpening } from "../data/openings";
import {
  useStorage,
  formatTime,
  playMoveSound,
  downloadText,
  readStorage,
} from "../lib/storage";
import { api } from "../lib/api";
import { startSerialPolling } from "../lib/polling.js";
import { normalizeServerGame, recoverLatestServerGame } from "../lib/server";
export const BOT_UI = [
  {
    id: "magnus",
    name: "Magnus Carlsen",
    short: "Magnus",
    flag: "🇳🇴",
    title: "The endgame virtuoso",
    description:
      "Patient, precise, and always finding a little more in the position.",
    style: "Positional",
  },
  {
    id: "hikaru",
    name: "Hikaru Nakamura",
    short: "Hikaru",
    flag: "🇺🇸",
    title: "The tactical whirlwind",
    description:
      "Stay alert. Sharp tactics and active pieces are his favorite company.",
    style: "Tactical",
  },
  {
    id: "vishy",
    name: "Viswanathan Anand",
    short: "Vishy",
    flag: "🇮🇳",
    title: "The lightning strategist",
    description:
      "Quick development, elegant combinations, and a balanced approach.",
    style: "Balanced",
  },
  {
    id: "judit",
    name: "Judit Polgár",
    short: "Judit",
    flag: "🇭🇺",
    title: "The fearless attacker",
    description:
      "Expect initiative, attacking ideas, and pressure around your king.",
    style: "Attacking",
  },
  {
    id: "garry",
    name: "Garry Kasparov",
    short: "Garry",
    flag: "🇭🇷",
    title: "The dynamic challenger",
    description:
      "Meet energetic play, central control, and relentless activity.",
    style: "Dynamic",
  },
];
const LEVELS = ["Beginner", "Club", "Advanced", "Master"];
export function rebuild(moves = [], fen) {
  const g = new Chess(fen);
  for (const move of moves) {
    try {
      g.move(
        typeof move === "string"
          ? move
          : move.san || {
              from: move.from,
              to: move.to,
              promotion: move.promotion || "q",
            },
      );
    } catch {
      break;
    }
  }
  return g;
}
export function makePgn(state, username = "Player") {
  const chess = rebuild(state?.moves, state?.startFen);
  const result = String(state?.result || "*")
    .replace(/[–—−]/g, "-")
    .replace(/½/g, "1/2");
  const name = BOT_UI.find((b) => b.id === state?.botId)?.name || "Computer";
  const human = state?.humanColor || "w";
  const white = state?.mode === "bot" && human === "b" ? name : username;
  const black =
    state?.mode === "bot" && human === "w"
      ? name
      : state?.mode === "online"
        ? state.opponent || "Opponent"
        : "Player 2";
  chess.header(
    "Event",
    "Knight personal game",
    "White",
    state?.mode === "online" && human === "b"
      ? state.opponent || "Opponent"
      : white,
    "Black",
    state?.mode === "online" && human === "b" ? username : black,
    "Date",
    new Date(state?.startedAt || Date.now())
      .toISOString()
      .slice(0, 10)
      .replaceAll("-", "."),
    "Result",
    result,
  );
  return chess.pgn();
}
export function MoveList({ moves, selected = -1, onSelect }) {
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2)
    pairs.push([moves[i], moves[i + 1]]);
  return (
    <div className="move-list">
      <div className="move-list-heading">
        <span>MOVE</span>
        <span>WHITE</span>
        <span>BLACK</span>
      </div>
      {pairs.length ? (
        pairs.map((pair, i) => (
          <div className="move-pair" key={i}>
            <span>{i + 1}.</span>
            {pair.map((move, j) => (
              <button
                className={selected === i * 2 + j ? "current-move" : ""}
                key={j}
                onClick={() => move && onSelect?.(i * 2 + j)}
                disabled={!move}
              >
                {typeof move === "string" ? move : move?.san || ""}
                {move?.classification && (
                  <i
                    className={
                      "move-quality quality-" +
                      move.classification.toLowerCase().replaceAll(" ", "-")
                    }
                  >
                    {move.classification.toLowerCase() === "best"
                      ? "★"
                      : move.classification.toLowerCase() === "blunder"
                        ? "??"
                        : move.classification.toLowerCase() === "mistake"
                          ? "?"
                          : ""}
                  </i>
                )}
              </button>
            ))}
          </div>
        ))
      ) : (
        <div className="empty-moves">
          <Swords size={30} />
          <p>
            Your next great game
            <br />
            starts with one move.
          </p>
        </div>
      )}
    </div>
  );
}
function Captures({ moves, color, settings }) {
  const pieces = moves
    .filter((m) => m.color === color && m.captured)
    .map((m) => m.captured)
    .sort((a, b) => "pnbrq".indexOf(a) - "pnbrq".indexOf(b));
  return (
    <span className="captured-pieces">
      {pieces.map((p, i) => (
        <Piece
          key={i}
          type={p}
          color={color === "w" ? "b" : "w"}
          settings={settings}
          small
        />
      ))}
    </span>
  );
}
export default function Play({
  profile,
  settings,
  onSettings,
  onGameComplete,
  onReview,
  onNavigate,
  toast,
  practiceFen,
  clearPractice,
}) {
  const [active, setActive] = useStorage("activeGame", null);
  const [botId, setBotId] = useState("magnus");
  const [level, setLevel] = useState(2);
  const [minutes, setMinutes] = useState(10);
  const [side, setSide] = useState("w");
  const [mode, setMode] = useState("bot");
  const [multiplayer, setMultiplayer] = useState("local");
  const [flipped, setFlipped] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [confirm, setConfirm] = useState(null);
  const [focus, setFocus] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [remote, setRemote] = useState(null);
  const [networkBusy, setNetworkBusy] = useState(false);
  const [networkError, setNetworkError] = useState("");
  const [pollPaused, setPollPaused] = useState(false);
  const [pollVersion, setPollVersion] = useState(0);
  const networkBusyRef = useRef(networkBusy);
  networkBusyRef.current = networkBusy;
  const [resultDismissed, setResultDismissed] = useState(false);
  const game = useMemo(
    () => rebuild(active?.moves, active?.startFen),
    [active?.moves, active?.startFen],
  );
  const live = active?.status === "playing";
  const bot =
    BOT_UI.find((b) => b.id === (active?.botId || botId)) || BOT_UI[0];
  const selectedBot = BOT_UI.find((b) => b.id === botId);
  const moves = active?.moves || [];
  const opening = getOpening(moves.map((m) => m.san));
  const activeRef = useRef(active);
  activeRef.current = active;
  const commitRef = useRef();
  const completedRef = useRef(new Set());
  const currentClock = useCallback(
    (state, now = Date.now()) => {
      if (!state) return { w: minutes * 60, b: minutes * 60 };
      const clocks = { w: state.clock.w, b: state.clock.b };
      if (state.status === "playing") {
        const turn = state.moves?.length
          ? state.moves.at(-1).color === "w"
            ? "b"
            : "w"
          : state.startFen?.split(" ")[1] || "w";
        clocks[turn] = Math.max(
          0,
          clocks[turn] - Math.max(0, now - state.clock.at) / 1000,
        );
      }
      return clocks;
    },
    [minutes],
  );
  const endGame = useCallback(
    (reason, result, winner) => {
      setActive((old) => {
        if (!old || old.status !== "playing") return old;
        return {
          ...old,
          status: "finished",
          reason,
          result,
          winner,
          clock: { ...currentClock(old), at: Date.now() },
          endedAt: new Date().toISOString(),
        };
      });
      setResultDismissed(false);
    },
    [setActive, currentClock],
  );
  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => {
      const now = Date.now();
      setTick(now);
      const state = activeRef.current;
      if (!state || state.status !== "playing" || state.serverId) return;
      const clocks = currentClock(state, now);
      const turn = state.moves?.length
        ? state.moves.at(-1).color === "w"
          ? "b"
          : "w"
        : state.startFen?.split(" ")[1] || "w";
      if (clocks[turn] <= 0) {
        const winner = turn === "w" ? "b" : "w";
        const g = rebuild(state.moves, state.startFen);
        const remaining = g
          .board()
          .flat()
          .filter((p) => p && p.color === winner && p.type !== "k");
        const cannotMate =
          remaining.length === 0 ||
          (remaining.length === 1 &&
            ["b", "n"].includes(remaining[0].type) &&
            g.board().flat().filter(Boolean).length === 3);
        endGame(
          cannotMate ? "Timeout · insufficient mating material" : "Timeout",
          cannotMate ? "½–½" : winner === "w" ? "1–0" : "0–1",
          cannotMate ? null : winner,
        );
      }
    }, 200);
    return () => clearInterval(id);
  }, [live, currentClock, endGame]);
  useEffect(() => {
    if (active?.status === "finished" && !completedRef.current.has(active.id)) {
      completedRef.current.add(active.id);
      const chess = rebuild(active.moves, active.startFen);
      onGameComplete({
        ...active,
        pgn: makePgn(active, profile.username),
        opening: getOpening(active.moves.map((m) => m.san)),
        date: active.endedAt || new Date().toISOString(),
      });
    }
  }, [active?.status, active?.id, onGameComplete]);
  const lastServerTime = useRef(new Map());
  const syncRemote = useCallback(
    (data) => {
      const time = Date.parse(data.server_time || "") || Date.now();
      const previous = lastServerTime.current.get(data.id) || 0;
      if (time < previous) return activeRef.current;
      lastServerTime.current.set(data.id, time);
      const state = normalizeServerGame(data, profile.username);
      setRemote(data);
      setActive(state);
      return state;
    },
    [profile.username, setActive],
  );
  useEffect(() => {
    if (!active?.serverId || active.status === "finished") return;
    let cancelled = false;
    setPollPaused(false);
    const stop = startSerialPolling({
      task: async (signal) => {
        if (networkBusyRef.current) return;
        const data = await api(
          active.mode === "online"
            ? "/rooms/" + active.roomCode
            : "/games/" + active.serverId,
          { signal },
        );
        if (!cancelled) {
          syncRemote(data);
          setNetworkError("");
        }
      },
      onError: (error) => {
        if (!cancelled) setNetworkError(error.message);
      },
      onPause: () => {
        if (!cancelled) setPollPaused(true);
      },
      shouldRetry: (error) =>
        error.code !== "UNAVAILABLE" && ![401, 403, 404].includes(error.status),
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [
    active?.serverId,
    active?.mode,
    active?.roomCode,
    active?.status,
    pollVersion,
    syncRemote,
  ]);
  const commitMove = useCallback(
    async (move, byBot = false) => {
      const state = activeRef.current;
      if (!state || state.status !== "playing") return;
      if (state.serverId) {
        if (
          networkBusy ||
          networkError ||
          (state.mode !== "local" && game.turn() !== state.humanColor)
        )
          return;
        setNetworkBusy(true);
        try {
          const data = await api("/games/" + state.serverId + "/move", {
            method: "POST",
            body: JSON.stringify({
              uci:
                move.from +
                move.to +
                (move.promotion &&
                game.get(move.from)?.type === "p" &&
                ["1", "8"].includes(move.to[1])
                  ? move.promotion
                  : ""),
            }),
          });
          syncRemote(data);
          setNetworkError("");
        } catch (e) {
          setNetworkError(e.message);
          toast(e.message);
        } finally {
          setNetworkBusy(false);
        }
        return;
      }
      const chess = rebuild(state.moves, state.startFen);
      if (state.mode === "bot" && (chess.turn() !== state.humanColor) !== byBot)
        return;
      const clocks = currentClock(state);
      if (clocks[chess.turn()] <= 0) return;
      let made;
      try {
        made = chess.move(move);
      } catch {
        return;
      }
      if (!made) return;
      playMoveSound(!!made.captured, settings.sound);
      const record = {
        from: made.from,
        to: made.to,
        san: made.san,
        promotion: made.promotion,
        captured: made.captured,
        color: made.color,
        fen: chess.fen(),
        before: made.before,
      };
      let reason = null,
        result = null,
        winner = null;
      if (chess.isCheckmate()) {
        reason = "Checkmate";
        winner = made.color;
        result = winner === "w" ? "1–0" : "0–1";
      } else if (chess.isDraw()) {
        reason = chess.isStalemate()
          ? "Stalemate"
          : chess.isInsufficientMaterial()
            ? "Insufficient material"
            : chess.isThreefoldRepetition()
              ? "Threefold repetition"
              : "Fifty-move rule";
        result = "½–½";
      }
      setActive({
        ...state,
        moves: [...state.moves, record],
        clock: { ...clocks, at: Date.now() },
        status: reason ? "finished" : "playing",
        reason,
        result,
        winner,
        endedAt: reason ? new Date().toISOString() : null,
      });
      setHistoryIndex(-1);
      setResultDismissed(false);
    },
    [
      game,
      networkBusy,
      networkError,
      syncRemote,
      currentClock,
      settings.sound,
      setActive,
      toast,
    ],
  );
  commitRef.current = commitMove;
  useEffect(() => {
    if (
      !live ||
      active.serverId ||
      active.mode !== "bot" ||
      game.turn() === active.humanColor
    )
      return;
    let cancelled = false;
    const fen = game.fen();
    const id = active.id;
    setThinking(true);
    const timer = setTimeout(
      () =>
        getBotMove(fen, active.level, active.botId)
          .then((move) => {
            if (
              !cancelled &&
              activeRef.current?.id === id &&
              rebuild(
                activeRef.current.moves,
                activeRef.current.startFen,
              ).fen() === fen &&
              move
            )
              commitRef.current(move, true);
          })
          .catch(() => {
            if (!cancelled) {
              const legal = new Chess(fen).moves({ verbose: true });
              if (legal.length) commitRef.current(legal[0], true);
            }
          })
          .finally(() => {
            if (!cancelled) setThinking(false);
          }),
      400,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
      setThinking(false);
    };
  }, [
    live,
    active?.id,
    active?.mode,
    active?.humanColor,
    active?.level,
    active?.botId,
    game.fen(),
  ]);
  const start = async (fen, { offline = false } = {}) => {
    const humanColor =
      side === "random" ? (Math.random() < 0.5 ? "w" : "b") : side;
    const gameMode = fen ? "local" : mode === "bot" ? "bot" : "local";
    setHistoryIndex(-1);
    setResultDismissed(false);
    setNetworkError("");
    setFlipped(humanColor === "b");
    if (readStorage("token", "") && !fen && !offline) {
      setNetworkBusy(true);
      try {
        const data = await api("/games", {
          method: "POST",
          body: JSON.stringify({
            mode: gameMode,
            minutes,
            bot_name: BOT_UI.find((b) => b.id === botId).name,
            bot_level: level,
            user_color: humanColor,
          }),
        });
        syncRemote(data);
        return;
      } catch (e) {
        setNetworkError(e.message);
        toast(e.message);
        return;
      } finally {
        setNetworkBusy(false);
      }
    }
    setActive({
      id: crypto.randomUUID(),
      mode: gameMode,
      botId,
      level,
      minutes,
      humanColor,
      moves: [],
      startFen: fen || undefined,
      status: "playing",
      clock: { w: minutes * 60, b: minutes * 60, at: Date.now() },
      startedAt: new Date().toISOString(),
    });
    setRemote(null);
  };
  const pendingPractice = useRef(null);
  useEffect(() => {
    if (practiceFen) {
      if (live) {
        pendingPractice.current = practiceFen;
        setConfirm("practice");
      } else start(practiceFen);
      clearPractice();
    }
  }, [practiceFen]);
  const requestStart = () => {
    if (live) {
      setConfirm("new");
      return;
    }
    start();
  };
  const undo = () => {
    if (!live || !active || !moves.length || active.serverId) return;
    const count =
      active.mode === "bot" && game.turn() === active.humanColor ? 2 : 1;
    setActive({
      ...active,
      moves: moves.slice(0, Math.max(0, moves.length - count)),
      status: "playing",
      reason: null,
      result: null,
      clock: { ...currentClock(active), at: Date.now() },
    });
    setHistoryIndex(-1);
    setResultDismissed(false);
  };
  const replaceGame = async () => {
    const practice = confirm === "practice" ? pendingPractice.current : null;
    setConfirm(null);
    if (active?.serverId) {
      setNetworkBusy(true);
      try {
        const final = syncRemote(
          await api("/games/" + active.serverId + "/resign", {
            method: "POST",
          }),
        );
        if (final.status === "finished") onGameComplete(final);
        else {
          toast(
            "Leave this waiting room from its original tab before starting another game.",
          );
          return;
        }
      } catch (e) {
        toast(e.message);
        return;
      } finally {
        setNetworkBusy(false);
      }
    } else if (live) {
      const old = activeRef.current;
      const loser = old.mode === "bot" ? old.humanColor : game.turn();
      const winner = loser === "w" ? "b" : "w";
      onGameComplete({
        ...old,
        status: "finished",
        reason: "Resignation",
        winner,
        result: winner === "w" ? "1-0" : "0-1",
        date: new Date().toISOString(),
        pgn: game.pgn(),
        opening,
      });
    }
    pendingPractice.current = null;
    await start(practice);
  };
  const createOrJoin = async (join) => {
    if (!readStorage("token", "")) {
      toast("Create an account or sign in in Settings to play online.");
      onSettings();
      return;
    }
    setNetworkBusy(true);
    setNetworkError("");
    try {
      const data = await api(
        join ? "/rooms/" + roomCode.trim().toUpperCase() + "/join" : "/rooms",
        { method: "POST", body: JSON.stringify({ minutes }) },
      );
      syncRemote(data);
      setFlipped(join);
      setResultDismissed(false);
    } catch (e) {
      setNetworkError(e.message);
    } finally {
      setNetworkBusy(false);
    }
  };
  const refreshOnlineGame = async () => {
    setNetworkBusy(true);
    try {
      await api("/health");
      if (active?.serverId && ["waiting", "playing"].includes(active.status)) {
        const data = await api(
          active.mode === "online"
            ? "/rooms/" + active.roomCode
            : "/games/" + active.serverId,
        );
        syncRemote(data);
      } else {
        const saved = await recoverLatestServerGame(api);
        if (saved) syncRemote(saved);
        else
          toast(
            "No unfinished online game was found. You can start a new game.",
          );
      }
      setNetworkError("");
      setPollPaused(false);
      setPollVersion((version) => version + 1);
    } catch (error) {
      setNetworkError(error.message);
    } finally {
      setNetworkBusy(false);
    }
  };
  const resign = async () => {
    setConfirm(null);
    if (active.serverId) {
      if (networkBusy || networkError) return;
      setNetworkBusy(true);
      try {
        syncRemote(
          await api("/games/" + active.serverId + "/resign", {
            method: "POST",
          }),
        );
        setNetworkError("");
      } catch (e) {
        setNetworkError(e.message);
        toast(e.message);
      } finally {
        setNetworkBusy(false);
      }
      return;
    }
    const loser = active.mode === "bot" ? active.humanColor : game.turn();
    endGame(
      "Resignation",
      loser === "w" ? "0–1" : "1–0",
      loser === "w" ? "b" : "w",
    );
  };
  const draw = async () => {
    setConfirm(null);
    if (active.mode === "bot") {
      toast(
        "The bot declines the draw. A rules-based draw is detected automatically.",
      );
      return;
    }
    if (active.serverId) {
      if (networkBusy || networkError) return;
      setNetworkBusy(true);
      try {
        syncRemote(
          await api(
            "/games/" +
              active.serverId +
              (active.mode === "local" ? "/agree-draw" : "/claim-draw"),
            { method: "POST" },
          ),
        );
        setNetworkError("");
      } catch (e) {
        setNetworkError(e.message);
        toast(e.message);
      } finally {
        setNetworkBusy(false);
      }
      return;
    }
    endGame("Draw by agreement", "½–½", null);
  };
  let orientation = flipped ? "b" : "w";
  if (settings.autoFlip && active?.mode === "local" && live)
    orientation = game.turn();
  const displayGame =
    historyIndex === -2
      ? rebuild([], active?.startFen)
      : historyIndex >= 0
        ? rebuild(moves.slice(0, historyIndex + 1), active?.startFen)
        : game;
  const clocks = currentClock(active, tick);
  const topColor = orientation === "w" ? "b" : "w";
  const bottomColor = orientation;
  const isBotColor = (color) =>
    active?.mode === "bot"
      ? color !== active.humanColor
      : !active && color === "b";
  const playerName = (color) =>
    isBotColor(color)
      ? bot.name
      : active?.mode === "online" && color !== active.humanColor
        ? active.opponent || "Waiting for player…"
        : active?.mode === "local"
          ? color === "w"
            ? profile.username
            : "Player 2"
          : profile.username;
  const playerBar = (color, top) => (
    <div className={"player-bar " + (top ? "top-player" : "bottom-player")}>
      <Avatar
        name={playerName(color)}
        src={
          !isBotColor(color) && color === (active?.humanColor || "w")
            ? profile.avatar
            : undefined
        }
        bot={isBotColor(color) ? bot.id : undefined}
      />
      <div className="player-info">
        <strong>
          {playerName(color)}{" "}
          {isBotColor(color) && <span className="player-flag">{bot.flag}</span>}{" "}
          {isBotColor(color) && <span className="bot-tag">BOT</span>}
        </strong>
        <span>
          {isBotColor(color)
            ? thinking && game.turn() === color
              ? "Thinking…"
              : LEVELS[(active?.level || level) - 1] + " · " + bot.title
            : active?.mode === "local"
              ? "Local player"
              : "Level " +
                (1 + Math.floor((profile.xp || 0) / 250)) +
                " · " +
                (color === "w" ? "White" : "Black")}
          <Captures moves={moves} color={color} settings={settings} />
        </span>
      </div>
      <div
        className={
          "clock " +
          (live && game.turn() === color ? "clock-active " : "") +
          (clocks[color] < 30 && live ? "clock-low" : "")
        }
      >
        <Clock size={19} />
        <span>{formatTime(clocks[color])}</span>
      </div>
    </div>
  );
  return (
    <div className={focus ? "play-view focus-mode" : "play-view"}>
      <div className="play-layout">
        <section className="board-column">
          {playerBar(topColor, true)}
          <div className="board-stage">
            <ChessBoard
              fen={displayGame.fen()}
              orientation={orientation}
              settings={settings}
              lastMove={
                historyIndex === -2
                  ? null
                  : historyIndex >= 0
                    ? moves[historyIndex]
                    : moves.at(-1)
              }
              onMove={(move) => commitMove(move)}
              disabled={
                !live ||
                historyIndex !== -1 ||
                thinking ||
                networkBusy ||
                (active?.serverId && !!networkError) ||
                (active?.mode === "online" && game.turn() !== active.humanColor)
              }
            />
            {active?.status === "finished" && !resultDismissed && (
              <div className="result-overlay">
                <div className="result-card">
                  <button
                    className="close-button"
                    aria-label="Close game result"
                    onClick={() => setResultDismissed(true)}
                  >
                    <X size={19} />
                  </button>
                  <div className="result-trophy">
                    {active.reason?.startsWith("Timeout") ? (
                      <Clock size={36} />
                    ) : (
                      <Trophy size={36} />
                    )}
                  </div>
                  <h2>{active.reason}</h2>
                  <p>
                    {active.reason === "Cancelled"
                      ? "Room closed"
                      : active.winner
                        ? `${active.winner === "w" ? "White" : "Black"} wins`
                        : "Game drawn"}{" "}
                    <span>· {active.result}</span>
                  </p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      onReview({
                        ...active,
                        pgn: makePgn(active, profile.username),
                      })
                    }
                  >
                    <Sparkles size={19} /> Game Review
                  </button>
                  <button className="secondary-button" onClick={() => start()}>
                    Play again
                  </button>
                </div>
              </div>
            )}
          </div>
          {playerBar(bottomColor, false)}
          <div className="board-toolbar">
            <div className="toolbar-group">
              <button
                title="Flip board"
                aria-label="Flip board"
                onClick={() => setFlipped((f) => !f)}
              >
                <RefreshCw size={19} />
              </button>
              <button
                title="Take back move"
                aria-label="Take back move"
                disabled={!live || !moves.length || !!active?.serverId}
                onClick={undo}
              >
                <RotateCcw size={19} />
              </button>
              <button
                title={settings.sound ? "Mute sound" : "Enable sound"}
                aria-label={settings.sound ? "Mute sound" : "Enable sound"}
                onClick={() => onSettings("sound")}
              >
                {settings.sound ? <Volume2 size={19} /> : <VolumeX size={19} />}
              </button>
              <button
                title="Focus mode"
                aria-label="Focus mode"
                onClick={() => setFocus((f) => !f)}
              >
                <Expand size={18} />
              </button>
            </div>
            <span>
              {live
                ? game.isCheck()
                  ? "Check!"
                  : thinking
                    ? "Finding the next move…"
                    : `${game.turn() === "w" ? "White" : "Black"} to move`
                : active?.status === "waiting"
                  ? "Waiting for your opponent"
                  : "Your board. Your next move."}
            </span>
            <button className="small-text-button" onClick={() => onSettings()}>
              Board settings
            </button>
          </div>
          <div className="board-caption">
            <span className="small-green-dot" />{" "}
            {active?.serverId
              ? networkError
                ? "Connection interrupted"
                : active.mode === "online"
                  ? "Online room"
                  : "Connected to Django"
              : "Offline ready"}{" "}
            <span className="caption-divider">·</span>{" "}
            {live ? "Game in progress" : "Play at your own pace"}
          </div>
        </section>
        <aside className="play-side">
          <div className="game-panel">
            <div className="panel-tabs">
              <button
                className={mode === "bot" ? "active" : ""}
                onClick={() => setMode("bot")}
              >
                <Bot size={19} />
                Computer
              </button>
              <button
                className={mode === "multiplayer" ? "active" : ""}
                onClick={() => setMode("multiplayer")}
              >
                <Users size={18} />
                Multiplayer
              </button>
            </div>
            <div className="game-panel-content">
              {!live && active?.status !== "waiting" ? (
                <>
                  {mode === "bot" ? (
                    <>
                      <div className="panel-section-title">
                        <h2>Choose your opponent</h2>
                        <span>5 bots</span>
                      </div>
                      <div className="bot-selector">
                        {BOT_UI.map((b) => (
                          <button
                            key={b.id}
                            className={botId === b.id ? "selected-bot" : ""}
                            onClick={() => setBotId(b.id)}
                            title={b.name}
                          >
                            <div className="bot-portrait">
                              <Avatar name={b.name} bot={b.id} size={50} />
                              {botId === b.id && (
                                <span className="selected-check">
                                  <Check size={10} strokeWidth={4} />
                                </span>
                              )}
                            </div>
                            <span>{b.short}</span>
                          </button>
                        ))}
                      </div>
                      <div className="selected-bot-info">
                        <h3>
                          {selectedBot.name} <span>{selectedBot.flag}</span>
                        </h3>
                        <span className="bot-subtitle">
                          {selectedBot.title}
                        </span>
                        <p>{selectedBot.description}</p>
                        <span className="style-pill">
                          <Sparkles size={12} />
                          {selectedBot.style}
                        </span>
                      </div>
                      <label className="form-label">
                        Difficulty <span>Level {level} of 4</span>
                      </label>
                      <div className="difficulty-options">
                        {LEVELS.map((name, i) => (
                          <button
                            key={name}
                            className={level === i + 1 ? "chosen" : ""}
                            onClick={() => setLevel(i + 1)}
                          >
                            <span className="difficulty-bars">
                              {[1, 2, 3, 4].map((n) => (
                                <i
                                  key={n}
                                  className={n <= i + 1 ? "filled" : ""}
                                  style={{ height: 6 + n * 3 }}
                                />
                              ))}
                            </span>
                            <span>{name}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="panel-section-title">
                        <h2>Play together</h2>
                        <Users size={20} />
                      </div>
                      <p className="setup-description">
                        A friendly match is always a good idea.
                      </p>
                      <div className="segmented-control">
                        <button
                          className={multiplayer === "local" ? "selected" : ""}
                          onClick={() => setMultiplayer("local")}
                        >
                          <Users size={16} />
                          Same device
                        </button>
                        <button
                          className={multiplayer === "online" ? "selected" : ""}
                          onClick={() => setMultiplayer("online")}
                        >
                          <Globe size={16} />
                          Online room
                        </button>
                      </div>
                      <div className="local-play-art">
                        <KnightLogo size={62} />
                        <span>VS</span>
                        <KnightLogo size={62} />
                      </div>
                      <h3 className="centered">
                        {multiplayer === "local"
                          ? "Make time for a game"
                          : "Your table is ready"}
                      </h3>
                      <p className="setup-description centered">
                        {multiplayer === "local"
                          ? "Two players. One board. No connection needed."
                          : "Create a private room and invite a friend using its room code."}
                      </p>
                    </>
                  )}
                  <div className="time-section">
                    <label className="form-label">
                      Time control <Clock size={15} />
                    </label>
                    <div className="time-options">
                      {[10, 15, 20].map((n) => (
                        <button
                          className={minutes === n ? "chosen" : ""}
                          key={n}
                          onClick={() => setMinutes(n)}
                        >
                          {n}
                          <span> min</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  {mode === "bot" && (
                    <div className="side-choice">
                      <span>Play as</span>
                      <div>
                        {[
                          ["w", "White"],
                          ["random", "Random"],
                          ["b", "Black"],
                        ].map(([s, label]) => (
                          <button
                            title={label}
                            aria-label={`Play as ${label}`}
                            key={s}
                            className={side === s ? "chosen" : ""}
                            onClick={() => setSide(s)}
                          >
                            {s === "random" ? (
                              <span className="random-side">◐</span>
                            ) : (
                              <Piece type="k" color={s} settings={settings} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {mode === "multiplayer" && multiplayer === "online" ? (
                    <>
                      <button
                        className="primary-button large-button"
                        onClick={() => createOrJoin(false)}
                        disabled={networkBusy}
                      >
                        {networkBusy ? (
                          <LoaderCircle className="spin" size={21} />
                        ) : (
                          <Globe size={20} />
                        )}
                        Create room
                      </button>
                      <div className="join-room">
                        <input
                          aria-label="Room code"
                          placeholder="Enter room code"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                          maxLength={8}
                        />
                        <button
                          className="secondary-button"
                          disabled={networkBusy || roomCode.trim().length < 4}
                          onClick={() => createOrJoin(true)}
                        >
                          Join
                        </button>
                      </div>
                      <p className="tiny-note">
                        Sign in in Settings to create a room or join a friend.
                      </p>
                    </>
                  ) : (
                    <button
                      className="primary-button large-button"
                      onClick={requestStart}
                      disabled={networkBusy}
                    >
                      {networkBusy ? (
                        <LoaderCircle className="spin" size={21} />
                      ) : (
                        <Swords size={22} />
                      )}{" "}
                      {mode === "bot"
                        ? `Play with ${selectedBot.short}`
                        : "Start local game"}
                    </button>
                  )}
                  {readStorage("token", "") &&
                    !(mode === "multiplayer" && multiplayer === "online") && (
                      <button
                        className="text-button offline-game-button"
                        disabled={networkBusy}
                        onClick={() => start(undefined, { offline: true })}
                      >
                        Play offline on this device
                      </button>
                    )}
                  <p className="setup-footnote">
                    {mode === "bot"
                      ? "No pressure. Just you and the board."
                      : "Good games start with good company."}
                  </p>
                  {mode === "bot" && (
                    <p className="independent-note">
                      Independent bots inspired by playing styles.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="live-game-heading">
                    <h2>
                      {active?.status === "waiting"
                        ? "Waiting for a friend"
                        : active.mode === "bot"
                          ? "Let’s play chess"
                          : "Your game"}
                    </h2>
                    <span className="live-pill">
                      {active.mode === "online" ? "ONLINE" : "LIVE"}
                    </span>
                  </div>
                  {active.mode === "online" && (
                    <div className="room-code">
                      <span>Room code</span>
                      <strong>{active.roomCode}</strong>
                      <button
                        aria-label="Copy room code"
                        onClick={() =>
                          navigator.clipboard
                            .writeText(active.roomCode)
                            .then(() => toast("Room code copied."))
                            .catch(() => toast(active.roomCode))
                        }
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  )}
                  <div className="opening-summary">
                    <BookOpen size={20} />
                    <div>
                      <span>
                        {opening.eco
                          ? "Opening · " + opening.eco
                          : "Opening explorer"}
                      </span>
                      <strong>{opening.name || "Starting position"}</strong>
                    </div>
                  </div>
                  <MoveList
                    moves={moves}
                    selected={
                      historyIndex === -1 ? moves.length - 1 : historyIndex
                    }
                    onSelect={setHistoryIndex}
                  />
                  <div className="move-navigation">
                    <button
                      aria-label="Starting position"
                      onClick={() => moves.length && setHistoryIndex(-2)}
                      disabled={!moves.length}
                    >
                      <ChevronsLeft size={21} />
                    </button>
                    <button
                      aria-label="Previous move"
                      onClick={() =>
                        setHistoryIndex((i) =>
                          i === -2 || i === 0
                            ? -2
                            : (i === -1 ? moves.length - 1 : i) - 1,
                        )
                      }
                      disabled={!moves.length}
                    >
                      <ChevronLeft size={22} />
                    </button>
                    <button
                      aria-label="Next move"
                      onClick={() =>
                        setHistoryIndex((i) =>
                          i === -2
                            ? 0
                            : i === -1 || i + 1 >= moves.length - 1
                              ? -1
                              : i + 1,
                        )
                      }
                      disabled={!moves.length}
                    >
                      <ChevronRight size={22} />
                    </button>
                    <button
                      aria-label="Latest position"
                      onClick={() => setHistoryIndex(-1)}
                      disabled={!moves.length}
                    >
                      <ChevronsRight size={21} />
                    </button>
                  </div>
                  {historyIndex !== -1 && (
                    <button
                      className="back-to-game"
                      onClick={() => setHistoryIndex(-1)}
                    >
                      Return to live board
                    </button>
                  )}
                  <div className="game-actions">
                    <button
                      className="secondary-button"
                      onClick={() => setConfirm("draw")}
                      disabled={
                        active.status === "waiting" ||
                        networkBusy ||
                        (active.serverId && !!networkError)
                      }
                    >
                      <Handshake size={16} />
                      Draw
                    </button>
                    <button
                      className="secondary-button"
                      onClick={() => setConfirm("resign")}
                      disabled={
                        active.status === "waiting" ||
                        networkBusy ||
                        (active.serverId && !!networkError)
                      }
                    >
                      <Flag size={15} />
                      Resign
                    </button>
                  </div>
                  <button
                    className="text-button new-game-button"
                    disabled={
                      networkBusy || (active?.serverId && !!networkError)
                    }
                    onClick={() => setConfirm("new")}
                  >
                    <Swords size={16} />
                    New game
                  </button>
                </>
              )}
              {networkError && (
                <div className="inline-error" role="alert">
                  <p>{networkError}</p>
                  {active?.serverId && (
                    <p>Your game clock continues while disconnected.</p>
                  )}
                  {pollPaused && <p>Automatic reconnection is paused.</p>}
                  {readStorage("token", "") && (
                    <button
                      className="secondary-button"
                      disabled={networkBusy}
                      onClick={refreshOnlineGame}
                    >
                      Refresh online game
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <button
            className="discovery-card puzzle-discovery"
            onClick={() => onNavigate("puzzles")}
          >
            <span className="discovery-icon">
              <Lightbulb size={29} />
            </span>
            <span>
              <strong>A little challenge. A sharper mind.</strong>
              <small>
                Find your next puzzle <span className="new-tag">UNLIMITED</span>
              </small>
            </span>
            <ChevronRight size={19} />
          </button>
          <button
            className="discovery-card coach-discovery"
            onClick={() => onNavigate("coach")}
          >
            <Avatar name="Magnus" bot="magnus" size={42} />
            <span>
              <strong>Great players start with curiosity.</strong>
              <small>Meet your chess coach</small>
            </span>
            <ChevronRight size={19} />
          </button>
        </aside>
      </div>
      {confirm && (
        <div className="modal-backdrop" onClick={() => setConfirm(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>
              {confirm === "resign"
                ? "Resign this game?"
                : confirm === "draw"
                  ? "Agree to a draw?"
                  : confirm === "practice"
                    ? "Start lesson practice?"
                    : "Start a new game?"}
            </h2>
            <p>
              {confirm === "resign"
                ? "Your opponent will win this game by resignation."
                : confirm === "draw"
                  ? active?.mode === "local"
                    ? "Only accept if both players agree to end the game as a draw."
                    : "Offer or claim a draw in this position."
                  : "Your current game will end by resignation before the new game begins."}
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setConfirm(null)}
              >
                Keep playing
              </button>
              <button
                className="primary-button"
                onClick={() => {
                  if (confirm === "resign") resign();
                  else if (confirm === "draw") draw();
                  else replaceGame();
                }}
              >
                {confirm === "resign"
                  ? "Resign"
                  : confirm === "draw"
                    ? "Accept draw"
                    : "New game"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
