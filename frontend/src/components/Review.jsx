import React, { useState, useEffect, useMemo } from "react";
import { Chess } from "chess.js";
import {
  Sparkles,
  Upload,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  LoaderCircle,
  History,
  Target,
  X,
} from "lucide-react";
import ChessBoard from "./ChessBoard";
import { MoveList, rebuild } from "./Play";
import { analyzeGame } from "../chess/client";
import { getOpening } from "../data/openings";
import { downloadText } from "../lib/storage";
import { api } from "../lib/api";
export default function Review({
  game: provided,
  games,
  settings,
  onNavigate,
  toast,
}) {
  const [game, setGame] = useState(provided || games[0] || null);
  const [analysis, setAnalysis] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ply, setPly] = useState(-1);
  const [pgn, setPgn] = useState("");
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState("overview");
  useEffect(() => {
    if (provided) {
      setGame(provided);
      setPly(-1);
    }
  }, [provided]);
  useEffect(() => {
    if (!game?.moves?.length) {
      setAnalysis(null);
      return;
    }
    let alive = true;
    setBusy(true);
    setError("");
    (game.serverId
      ? api("/games/" + game.serverId + "/review", {
          method: "POST",
          timeoutMs: 120000,
        }).catch(() => analyzeGame(game.moves, { startFen: game.startFen }))
      : analyzeGame(game.moves, { startFen: game.startFen })
    )
      .then((result) => {
        if (alive) setAnalysis(result);
      })
      .catch((e) => {
        if (alive) setError(e.message);
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [game]);
  const moves = game?.moves || [];
  const chess = useMemo(
    () => rebuild(ply < 0 ? [] : moves.slice(0, ply + 1), game?.startFen),
    [moves, ply, game?.startFen],
  );
  const opening = getOpening(
    moves.map((m) => (typeof m === "string" ? m : m.san)),
  );
  const current = analysis?.moves?.[ply];
  const counts = {};
  analysis?.moves?.forEach((m) => {
    counts[m.classification] = (counts[m.classification] || 0) + 1;
  });
  const importPGN = () => {
    try {
      if (pgn.length > 200000)
        throw new Error("Please import one game smaller than 200 KB.");
      const g = new Chess();
      g.loadPgn(pgn.trim());
      const history = g.history({ verbose: true });
      if (!history.length)
        throw new Error("This PGN does not contain any moves.");
      setGame({
        id: "import-" + Date.now(),
        moves: history.map((m) => ({
          san: m.san,
          from: m.from,
          to: m.to,
          color: m.color,
          fen: m.after,
        })),
        pgn: g.pgn(),
        startFen: g.getHeaders().FEN,
        mode: "import",
        result: g.getHeaders().Result,
      });
      setPly(-1);
      setImporting(false);
      setPgn("");
    } catch (e) {
      toast("Could not read PGN: " + e.message);
    }
  };
  if (!game)
    return (
      <div className="review-empty">
        <div className="review-empty-icon">
          <Sparkles size={52} />
        </div>
        <h2>Every game has something to teach you.</h2>
        <p>
          Finish a game to explore your moves, discover the opening, and find
          the moments that made a difference. Or bring a game of your own.
        </p>
        <div>
          <button className="primary-button" onClick={() => onNavigate("play")}>
            Play a game
          </button>
          <button
            className="secondary-button"
            onClick={() => setImporting(true)}
          >
            <Upload size={18} />
            Import PGN
          </button>
        </div>
        {importing && (
          <ImportModal
            pgn={pgn}
            setPgn={setPgn}
            onClose={() => setImporting(false)}
            onImport={importPGN}
          />
        )}
      </div>
    );
  return (
    <div className="review-view">
      <div className="review-top-bar">
        <div>
          <span className="badge">
            {game.mode === "bot"
              ? "Computer game"
              : game.mode === "import"
                ? "Imported game"
                : "Local game"}
          </span>
          <span className="muted">
            {moves.length} moves played {game.result ? "· " + game.result : ""}
          </span>
        </div>
        <div>
          <button
            className="secondary-button"
            onClick={() => setImporting(true)}
          >
            <Upload size={15} />
            Import PGN
          </button>
          <button
            className="secondary-button"
            onClick={() =>
              downloadText(
                "knight-game.pgn",
                game.pgn || rebuild(moves, game.startFen).pgn(),
                "application/x-chess-pgn",
              )
            }
          >
            <Download size={15} />
            Export
          </button>
        </div>
      </div>
      <div className="play-layout">
        <section className="board-column">
          <div className="review-board-row">
            <div
              className="evaluation-bar"
              title="Estimated position evaluation"
            >
              <span
                className="eval-white"
                style={{
                  height: `${Math.max(3, Math.min(97, 50 + (current?.evaluation || 0) * 5))}%`,
                }}
              />
              <strong>
                {current?.san?.includes("#")
                  ? "#"
                  : Math.abs(current?.evaluation || 0) > 90
                    ? current.evaluation > 0
                      ? "M"
                      : "−M"
                    : current?.evaluation !== undefined
                      ? (Number(current.evaluation) > 0 ? "+" : "") +
                        Number(current.evaluation).toFixed(1)
                      : "0.0"}
              </strong>
            </div>
            <ChessBoard
              fen={chess.fen()}
              settings={settings}
              lastMove={ply >= 0 ? moves[ply] : null}
              disabled
            />
          </div>
          <div className="review-navigation">
            <button aria-label="Starting position" onClick={() => setPly(-1)}>
              <ChevronsLeft size={22} />
            </button>
            <button
              aria-label="Previous move"
              onClick={() => setPly((p) => Math.max(-1, p - 1))}
            >
              <ChevronLeft size={24} />
            </button>
            <span>
              {ply < 0
                ? "Starting position"
                : `Move ${Math.ceil((ply + 1) / 2)} · ${moves[ply]?.san || moves[ply]}`}
            </span>
            <button
              aria-label="Next move"
              onClick={() => setPly((p) => Math.min(moves.length - 1, p + 1))}
            >
              <ChevronRight size={24} />
            </button>
            <button
              aria-label="Final position"
              onClick={() => setPly(moves.length - 1)}
            >
              <ChevronsRight size={22} />
            </button>
          </div>
          {analysis && (
            <div className="eval-chart">
              <div>
                <span>Game momentum</span>
                <span>White advantage</span>
              </div>
              <svg
                viewBox="0 0 600 100"
                role="img"
                aria-label="Position evaluation across the game"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="50"
                  x2="600"
                  y2="50"
                  stroke="#57544d"
                  strokeDasharray="4 4"
                />
                <polyline
                  fill="none"
                  stroke="#9fce6c"
                  strokeWidth="2.5"
                  points={analysis.moves
                    .map(
                      (m, i) =>
                        `${(i / Math.max(1, moves.length - 1)) * 600},${50 - Math.max(-8, Math.min(8, m.evaluation)) * 5}`,
                    )
                    .join(" ")}
                />
                {ply >= 0 && (
                  <line
                    x1={(ply / Math.max(1, moves.length - 1)) * 600}
                    x2={(ply / Math.max(1, moves.length - 1)) * 600}
                    y1="0"
                    y2="100"
                    stroke="#eeeed2"
                    opacity=".5"
                  />
                )}
              </svg>
            </div>
          )}
        </section>
        <aside className="play-side">
          <div className="game-panel review-panel">
            <div className="review-panel-heading">
              <Sparkles size={23} />
              <h2>Game Review</h2>
            </div>
            {busy ? (
              <div className="review-loading">
                <LoaderCircle className="spin" size={36} />
                <h3>Finding the turning points</h3>
                <p>
                  Your local engine is looking at each move. This can take a few
                  seconds.
                </p>
              </div>
            ) : error ? (
              <div className="inline-error">
                {error}
                <button
                  className="text-button"
                  onClick={() => setGame({ ...game })}
                >
                  Try again
                </button>
              </div>
            ) : analysis ? (
              <>
                <div className="accuracy-grid">
                  <div>
                    <span>White accuracy</span>
                    <strong>
                      {analysis.accuracy?.white == null
                        ? "—"
                        : Number(analysis.accuracy.white).toFixed(1)}
                      <small>%</small>
                    </strong>
                  </div>
                  <div>
                    <span>Black accuracy</span>
                    <strong>
                      {analysis.accuracy?.black == null
                        ? "—"
                        : Number(analysis.accuracy.black).toFixed(1)}
                      <small>%</small>
                    </strong>
                  </div>
                </div>
                <div className="review-tabs">
                  <button
                    className={tab === "overview" ? "active" : ""}
                    onClick={() => setTab("overview")}
                  >
                    Overview
                  </button>
                  <button
                    className={tab === "moves" ? "active" : ""}
                    onClick={() => setTab("moves")}
                  >
                    Moves
                  </button>
                </div>
                {tab === "overview" ? (
                  <div className="review-overview">
                    <div className="opening-summary">
                      <BookOpen size={21} />
                      <div>
                        <span>{opening.eco || "Opening"}</span>
                        <strong>{opening.name}</strong>
                      </div>
                    </div>
                    <div className="review-quality-counts">
                      {Object.entries(counts).map(([name, n]) => (
                        <div key={name}>
                          <span
                            className={
                              "quality-dot quality-" +
                              name.toLowerCase().replaceAll(" ", "-")
                            }
                          />
                          <span>{name}</span>
                          <strong>{n}</strong>
                        </div>
                      ))}
                    </div>
                    <div className="current-move-insight">
                      <span className="eyebrow">
                        {current
                          ? `MOVE ${Math.ceil((ply + 1) / 2)}`
                          : "YOUR NEXT STEP"}
                      </span>
                      <h3>
                        {current
                          ? `${current.san} · ${current.classification}`
                          : "Replay your game"}
                      </h3>
                      <p>
                        {current?.explanation ||
                          "Use the controls below the board to step through the game and explore each decision."}
                      </p>
                      {current?.bestMove && (
                        <span className="best-move">
                          Engine suggestion:{" "}
                          <strong>
                            {typeof current.bestMove === "string"
                              ? current.bestMove
                              : current.bestMove.san}
                          </strong>
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <MoveList
                    moves={analysis.moves}
                    selected={ply}
                    onSelect={setPly}
                  />
                )}
                <p className="review-method">
                  {analysis?.engine || "Local engine"} ·{" "}
                  {analysis?.disclaimer ||
                    "Estimated accuracy and move labels are training guidance, not tournament ratings."}
                </p>
              </>
            ) : (
              <p className="padded muted">
                Play some moves to begin your review.
              </p>
            )}
          </div>
          {games.length > 0 && (
            <div className="recent-review-games">
              <h3>
                <History size={18} />
                Your recent games
              </h3>
              {games.slice(0, 4).map((g) => (
                <button
                  key={g.id}
                  className={game.id === g.id ? "selected" : ""}
                  onClick={() => {
                    setGame(g);
                    setPly(-1);
                  }}
                >
                  <span>
                    {g.mode === "bot"
                      ? `vs ${g.botId === "vishy" ? "Vishy" : g.botId?.charAt(0).toUpperCase() + g.botId?.slice(1)}`
                      : "Local match"}
                    <small>{g.reason || "Game completed"}</small>
                  </span>
                  <strong>{g.result}</strong>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>
      {importing && (
        <ImportModal
          pgn={pgn}
          setPgn={setPgn}
          onClose={() => setImporting(false)}
          onImport={importPGN}
        />
      )}
    </div>
  );
}
function ImportModal({ pgn, setPgn, onClose, onImport }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card pgn-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="close-button"
          aria-label="Close import"
          onClick={onClose}
        >
          <X size={20} />
        </button>
        <h2>Bring your game</h2>
        <p>Paste a game in PGN format to review it on your board.</p>
        <textarea
          autoFocus
          aria-label="PGN game"
          rows={9}
          value={pgn}
          onChange={(e) => setPgn(e.target.value)}
          placeholder={'[Event "My game"]\n\n1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5'}
        />
        <div className="modal-actions">
          <button className="secondary-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary-button"
            disabled={!pgn.trim()}
            onClick={onImport}
          >
            Review game
          </button>
        </div>
      </div>
    </div>
  );
}
