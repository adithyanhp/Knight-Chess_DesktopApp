import React, { useMemo, useState, useEffect } from "react";
import { Chess } from "chess.js";
import Piece from "./Piece";
import { BOARD_THEMES } from "../lib/storage";
const NAMES = {
  p: "pawn",
  n: "knight",
  b: "bishop",
  r: "rook",
  q: "queen",
  k: "king",
};
export default function ChessBoard({
  fen,
  orientation = "w",
  onMove,
  disabled = false,
  lastMove,
  settings = {},
  hint,
  small = false,
}) {
  const [selected, setSelected] = useState(null);
  const [promotion, setPromotion] = useState(null);
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
  }, [fen]);
  const game = useMemo(() => {
    try {
      return new Chess(fen);
    } catch {
      return new Chess();
    }
  }, [fen]);
  const theme =
    BOARD_THEMES.find((t) => t.id === settings.boardTheme) || BOARD_THEMES[0];
  const files = orientation === "w" ? "abcdefgh" : "hgfedcba";
  const ranks =
    orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const selectedPiece = selected ? game.get(selected) : null;
  const legal =
    selected && selectedPiece?.color === game.turn()
      ? game.moves({ square: selected, verbose: true })
      : [];
  const moveTo = (from, to) => {
    if (!/^[a-h][1-8]$/.test(from) || !/^[a-h][1-8]$/.test(to)) return false;
    const options = game
      .moves({ square: from, verbose: true })
      .filter((m) => m.to === to);
    if (!options.length) return false;
    if (options.some((m) => m.promotion) && !settings.autoQueen) {
      setPromotion({ from, to, color: game.turn() });
      setSelected(null);
      return true;
    }
    onMove?.({ from, to, promotion: "q" });
    setSelected(null);
    return true;
  };
  const click = (square) => {
    if (disabled || !onMove) return;
    if (selected === square) {
      setSelected(null);
      return;
    }
    if (selected && moveTo(selected, square)) return;
    setSelected(game.get(square)?.color === game.turn() ? square : null);
  };
  return (
    <div className={`board-wrap ${small ? "small-board" : ""}`}>
      <div
        className="chess-board"
        role="group"
        aria-label="Chess board"
        style={{ "--light-square": theme.light, "--dark-square": theme.dark }}
      >
        {ranks.map((rank, ri) =>
          [...files].map((file, fi) => {
            const sq = file + rank;
            const piece = game.get(sq);
            const isLight = (file.charCodeAt(0) - 97 + rank) % 2 === 0;
            const possible = legal.some((m) => m.to === sq);
            const checked =
              piece?.type === "k" &&
              piece.color === game.turn() &&
              game.isCheck();
            return (
              <button
                type="button"
                key={sq}
                className={`square ${isLight ? "light-square" : "dark-square"} ${selected === sq ? "selected" : ""} ${lastMove && (lastMove.from === sq || lastMove.to === sq) ? "last-move" : ""} ${checked ? "in-check" : ""} ${hint === sq ? "hint-square" : ""}`}
                aria-label={`${sq}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${NAMES[piece.type]}` : ", empty"}`}
                onClick={() => click(sq)}
                draggable={!disabled && !!piece && piece.color === game.turn()}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", sq);
                  setSelected(sq);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (!disabled)
                    moveTo(e.dataTransfer.getData("text/plain"), sq);
                }}
              >
                {settings.coordinates !== false && fi === 0 && (
                  <span className="rank-label">{rank}</span>
                )}
                {settings.coordinates !== false && ri === 7 && (
                  <span className="file-label">{file}</span>
                )}
                {piece && (
                  <Piece
                    type={piece.type}
                    color={piece.color}
                    settings={settings}
                  />
                )}{" "}
                {possible && settings.legalMoves !== false && (
                  <span className={piece ? "capture-ring" : "move-dot"} />
                )}
              </button>
            );
          }),
        )}
      </div>
      {promotion && (
        <div className="promotion-backdrop">
          <div className="promotion-picker">
            <h3>Choose your promotion</h3>
            <div>
              {["q", "r", "b", "n"].map((p) => (
                <button
                  key={p}
                  aria-label={`Promote to ${NAMES[p]}`}
                  onClick={() => {
                    onMove({ ...promotion, promotion: p });
                    setPromotion(null);
                  }}
                >
                  <Piece type={p} color={promotion.color} settings={settings} />
                </button>
              ))}
            </div>
            <button className="text-button" onClick={() => setPromotion(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
