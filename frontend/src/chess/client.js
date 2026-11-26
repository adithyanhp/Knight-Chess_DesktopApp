let worker;
let requestId = 0;
const pending = new Map();

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL("./engine.worker.js", import.meta.url), {
      type: "module",
    });
    worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const promise = pending.get(id);
      if (!promise) return;
      pending.delete(id);
      clearTimeout(promise.timeout);
      if (error) promise.reject(new Error(error));
      else promise.resolve(result);
    };
    worker.onerror = () =>
      cancelEngine(
        "The local chess engine encountered an error. Please try again.",
      );
  }
  return worker;
}

function request(type, data) {
  return new Promise((resolve, reject) => {
    const id = ++requestId;
    const timeout = setTimeout(
      () => cancelEngine("The local chess engine timed out. Please try again."),
      type === "review" ? 30000 : 15000,
    );
    pending.set(id, { resolve, reject, timeout });
    try {
      getWorker().postMessage({ id, type, ...data });
    } catch (error) {
      clearTimeout(timeout);
      pending.delete(id);
      reject(error);
    }
  });
}

export const getBotMove = (fen, level = 2, botId = "magnus") =>
  request("move", { fen, level, botId });
export const analyzeGame = (moves, options) =>
  request("review", { moves, options });
export const getEvaluation = (fen) => request("evaluate", { fen });
export function cancelEngine(message = "Engine request cancelled.") {
  worker?.terminate();
  worker = undefined;
  for (const promise of pending.values()) {
    clearTimeout(promise.timeout);
    promise.reject(new Error(message));
  }
  pending.clear();
}
