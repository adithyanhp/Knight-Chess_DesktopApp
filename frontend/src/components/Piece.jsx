import React from "react";
export function KnightLogo({ size = 36 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M17 49h32v5H15v-5Zm5-5c-1-11 13-17 10-25l-8 8-10-5 8-12 5-1 1-6 9 6c15 2 15 21 9 35Z"
        fill="currentColor"
      />
      <circle cx="29" cy="15" r="2" fill="#262421" />
    </svg>
  );
}
export default function Piece({ type, color, settings = {}, small = false }) {
  const fill =
    color === "w"
      ? settings.lightPiece || "#f9f7ee"
      : settings.darkPiece || "#4a4744";
  const stroke = color === "w" ? "#4b4640" : "#252321";
  const accent = color === "w" ? "#d2ccbf" : "#67615b";
  const modern = settings.pieceTheme === "modern";
  const base = (
    <>
      <path d="M13 53h38l3 5H10l3-5Z" />
      <path d="M17 48h30l3 5H14l3-5Z" />
      <path d="M18 49h28" fill="none" stroke={accent} strokeWidth="2" />
    </>
  );
  return (
    <svg
      className={
        "chess-piece " +
        (small ? "piece-small" : "") +
        " " +
        (modern ? "modern" : "")
      }
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <g
        fill={fill}
        stroke={stroke}
        strokeWidth={modern ? 2.7 : 1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {type === "p" && (
          <>
            <circle cx="32" cy="17" r="8" />
            <path d="M26 25h12l-2 8c0 6 4 10 8 15H20c5-6 8-10 8-15l-2-8Z" />
            <path d="M25 30h14" fill="none" stroke={accent} />
          </>
        )}
        {type === "r" && (
          <>
            <path d="M17 10h7v7h5v-7h7v7h5v-7h7v16l-7 6 2 16H21l2-16-6-6V10Z" />
            <path d="M20 26h25M23 32h18M22 44h20" fill="none" stroke={accent} />
          </>
        )}
        {type === "b" && (
          <>
            <circle cx="32" cy="7" r="3" />
            <path d="M32 11c7 6 14 12 11 19-1 4-7 8-7 12l8 6H20l8-6c0-4-6-8-7-12-3-7 4-13 11-19Z" />
            <path
              d="m29 24 8-8M24 35h16M27 41h10"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
            />
          </>
        )}
        {type === "n" && (
          <>
            <path d="M22 48c0-11 13-18 11-27l-9 10-11-5 10-16 5 1 2-7 8 8c14 1 16 19 10 36H22Z" />
            <path
              d="M39 18c7 6 6 15 2 23M25 27l-8-2"
              fill="none"
              stroke={accent}
              strokeWidth="2.5"
            />
            <circle cx="29" cy="18" r="2" fill={stroke} stroke="none" />
          </>
        )}
        {type === "q" && (
          <>
            <path d="m16 18 7 7 9-14 9 14 7-7-8 24 5 6H19l5-6-8-24Z" />
            <circle cx="14" cy="15" r="4" />
            <circle cx="32" cy="8" r="4" />
            <circle cx="50" cy="15" r="4" />
            <path
              d="M24 36h16M24 41h16"
              fill="none"
              stroke={accent}
              strokeWidth="2"
            />
          </>
        )}
        {type === "k" && (
          <>
            <path d="M29 6h6v6h6v5h-6v6h-6v-6h-6v-5h6V6Z" />
            <path d="M32 26c-10-10-20-3-15 7l8 10-5 5h24l-5-5 8-10c5-10-5-17-15-7Z" />
            <path
              d="M25 39h14M25 43h14"
              fill="none"
              stroke={accent}
              strokeWidth="2"
            />
          </>
        )}
        {base}
      </g>
    </svg>
  );
}
export function Avatar({ name = "Player", src, bot, size = 42 }) {
  const palette = {
    magnus: ["#718764", "#d6b392"],
    hikaru: ["#b79b72", "#dfb493"],
    vishy: ["#97816b", "#b98b6a"],
    judit: ["#ab8291", "#e0b49c"],
    garry: ["#8196a3", "#d6ac91"],
  };
  if (src)
    return (
      <img
        className="avatar"
        src={src}
        alt={name}
        style={{ width: size, height: size }}
      />
    );
  if (bot) {
    const [bg, skin] = palette[bot] || palette.magnus;
    return (
      <svg
        className="avatar bot-avatar"
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${name}, illustrated avatar`}
      >
        <rect width="64" height="64" rx="10" fill={bg} />
        <circle cx="47" cy="10" r="30" fill="#fff" opacity=".08" />
        <path
          d="M8 64c1-17 11-22 24-22s24 6 25 22"
          fill={bot === "magnus" ? "#eee9df" : "#343738"}
        />
        <path d="M26 39v10l6 5 7-5V37" fill={skin} />
        {bot === "judit" && (
          <ellipse cx="32" cy="31" rx="19" ry="25" fill="#734b36" />
        )}
        <ellipse cx="32" cy="28" rx="14" ry="17" fill={skin} />
        <path
          d={
            bot === "garry"
              ? "M18 29c-3-16 2-21 13-22 12 0 17 7 15 22l-4-11-22 1Z"
              : bot === "judit"
                ? "M18 30C13 7 42 1 48 23l-11-9-19 16Z"
                : "M18 28c-5-19 11-25 19-22 12 1 14 12 10 23l-5-13-12 3-8-3Z"
          }
          fill={
            bot === "magnus"
              ? "#594e42"
              : bot === "judit"
                ? "#734b36"
                : "#30302d"
          }
        />
        <path
          d="M26 28h2m9 0h2"
          stroke="#4b3c31"
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <path
          d="m29 37 6 0"
          stroke="#9a6a54"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {bot === "magnus" && (
          <path
            d="m19 34 6 7 9 3 9-9-3 9-9 3-9-6Z"
            fill="#6d5440"
            opacity=".7"
          />
        )}
        {bot === "vishy" && (
          <g stroke="#393d3b" fill="none">
            <rect x="21" y="25" width="10" height="7" rx="2" />
            <rect x="34" y="25" width="10" height="7" rx="2" />
            <path d="M31 27h3" />
          </g>
        )}
      </svg>
    );
  }
  return (
    <div
      className="avatar initial-avatar"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
