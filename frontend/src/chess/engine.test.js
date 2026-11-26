import test from "node:test";
import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { findBestMove, evaluatePosition, reviewGame } from "./engine.js";
import { BOTS, BOT_LEVELS } from "./bots.js";
import { PUZZLES, generatePuzzle, checkPuzzleMove } from "../data/puzzles.js";
import { OPENINGS, getOpening } from "../data/openings.js";

test("all four difficulties return legal moves without mutating the position", () => {
  const start = new Chess().fen();
  for (const level of BOT_LEVELS) {
    const result = findBestMove(start, level.id, "magnus", { timeMs: 160 });
    assert.ok(result);
    const game = new Chess(start);
    assert.ok(game.move(result));
    assert.equal(new Chess().fen(), start);
  }
  assert.equal(BOTS.length, 5);
});

test("engine finds mate in one and does not move in a terminal position", () => {
  const fen = "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1";
  const result = findBestMove(fen, 4, "magnus", { timeMs: 300 });
  const game = new Chess(fen);
  game.move(result);
  assert.equal(game.isCheckmate(), true);
  assert.equal(findBestMove(game.fen(), 3), null);
  assert.equal(evaluatePosition(game.fen()), 30000);
});

test("engine escapes check legally and treats stalemate as a draw", () => {
  const checked = new Chess("4k3/8/8/8/8/8/4r3/4K3 w - - 0 1");
  const result = findBestMove(checked.fen(), 3, "hikaru", { timeMs: 200 });
  assert.ok(checked.move(result));
  const stalemate = "7k/5Q2/6K1/8/8/8/8/8 b - - 0 1";
  assert.equal(new Chess(stalemate).isStalemate(), true);
  assert.equal(findBestMove(stalemate, 4), null);
  assert.equal(evaluatePosition(stalemate), 0);
});

test("every opening sequence is legal and longest matching line wins", () => {
  for (const item of OPENINGS) {
    const game = new Chess();
    for (const move of item.moves)
      assert.ok(game.move(move), `${item.name}: ${move}`);
  }
  assert.equal(getOpening(["e4", "e5", "Nf3", "Nc6", "Bb5"]).name, "Ruy López");
  assert.equal(
    getOpening([
      "e4",
      "c5",
      "Nf3",
      "d6",
      "d4",
      "cxd4",
      "Nxd4",
      "Nf6",
      "Nc3",
      "a6",
    ]).eco,
    "B90",
  );
});

test("seed and generated puzzles are legal and have verified mating solutions", () => {
  const positions = new Set();
  for (let index = 0; index < 26; index++) {
    const puzzle =
      index < PUZZLES.length ? PUZZLES[index] : generatePuzzle(index);
    assert.equal(positions.has(puzzle.fen), false);
    positions.add(puzzle.fen);
    const game = new Chess(puzzle.fen);
    assert.equal(game.isGameOver(), false);
    const uci = puzzle.solution[0];
    const move = {
      from: uci.slice(0, 2),
      to: uci.slice(2, 4),
      ...(uci[4] ? { promotion: uci[4] } : {}),
    };
    assert.equal(checkPuzzleMove(puzzle, move).correct, true);
    game.move(move);
    assert.equal(game.isCheckmate(), true);
  }
});

test("review replays all moves with real evaluations and identifies checkmate", () => {
  const review = reviewGame(["f3", "e5", "g4", "Qh4#"], { timePerMove: 45 });
  assert.equal(review.moves.length, 4);
  assert.equal(review.moves[3].classification, "best");
  assert.equal(new Chess(review.finalFen).isCheckmate(), true);
  assert.ok(review.accuracy.white >= 0 && review.accuracy.white <= 100);
  assert.ok(review.moves.some((move) => move.bestMove));
  assert.throws(() => reviewGame(["e5"]), /illegal move/);
});
