export const BOT_LEVELS = [
  {
    id: 1,
    name: "Beginner",
    label: "Beginner",
    rating: 500,
    depth: 1,
    timeMs: 180,
  },
  { id: 2, name: "Club", label: "Club", rating: 1000, depth: 2, timeMs: 450 },
  {
    id: 3,
    name: "Advanced",
    label: "Advanced",
    rating: 1500,
    depth: 3,
    timeMs: 950,
  },
  {
    id: 4,
    name: "Master",
    label: "Master",
    rating: 1900,
    depth: 4,
    timeMs: 1800,
  },
];

// These are fictional practice bots inspired by public playing styles.
// The difficulty ratings are app estimates, not FIDE ratings or player strength.
export const BOTS = [
  {
    id: "magnus",
    name: "Magnus Carlsen",
    firstName: "Magnus",
    initials: "MC",
    country: "Norway",
    flag: "🇳🇴",
    title: "The endgame artist",
    style: "Patient & positional",
    description: "Practice patient play, active pieces, and precise endgames.",
    color: "#71974e",
    avatar: "magnus",
    rating: 1900,
    personality: { positional: 1.35, aggression: 0.8, pawn: 1.2 },
  },
  {
    id: "hikaru",
    name: "Hikaru Nakamura",
    firstName: "Hikaru",
    initials: "HN",
    country: "United States",
    flag: "🇺🇸",
    title: "The tactical fighter",
    style: "Sharp & tactical",
    description: "Keep your king safe and watch for energetic tactical ideas.",
    color: "#bd8050",
    avatar: "hikaru",
    rating: 1900,
    personality: { positional: 0.9, aggression: 1.5, pawn: 0.9 },
  },
  {
    id: "judit",
    name: "Judit Polgár",
    firstName: "Judit",
    initials: "JP",
    country: "Hungary",
    flag: "🇭🇺",
    title: "The attacking force",
    style: "Creative & attacking",
    description: "Meet active pieces and direct pressure against your king.",
    color: "#a47cb8",
    avatar: "judit",
    rating: 1900,
    personality: { positional: 1, aggression: 1.65, pawn: 0.85 },
  },
  {
    id: "vishy",
    name: "Viswanathan Anand",
    firstName: "Vishy",
    initials: "VA",
    country: "India",
    flag: "🇮🇳",
    title: "The lightning mind",
    style: "Dynamic & balanced",
    description:
      "Build strong development and find the right moment to strike.",
    color: "#c8964d",
    avatar: "vishy",
    rating: 1900,
    personality: { positional: 1.15, aggression: 1.2, pawn: 1 },
  },
  {
    id: "kasparov",
    name: "Garry Kasparov",
    firstName: "Garry",
    initials: "GK",
    country: "Croatia",
    flag: "🇭🇷",
    title: "The dynamic strategist",
    style: "Ambitious & energetic",
    description: "Challenge your calculation with active, space-seeking play.",
    color: "#6d93b8",
    avatar: "kasparov",
    rating: 1900,
    personality: { positional: 1.05, aggression: 1.4, pawn: 1.05 },
  },
];

export const bots = BOTS;
export const levels = BOT_LEVELS;
export function normalizeLevel(level) {
  if (typeof level === "object" && level?.id) level = level.id;
  if (typeof level === "string" && !/^\d$/.test(level)) {
    return (
      BOT_LEVELS.find(
        (item) => item.name.toLowerCase() === level.toLowerCase(),
      ) || BOT_LEVELS[1]
    );
  }
  return BOT_LEVELS[Math.max(0, Math.min(3, Number(level || 1) - 1))];
}
