import { Chess } from "chess.js";
import { BOTS, normalizeLevel } from "./bots.js";

const VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
const MATE = 30000;
const TIMEOUT = Symbol("search-timeout");
const now = () => globalThis.performance?.now?.() ?? Date.now();
const toMove = (m) => ({
  from: m.from,
  to: m.to,
  ...(m.promotion ? { promotion: m.promotion } : {}),
});
const moveKey = (m) => `${m.from}${m.to}${m.promotion || ""}`;

function boardScore(game, personality = {}) {
  const weights = { positional: 1, aggression: 1, pawn: 1, ...personality };
  const board = game.board();
  let score = 0;
  let nonPawnMaterial = 0;
  const bishops = { w: 0, b: 0 };
  const pawns = { w: Array(8).fill(0), b: Array(8).fill(0) };
  for (const row of board)
    for (const p of row) {
      if (p && p.type !== "p" && p.type !== "k")
        nonPawnMaterial += VALUES[p.type];
    }
  const endgame = nonPawnMaterial < 2400;
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[rank][file];
      if (!piece) continue;
      const side = piece.color === "w" ? 1 : -1;
      const advance = piece.color === "w" ? 6 - rank : rank - 1;
      const center = 7 - (Math.abs(file - 3.5) + Math.abs(rank - 3.5));
      let positional = 0;
      switch (piece.type) {
        case "p":
          positional = advance * (endgame ? 12 : 6) + center * 3;
          if ((file === 3 || file === 4) && advance > 0) positional += 16;
          pawns[piece.color][file]++;
          positional *= weights.pawn;
          break;
        case "n":
          positional =
            center * 13 -
            (file === 0 || file === 7 || rank === 0 || rank === 7 ? 22 : 0);
          break;
        case "b":
          positional = center * 7 + Math.max(0, advance) * 3;
          bishops[piece.color]++;
          break;
        case "r":
          positional = center * 2 + (advance === 5 ? 25 : 0);
          break;
        case "q":
          positional = center * 3 + Math.max(0, advance) * weights.aggression;
          break;
        case "k":
          positional = endgame ? center * 12 : -center * 10;
          if (!endgame && advance === -1 && (file === 6 || file === 2))
            positional += 35;
          break;
      }
      score += side * (VALUES[piece.type] + positional * weights.positional);
    }
  }
  for (const color of ["w", "b"]) {
    const side = color === "w" ? 1 : -1;
    if (bishops[color] >= 2) score += side * 35;
    for (let file = 0; file < 8; file++) {
      const count = pawns[color][file];
      if (count > 1) score -= side * (count - 1) * 18;
      if (count && !(pawns[color][file - 1] || pawns[color][file + 1]))
        score -= side * count * 12;
    }
  }
  return Math.round(score);
}

/** Static evaluation in centipawns, positive for White. */
export function evaluatePosition(fen) {
  const game = typeof fen === "string" ? new Chess(fen) : fen;
  if (game.isCheckmate()) return game.turn() === "w" ? -MATE : MATE;
  if (game.isDraw()) return 0;
  return boardScore(game);
}

function orderedMoves(game, preferred) {
  return game
    .moves({ verbose: true })
    .map((move) => ({
      move,
      priority:
        (moveKey(move) === preferred ? 100000 : 0) +
        (move.san.includes("#") ? 50000 : 0) +
        (move.captured ? 10 * VALUES[move.captured] - VALUES[move.piece] : 0) +
        (move.promotion ? VALUES[move.promotion] + 800 : 0) +
        (move.san.includes("+") ? 70 : 0) +
        (move.flags.includes("k") || move.flags.includes("q") ? 45 : 0),
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((item) => item.move);
}

function search(game, depth, alpha, beta, ply, ctx) {
  ctx.nodes++;
  if ((ctx.nodes & 7) === 0 && now() >= ctx.deadline) throw TIMEOUT;
  // Draw claims are respected. Repetition tracks the current search branch.
  if (
    game.isInsufficientMaterial() ||
    game.isDrawByFiftyMoves() ||
    game.isThreefoldRepetition()
  )
    return 0;
  const moves = orderedMoves(game);
  if (!moves.length) return game.isCheck() ? -MATE + ply : 0;
  if (depth <= 0)
    return boardScore(game, ctx.personality) * (game.turn() === "w" ? 1 : -1);
  let best = -Infinity;
  for (const move of moves) {
    game.move(toMove(move));
    let score;
    try {
      score = -search(game, depth - 1, -beta, -alpha, ply + 1, ctx);
    } finally {
      game.undo();
    }
    best = Math.max(best, score);
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return best;
}

function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++)
    hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return hash >>> 0;
}

/** Bounded iterative-deepening alpha-beta search. Run this inside the worker. */
export function findBestMove(fen, level = 2, botId = "magnus", options = {}) {
  const game = new Chess(fen);
  if (game.isGameOver()) return null;
  const config = normalizeLevel(level);
  if (botId === "garry") botId = "kasparov";
  const personality =
    BOTS.find((bot) => bot.id === botId)?.personality || BOTS[0].personality;
  const maxDepth = options.depth ?? config.depth;
  const budget = options.timeMs ?? config.timeMs;
  const ctx = { nodes: 0, deadline: now() + budget, personality };
  const color = game.turn() === "w" ? 1 : -1;
  const legal = orderedMoves(game);
  let bestMove = legal[0];
  let bestScore = boardScore(game, personality) * color;
  let completedDepth = 0;
  let completedCandidates = [];
  for (let depth = 1; depth <= maxDepth; depth++) {
    let iterationBest = null;
    let iterationScore = -Infinity;
    let alpha = -Infinity;
    const candidates = [];
    try {
      for (const move of orderedMoves(game, moveKey(bestMove))) {
        if (
          now() >= ctx.deadline &&
          (completedDepth > 0 || candidates.length > 0)
        )
          throw TIMEOUT;
        game.move(toMove(move));
        let score;
        try {
          score = -search(game, depth - 1, -Infinity, -alpha, 1, ctx);
        } finally {
          game.undo();
        }
        candidates.push({ move, score });
        if (score > iterationScore) {
          iterationScore = score;
          iterationBest = move;
        }
        alpha = Math.max(alpha, score);
      }
    } catch (error) {
      if (error !== TIMEOUT) throw error;
      if (!completedDepth && iterationBest) {
        bestMove = iterationBest;
        bestScore = iterationScore;
        completedCandidates = candidates;
        completedDepth = 1;
      }
      break;
    }
    if (iterationBest) {
      bestMove = iterationBest;
      bestScore = iterationScore;
      completedCandidates = candidates;
      completedDepth = depth;
    }
    if (Math.abs(bestScore) > MATE - 100) break;
  }
  // Beginner chooses among near-equal alternatives; forced mates remain forced.
  if (config.id === 1 && !options.precise && Math.abs(bestScore) < MATE - 100) {
    const choices = completedCandidates
      .filter((candidate) => candidate.score >= bestScore - 95)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
    if (choices.length > 1) {
      const chosen = choices[hashString(fen + botId) % choices.length];
      bestMove = chosen.move;
      bestScore = chosen.score;
    }
  }
  return {
    ...toMove(bestMove),
    san: bestMove.san,
    uci: moveKey(bestMove),
    score: Math.round(bestScore * color),
    depth: completedDepth,
    nodes: ctx.nodes,
    engine: "Knight local engine",
  };
}

function describeMove(move, classification, bestMove, loss) {
  if (move.san.includes("#")) return "Checkmate. The king has no legal escape.";
  if (classification === "best")
    return `${move.san} matches the engine’s preferred move at this search depth.`;
  const advice = bestMove ? ` Consider ${bestMove} instead.` : "";
  if (classification === "blunder")
    return `This move gives away a substantial advantage (about ${(loss / 100).toFixed(1)} pawns).${advice}`;
  if (classification === "mistake")
    return `This move loses ground. Recheck threats, captures, and king safety.${advice}`;
  if (classification === "inaccuracy")
    return `A more precise move could keep a little more of your advantage.${advice}`;
  if (move.flags.includes("k") || move.flags.includes("q"))
    return "Castling brings your king to safety and connects your rooks.";
  if (move.captured)
    return "A sound capture at this search depth. Check how the remaining pieces coordinate.";
  if (move.san.includes("+"))
    return "A useful check. Watch the opponent’s forcing replies before your next move.";
  return "A reasonable move that keeps the position balanced at this search depth.";
}

/** Lightweight estimates, intentionally not advertised as Stockfish-grade analysis. */
export function reviewGame(moves, options = {}) {
  const game = new Chess(options.initialFen || options.startFen);
  const reviewed = [];
  const losses = { white: [], black: [] };
  const overallDeadline = now() + (options.totalTimeMs ?? 8000);
  const moveBudget = Math.max(
    18,
    Math.min(options.timePerMove ?? 65, 5500 / Math.max(1, moves.length)),
  );
  for (let index = 0; index < moves.length; index++) {
    const input = moves[index];
    const fenBefore = game.fen();
    const color = game.turn();
    const best =
      now() < overallDeadline
        ? findBestMove(fenBefore, 2, "magnus", {
            depth: 2,
            timeMs: moveBudget,
            precise: true,
          })
        : null;
    let move;
    try {
      move = game.move(
        typeof input === "string"
          ? input
          : input.from
            ? toMove(input)
            : input.san,
      );
    } catch {
      throw new Error(`Cannot review illegal move at ply ${index + 1}.`);
    }
    const fenAfter = game.fen();
    let afterScore;
    if (game.isGameOver()) afterScore = evaluatePosition(game);
    else
      afterScore =
        best && now() < overallDeadline
          ? (findBestMove(fenAfter, 1, "magnus", {
              depth: 1,
              timeMs: Math.min(moveBudget, 40),
              precise: true,
            })?.score ?? evaluatePosition(game))
          : evaluatePosition(game);
    const isBest =
      best &&
      best.from === move.from &&
      best.to === move.to &&
      (best.promotion || "") === (move.promotion || "");
    const rawLoss = best
      ? (best.score - afterScore) * (color === "w" ? 1 : -1)
      : 0;
    const loss = isBest ? 0 : Math.min(1500, Math.max(0, Math.round(rawLoss)));
    const classification =
      isBest || move.san.includes("#")
        ? "best"
        : !best
          ? "unrated"
          : loss >= 250
            ? "blunder"
            : loss >= 120
              ? "mistake"
              : loss >= 50
                ? "inaccuracy"
                : loss <= 15
                  ? "excellent"
                  : "good";
    if (best) losses[color === "w" ? "white" : "black"].push(loss);
    reviewed.push({
      ply: index + 1,
      moveNumber: Math.floor(index / 2) + 1,
      color,
      san: move.san,
      from: move.from,
      to: move.to,
      fenBefore,
      fenAfter,
      bestMove: best?.san || null,
      bestUci: best?.uci || null,
      classification,
      centipawnLoss: loss,
      evaluation: +(afterScore / 100).toFixed(2),
      evaluationBefore: +((best?.score ?? 0) / 100).toFixed(2),
      analyzed: Boolean(best),
      depth: best?.depth ?? 0,
      explanation: best
        ? describeMove(move, classification, best?.san, loss)
        : "Static position evaluation. Full move search was skipped to keep this long review responsive.",
    });
  }
  const accuracyFor = (side) =>
    side.length
      ? Math.round(
          side.reduce((sum, loss) => sum + 100 * Math.exp(-loss / 320), 0) /
            side.length,
        )
      : null;
  const counts = reviewed.reduce(
    (result, move) => ({
      ...result,
      [move.classification]: (result[move.classification] || 0) + 1,
    }),
    {},
  );
  return {
    moves: reviewed,
    accuracy: {
      white: accuracyFor(losses.white),
      black: accuracyFor(losses.black),
    },
    summary: counts,
    analysisCoverage: reviewed.filter((move) => move.analyzed).length,
    engine: "Knight local engine",
    disclaimer:
      "Estimated accuracy and move labels from a shallow local search; deeper engines may disagree.",
    finalFen: game.fen(),
  };
}
