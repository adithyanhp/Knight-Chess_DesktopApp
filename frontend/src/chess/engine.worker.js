import { findBestMove, reviewGame, evaluatePosition } from "./engine.js";

self.onmessage = (event) => {
  const { id, type, fen, level, moves, botId, options } = event.data;
  try {
    const result =
      type === "move"
        ? findBestMove(fen, level, botId, options)
        : type === "review"
          ? reviewGame(moves, options)
          : type === "evaluate"
            ? evaluatePosition(fen)
            : (() => {
                throw new Error("Unknown engine request.");
              })();
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({
      id,
      error: error.message || "The engine could not complete this request.",
    });
  }
};
