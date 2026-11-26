import React, { useState, useMemo, useEffect } from "react";
import {
  Check,
  Lightbulb,
  RefreshCw,
  Flame,
  Target,
  Trophy,
  ChevronRight,
  Infinity,
  Eye,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Chess } from "chess.js";
import { api } from "../lib/api";
import ChessBoard from "./ChessBoard";
import Piece from "./Piece";
import { generatePuzzle, checkPuzzleMove } from "../data/puzzles";
import { useStorage, playMoveSound, readStorage } from "../lib/storage";
export default function Puzzles({ settings, stats, onSolved, toast }) {
  const [index, setIndex] = useStorage("puzzleIndex", 0);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(index));
  const [fen, setFen] = useState(puzzle.fen);
  const [status, setStatus] = useState("ready");
  const [hint, setHint] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [lastMove, setLastMove] = useState(null);
  const [streak, setStreak] = useStorage("puzzleStreak", 0);
  const [message, setMessage] = useState(
    "Take your time. Look for checks, then find the finish.",
  );
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [earned, setEarned] = useState(0);
  const installPuzzle = (p) => {
    setPuzzle(p);
    setFen(p.fen);
    setStatus("ready");
    setHint(false);
    setRevealed(false);
    setMistakes(0);
    setLastMove(null);
    setEarned(0);
    setMessage("Take your time. Look for checks, then find the finish.");
  };
  const remotePuzzle = async () => {
    const p = await api("/puzzles/next");
    const g = new Chess(p.fen);
    const answers = [];
    for (const m of g.moves({ verbose: true })) {
      g.move(m);
      if (g.isCheckmate()) answers.push(m);
      g.undo();
    }
    return {
      ...p,
      server: true,
      side: p.turn,
      solution: [
        answers[0].from + answers[0].to + (answers[0].promotion || ""),
      ],
      solutionSAN: [answers[0].san],
      explanation:
        "Coordinate your king and queen. Give check while covering every escape square and protecting the checking piece.",
    };
  };
  useEffect(() => {
    if (!readStorage("token", "")) return;
    let alive = true;
    setLoading(true);
    remotePuzzle()
      .then((p) => {
        if (alive) installPuzzle(p);
      })
      .catch(() => {
        if (alive)
          toast("Server unavailable. This puzzle runs offline on your device.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  const next = async () => {
    const n = index + 1;
    setIndex(n);
    if (readStorage("token", "")) {
      setLoading(true);
      try {
        installPuzzle(await remotePuzzle());
        return;
      } catch {
        toast("Server unavailable. Continuing with offline practice.");
      } finally {
        setLoading(false);
      }
    }
    installPuzzle(generatePuzzle(n));
  };
  const move = async (m) => {
    if (status === "solved" || loading) return;
    const result = checkPuzzleMove(puzzle, m);
    if (result.illegal) return;
    if (result.correct) {
      let awarded = mistakes === 0 && !hint ? 30 : 15;
      if (puzzle.server && !revealed) {
        setLoading(true);
        try {
          const response = await api("/puzzles/check", {
            method: "POST",
            body: JSON.stringify({ puzzle_id: puzzle.id, uci: result.move }),
          });
          if (!response.correct) return;
          awarded = response.xp_awarded;
        } catch (e) {
          toast(e.message);
          return;
        } finally {
          setLoading(false);
        }
      }
      setFen(result.fen);
      setLastMove(m);
      setStatus("solved");
      setMessage(puzzle.explanation);
      setEarned(revealed ? 0 : awarded);
      playMoveSound(true, settings.sound);
      if (!revealed) {
        const clean = mistakes === 0 && !hint;
        setStreak(clean ? streak + 1 : 0);
        onSolved(puzzle.id, puzzle.server ? 0 : awarded, !!puzzle.server);
      }
    } else {
      setMistakes((n) => n + 1);
      setStreak(0);
      setStatus("retry");
      setMessage("Not quite. The king still has a way out. Try another move.");
      playMoveSound(false, settings.sound);
    }
  };
  const show = () => {
    setRevealed(true);
    setHint(true);
    setMessage(
      `Look at ${puzzle.solutionSAN?.[0] || puzzle.solution[0]}. ` +
        puzzle.explanation,
    );
    setStreak(0);
  };
  return (
    <div className="puzzle-view">
      <div className="play-layout">
        <section className="board-column">
          <div className="puzzle-board-heading">
            <div className="section-icon">
              <Lightbulb size={25} />
            </div>
            <div>
              <h2>One move. All the difference.</h2>
              <span>Checkmate practice · Puzzle #{index + 1}</span>
            </div>
            <span className="badge">{puzzle.theme}</span>
          </div>
          <ChessBoard
            fen={fen}
            orientation={puzzle.side}
            settings={settings}
            onMove={move}
            lastMove={lastMove}
            disabled={status === "solved" || loading}
            hint={hint ? puzzle.solution[0].slice(0, 2) : undefined}
          />
          <div className="puzzle-board-footer">
            <span>
              <Infinity size={18} />
              {loading
                ? "Preparing your puzzle…"
                : puzzle.server
                  ? "Account-connected puzzle practice"
                  : "Endless, locally generated practice"}
            </span>
            <button
              className="text-button"
              onClick={() => {
                setFen(puzzle.fen);
                setStatus("ready");
                setLastMove(null);
                setMessage("Position reset. Try finding the mate again.");
                setRevealed(true);
              }}
            >
              <RefreshCw size={16} />
              Reset board
            </button>
          </div>
        </section>
        <aside className="play-side">
          <div className="puzzle-status-card">
            <div
              className={
                "puzzle-state-icon " +
                (status === "solved"
                  ? "success"
                  : status === "retry"
                    ? "error"
                    : "")
              }
            >
              {status === "solved" ? (
                <CheckCircle2 size={34} />
              ) : status === "retry" ? (
                <XCircle size={34} />
              ) : (
                <Piece type="k" color={puzzle.side} settings={settings} />
              )}
            </div>
            <h2>
              {status === "solved"
                ? "Beautifully played!"
                : status === "retry"
                  ? "There’s a better move"
                  : `${puzzle.side === "w" ? "White" : "Black"} to move`}
            </h2>
            <p className="puzzle-goal">
              {status === "solved"
                ? revealed
                  ? "Pattern learned. Keep going!"
                  : `+${earned} XP · Keep the momentum`
                : "Find checkmate in one"}
            </p>
            <div className="puzzle-message">{message}</div>
            {status === "solved" ? (
              <button
                className="primary-button large-button"
                onClick={next}
                disabled={loading}
              >
                Next puzzle <ChevronRight size={20} />
              </button>
            ) : (
              <>
                <button
                  className="secondary-button wide"
                  onClick={() => {
                    setHint(true);
                    setMessage(puzzle.explanation);
                  }}
                >
                  <Lightbulb size={18} />I need a hint
                </button>
                <button
                  className="text-button wide reveal-button"
                  onClick={show}
                >
                  <Eye size={16} />
                  Show the idea
                </button>
              </>
            )}
            <button
              className="text-button wide"
              onClick={next}
              disabled={loading}
            >
              Skip this puzzle
            </button>
          </div>
          <div className="puzzle-stat-grid">
            <div>
              <Flame size={24} className="orange" />
              <strong>{streak}</strong>
              <span>Current streak</span>
            </div>
            <div>
              <Target size={24} className="green" />
              <strong>{stats.puzzlesSolved || 0}</strong>
              <span>Puzzles solved</span>
            </div>
          </div>
          <div className="tip-card">
            <div>
              <Lightbulb size={18} />
              <h3>A good thinking habit</h3>
            </div>
            <p>
              Before you move, ask: “What checks do I have? What can the king
              capture? Where can it escape?”
            </p>
          </div>
          <p className="tiny-note">
            Generated mate-in-one positions are checked for legal moves and a
            mating solution. Puzzle difficulty is a practice estimate.
          </p>
        </aside>
      </div>
    </div>
  );
}
