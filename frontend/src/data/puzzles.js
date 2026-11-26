import { Chess } from "chess.js";

const FILES = "abcdefgh";
const EMPTY = "8/8/8/8/8/8/8/8 w - - 0 1";
const seen = new Set();
let serial = 0;

const seed = (id, line, title, theme, explanation, rating = 600) => {
  const board = new Chess();
  for (const san of line.split(" ").filter(Boolean)) board.move(san);
  return { id, fen: board.fen(), title, theme, explanation, rating };
};

const SEEDS = [
  seed(
    "scholar",
    "e4 e5 Bc4 Nc6 Qh5 Nf6",
    "A weakness on f7",
    "King attack",
    "The f7 pawn is defended only by the king. Combine queen and bishop to finish the attack.",
    600,
  ),
  seed(
    "fool",
    "f3 e5 g4",
    "The exposed diagonal",
    "King safety",
    "The f-pawn and g-pawn have left the king exposed. Find the queen’s decisive diagonal.",
    400,
  ),
  seed(
    "legal",
    "e4 e5 Nf3 Nc6 Bc4 d6 Nc3 Bg4 h3 Bh5 Nxe5 Bxd1 Bxf7+ Ke7",
    "Légal’s finishing touch",
    "Piece coordination",
    "Your bishops and knights work together. Find the knight move that closes every escape square.",
    1100,
  ),
  {
    id: "back-rank",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    title: "No room to escape",
    theme: "Back-rank mate",
    explanation:
      "The king’s own pawns block its escape. Bring your rook to the back rank.",
    rating: 500,
  },
  {
    id: "smothered",
    fen: "6rk/6pp/7N/8/8/8/8/6K1 w - - 0 1",
    title: "A knight’s perfect finish",
    theme: "Smothered mate",
    explanation:
      "A knight’s check cannot be blocked. The enemy king is surrounded by its own pieces.",
    rating: 850,
  },
  {
    id: "queen-net",
    fen: "7k/8/6K1/8/6Q1/8/8/8 w - - 0 1",
    title: "Close the mating net",
    theme: "Queen & king",
    explanation:
      "Your king protects the mating square. Place the queen next to the opposing king.",
    rating: 450,
  },
];

function uci(move) {
  return `${move.from}${move.to}${move.promotion || ""}`;
}

function mateMoves(board) {
  const answers = [];
  for (const move of board.moves({ verbose: true })) {
    board.move({
      from: move.from,
      to: move.to,
      ...(move.promotion ? { promotion: move.promotion } : {}),
    });
    if (board.isCheckmate()) answers.push({ uci: uci(move), san: move.san });
    board.undo();
  }
  return answers;
}

function enrich(puzzle) {
  const board = new Chess(puzzle.fen);
  const answers = mateMoves(board);
  if (!answers.length)
    throw new Error(`Puzzle ${puzzle.id} has no mating solution.`);
  return {
    ...puzzle,
    side: board.turn(),
    turn: board.turn(),
    solution: [answers[0].uci],
    solutionSAN: [answers[0].san],
    acceptedMoves: answers.map((answer) => answer.uci),
    goal: "Find checkmate in one move",
    difficulty:
      puzzle.rating < 700
        ? "Beginner"
        : puzzle.rating < 1000
          ? "Intermediate"
          : "Advanced",
  };
}

export const PUZZLES = SEEDS.map(enrich);
export const puzzles = PUZZLES;

function rng(seedValue) {
  let state = (seedValue || 123456789) >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function transformSquare(square, transform) {
  let x = FILES.indexOf(square[0]);
  let y = Number(square[1]) - 1;
  if (transform >= 4) x = 7 - x;
  for (let step = 0; step < transform % 4; step++) [x, y] = [7 - y, x];
  return `${FILES[x]}${y + 1}`;
}

function opposite(color) {
  return color === "w" ? "b" : "w";
}
function otherKingInCheck(board) {
  const fenParts = board.fen().split(" ");
  fenParts[1] = opposite(board.turn());
  try {
    return new Chess(fenParts.join(" ")).isCheck();
  } catch {
    return true;
  }
}

/** Creates repeat-free, verified mate-in-one positions for the current session. */
export function generatePuzzle(index = serial) {
  serial++;
  if (index >= 0 && index < PUZZLES.length && !seen.has(PUZZLES[index].fen)) {
    seen.add(PUZZLES[index].fen);
    return { ...PUZZLES[index] };
  }
  const random = rng(
    Math.imul(Number(index) + 1, 2654435761) ^ Math.imul(serial, 2246822519),
  );
  for (let attempt = 0; attempt < 1600; attempt++) {
    const family = Math.floor(random() * 3);
    const transform = Math.floor(random() * 8);
    const side = random() < 0.5 ? "w" : "b";
    const board = new Chess(EMPTY, { skipValidation: true });
    const pieces =
      family === 0
        ? [
            ["k", "w", "g6"],
            ["k", "b", "h8"],
            ["q", "w", `g${1 + Math.floor(random() * 5)}`],
          ]
        : family === 1
          ? [
              ["k", "w", "f7"],
              ["k", "b", "h8"],
              [
                "r",
                "w",
                `${FILES[Math.floor(random() * 6)]}${1 + Math.floor(random() * 5)}`,
              ],
            ]
          : [
              ["k", "w", "g1"],
              ["k", "b", "h8"],
              ["r", "b", "g8"],
              ["p", "b", "g7"],
              ["p", "b", "h7"],
              ["n", "w", "h6"],
            ];
    let valid = true;
    for (const [type, color, location] of pieces) {
      const square = transformSquare(location, transform);
      if (type === "p" && (square[1] === "1" || square[1] === "8")) {
        valid = false;
        break;
      }
      if (
        !board.put(
          { type, color: side === "w" ? color : opposite(color) },
          square,
        )
      ) {
        valid = false;
        break;
      }
    }
    if (!valid) continue;
    const extras = 2 + Math.floor(random() * 5);
    for (let extra = 0; extra < extras; extra++) {
      const square = `${FILES[Math.floor(random() * 8)]}${2 + Math.floor(random() * 5)}`;
      if (board.get(square)) continue;
      const type = random() < 0.72 ? "p" : random() < 0.65 ? "n" : "b";
      board.put(
        { type, color: random() < 0.55 ? side : opposite(side) },
        square,
      );
    }
    const parts = board.fen().split(" ");
    parts[1] = side;
    const fen = parts.join(" ");
    if (seen.has(fen)) continue;
    let position;
    try {
      position = new Chess(fen);
    } catch {
      continue;
    }
    // A legal position cannot leave the player who just moved in check.
    if (otherKingInCheck(position) || position.isCheck()) continue;
    const answers = mateMoves(position);
    if (answers.length !== 1) continue;
    seen.add(fen);
    const theme = ["Queen & king", "Rook checkmate", "Smothered mate"][family];
    return {
      id: `generated-${index}-${serial}-${attempt}`,
      fen,
      side,
      turn: side,
      solution: [answers[0].uci],
      solutionSAN: [answers[0].san],
      acceptedMoves: answers.map((answer) => answer.uci),
      title: [
        "Find the finishing touch",
        "A rook with a mission",
        "The knight’s final leap",
      ][family],
      theme,
      rating: [650, 700, 950][family] + extras * 35,
      goal: "Find checkmate in one move",
      difficulty: family === 2 ? "Advanced" : "Intermediate",
      explanation:
        family === 0
          ? "Use your queen and king together. The mating square must be protected, and every escape square must be covered."
          : family === 1
            ? "Your king restricts the enemy king. Use the rook’s long reach to deliver a check with no escape."
            : "A knight’s check cannot be blocked. Look for a jump that traps the king behind its own pieces.",
      generated: true,
    };
  }
  // Extremely unlikely safety fallback still returns a verified puzzle.
  return {
    ...PUZZLES[Math.abs(Number(index)) % PUZZLES.length],
    id: `practice-${serial}`,
    generated: false,
  };
}

export const getPuzzle = generatePuzzle;
export const nextPuzzle = generatePuzzle;

export function checkPuzzleMove(puzzle, move) {
  const board = new Chess(puzzle.fen);
  try {
    const played = board.move(
      typeof move === "string"
        ? move
        : { from: move.from, to: move.to, promotion: move.promotion || "q" },
    );
    return {
      correct: board.isCheckmate(),
      san: played.san,
      fen: board.fen(),
      move: uci(played),
    };
  } catch {
    return { correct: false, illegal: true };
  }
}
