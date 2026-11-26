import { useState, useCallback } from "react";
export function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem("knight." + key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
export function writeStorage(key, value) {
  try {
    localStorage.setItem("knight." + key, JSON.stringify(value));
  } catch {}
}
export function useStorage(key, initial) {
  const [value, setValue] = useState(() => readStorage(key, initial));
  const update = useCallback(
    (next) =>
      setValue((old) => {
        const value = typeof next === "function" ? next(old) : next;
        writeStorage(key, value);
        return value;
      }),
    [key],
  );
  return [value, update];
}
export const DEFAULT_SETTINGS = {
  boardTheme: "green",
  pieceTheme: "classic",
  lightPiece: "#f9f7ee",
  darkPiece: "#4a4744",
  coordinates: true,
  legalMoves: true,
  sound: true,
  autoQueen: false,
  autoFlip: false,
  volume: 0.35,
};
export const BOARD_THEMES = [
  { id: "green", name: "Classic green", light: "#eeeed2", dark: "#769656" },
  { id: "walnut", name: "Walnut", light: "#f0d9b5", dark: "#b58863" },
  { id: "ocean", name: "Ocean", light: "#dee3e6", dark: "#7894ab" },
  { id: "slate", name: "Slate", light: "#d5d5d5", dark: "#727780" },
  { id: "rose", name: "Rosewood", light: "#f0d7cf", dark: "#ac7370" },
  { id: "purple", name: "Amethyst", light: "#e8dff1", dark: "#967bb1" },
];
export function playMoveSound(capture = false, enabled = true) {
  if (!enabled) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = capture ? 190 : 310;
    osc.type = "triangle";
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => ctx.close();
  } catch {}
}
export function downloadText(filename, text, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function formatTime(seconds) {
  seconds = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
