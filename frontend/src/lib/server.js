import { Chess } from "chess.js";
import { getOpening } from "../data/openings.js";

const BOT_IDS = {
  "magnus carlsen": "magnus",
  "hikaru nakamura": "hikaru",
  "viswanathan anand": "vishy",
  "vishy anand": "vishy",
  "judit polgar": "judit",
  "garry kasparov": "garry",
};

const TERMINATIONS = {
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  insufficient_material: "Insufficient material",
  timeout: "Timeout",
  timeout_insufficient_material: "Timeout · insufficient mating material",
  resignation: "Resignation",
  draw_claimed: "Draw claimed",
  draw_agreement: "Draw by agreement",
  fifty_moves: "Fifty-move rule",
  fifty_move_rule: "Fifty-move rule",
  seventyfive_moves: "Seventy-five-move rule",
  seventy_five_moves: "Seventy-five-move rule",
  threefold_repetition: "Threefold repetition",
  fivefold_repetition: "Fivefold repetition",
};

const plainName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const normalizedResult = (value) =>
  String(value || "")
    .replace(/[–—−]/g, "-")
    .replace(/½/g, "1/2")
    .trim();
const finiteNumber = (value, fallback) =>
  value !== null && value !== undefined && Number.isFinite(Number(value))
    ? Number(value)
    : fallback;
const personName = (person) => person?.display_name || person?.username || "";

/** Convert an authenticated Django game response into the app's saved-game format. */
export function normalizeServerGame(data, username) {
  if (!data || !data.id)
    throw new Error("The server returned a game without an ID.");
  const mode = data.mode === "multiplayer" ? "online" : data.mode || "local";
  const isBlack = Boolean(username) && data.black?.username === username;
  const isWhite = Boolean(username) && data.white?.username === username;
  const humanColor = isBlack
    ? "b"
    : isWhite
      ? "w"
      : data.user_color === "b"
        ? "b"
        : "w";
  const botName = data.bot_name || "";
  const botId = mode === "bot" ? BOT_IDS[plainName(botName)] || null : null;
  const startFen = data.initial_fen || undefined;
  const chess = new Chess(startFen);
  const moves = (data.moves || []).map((record, index) => {
    const uci = typeof record === "object" ? record.uci : null;
    let input = typeof record === "string" ? record : record.san;
    if (uci)
      input = {
        from: uci.slice(0, 2),
        to: uci.slice(2, 4),
        ...(uci.length > 4 ? { promotion: uci.slice(4, 5) } : {}),
      };
    else if (!input && record.from && record.to)
      input = {
        from: record.from,
        to: record.to,
        ...(record.promotion ? { promotion: record.promotion } : {}),
      };
    let move;
    try {
      move = chess.move(input);
    } catch {
      throw new Error(
        `Cannot load the server game: invalid move at ply ${index + 1}.`,
      );
    }
    return {
      ...(typeof record === "object" ? record : {}),
      ply: index + 1,
      from: move.from,
      to: move.to,
      san: move.san,
      uci: `${move.from}${move.to}${move.promotion || ""}`,
      color: move.color,
      piece: move.piece,
      captured: move.captured,
      promotion: move.promotion,
      before: move.before,
      fen: move.after,
    };
  });
  const status = ["finished", "completed"].includes(data.status)
    ? "finished"
    : data.status === "waiting"
      ? "waiting"
      : "playing";
  const result = normalizedResult(data.result);
  const winner = result === "1-0" ? "w" : result === "0-1" ? "b" : null;
  const minutes = finiteNumber(data.minutes, 10);
  const termination = data.termination || "";
  const reason =
    TERMINATIONS[termination] ||
    (termination
      ? termination
          .replaceAll("_", " ")
          .replace(/^./, (letter) => letter.toUpperCase())
      : null);
  const whiteName =
    personName(data.white) ||
    (mode === "bot" && humanColor === "b" ? botName : username || "White");
  const blackName =
    personName(data.black) ||
    (mode === "bot" && humanColor === "w"
      ? botName
      : mode === "local"
        ? "Player 2"
        : "Black");
  const date =
    data.ended_at ||
    data.updated_at ||
    data.created_at ||
    new Date().toISOString();
  const dateObject = new Date(data.created_at || date);
  const pgnDate = Number.isNaN(dateObject.getTime())
    ? "????.??.??"
    : dateObject.toISOString().slice(0, 10).replaceAll("-", ".");
  chess.header(
    "Event",
    mode === "online" ? "Knight private room" : "Knight personal game",
    "White",
    whiteName,
    "Black",
    blackName,
    "Date",
    pgnDate,
    "Result",
    ["1-0", "0-1", "1/2-1/2"].includes(result) ? result : "*",
  );

  return {
    id: `server-${data.id}`,
    serverId: data.id,
    roomCode: data.code || null,
    code: data.code || null,
    mode,
    botId,
    bot_name: botName || undefined,
    level: finiteNumber(data.bot_level, 2),
    playerColor: humanColor,
    humanColor,
    user_color: humanColor,
    startFen,
    moves,
    pgn: chess.pgn(),
    opening: data.opening || getOpening(moves.map((move) => move.san)),
    result: result || null,
    reason,
    status,
    clock: {
      w: Math.max(0, finiteNumber(data.white_seconds, minutes * 60)),
      b: Math.max(0, finiteNumber(data.black_seconds, minutes * 60)),
      at: Date.now(),
    },
    winner,
    date,
    minutes,
    opponent: humanColor === "w" ? blackName : whiteName,
    startedAt: data.created_at || date,
    endedAt: status === "finished" ? date : null,
    serverTime: data.server_time || null,
  };
}

/** Recover a lost creation response using reads only; detail settles the clock. */
export async function recoverLatestServerGame(api) {
  const data = await api("/games");
  const saved = data.games?.find((item) =>
    ["active", "waiting"].includes(item.status),
  );
  return saved ? api("/games/" + saved.id) : null;
}
