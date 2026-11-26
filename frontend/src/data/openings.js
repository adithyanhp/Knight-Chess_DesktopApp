const opening = (eco, name, line, description) => ({
  eco,
  name,
  moves: line.split(" "),
  description,
});

export const OPENINGS = [
  opening(
    "A00",
    "Van ’t Kruijs Opening",
    "e3",
    "A flexible first move, though it gives up immediate control of the center.",
  ),
  opening(
    "A00",
    "Grob Opening",
    "g4",
    "An ambitious flank pawn move that requires careful king safety.",
  ),
  opening(
    "A01",
    "Nimzo–Larsen Attack",
    "b3",
    "Develop the queen’s bishop to b2 and influence the center from a distance.",
  ),
  opening(
    "A02",
    "Bird Opening",
    "f4",
    "White claims the e5 square but must watch the weakened king diagonal.",
  ),
  opening(
    "A04",
    "Réti Opening",
    "Nf3",
    "Flexible knight development keeps the central pawn structure undecided.",
  ),
  opening(
    "A09",
    "Réti Opening",
    "Nf3 d5 c4",
    "White challenges the center with a flank pawn before deciding on d4.",
  ),
  opening(
    "A10",
    "English Opening",
    "c4",
    "White controls d5 with a flank pawn and often develops the bishop to g2.",
  ),
  opening(
    "A20",
    "English: King’s English",
    "c4 e5",
    "A reversed Sicilian structure offers flexible development and central tension.",
  ),
  opening(
    "A30",
    "English: Symmetrical",
    "c4 c5",
    "Both players control the center from the flank; small tempi matter.",
  ),
  opening(
    "A40",
    "Queen’s Pawn Opening",
    "d4",
    "White takes central space and opens the queen’s bishop.",
  ),
  opening(
    "A45",
    "Indian Defense",
    "d4 Nf6",
    "Black develops actively and keeps the central pawn structure flexible.",
  ),
  opening(
    "A45",
    "Trompowsky Attack",
    "d4 Nf6 Bg5",
    "White questions the knight before Black chooses a central structure.",
  ),
  opening(
    "A48",
    "London System",
    "d4 Nf6 Nf3 g6 Bf4",
    "White develops the bishop outside the pawn chain and builds a solid center.",
  ),
  opening(
    "A50",
    "Queen’s Pawn: Indian Game",
    "d4 Nf6 c4",
    "White gains central space while Black prepares a counterattack.",
  ),
  opening(
    "A57",
    "Benko Gambit",
    "d4 Nf6 c4 c5 d5 b5",
    "Black offers a pawn for open files and lasting queenside activity.",
  ),
  opening(
    "A60",
    "Modern Benoni",
    "d4 Nf6 c4 c5 d5 e6",
    "An unbalanced pawn structure creates play on opposite wings.",
  ),
  opening(
    "A80",
    "Dutch Defense",
    "d4 f5",
    "Black contests e4 with the f-pawn and looks for kingside activity.",
  ),
  opening(
    "B00",
    "King’s Pawn Opening",
    "e4",
    "White claims central space and clears lines for the queen and king’s bishop.",
  ),
  opening(
    "B00",
    "Nimzowitsch Defense",
    "e4 Nc6",
    "Black develops a knight before choosing a central pawn break.",
  ),
  opening(
    "B01",
    "Scandinavian Defense",
    "e4 d5",
    "Black challenges the e-pawn immediately and aims for straightforward development.",
  ),
  opening(
    "B02",
    "Alekhine Defense",
    "e4 Nf6",
    "Black invites the e-pawn forward and later attacks White’s center.",
  ),
  opening(
    "B06",
    "Modern Defense",
    "e4 g6",
    "Black places a bishop on the long diagonal before occupying the center.",
  ),
  opening(
    "B07",
    "Pirc Defense",
    "e4 d6 d4 Nf6",
    "Black lets White build a center, then attacks it with pieces and pawn breaks.",
  ),
  opening(
    "B10",
    "Caro–Kann Defense",
    "e4 c6",
    "Black prepares d5 with a solid pawn structure and a free light-square bishop.",
  ),
  opening(
    "B12",
    "Caro–Kann: Advance Variation",
    "e4 c6 d4 d5 e5",
    "White gains space; Black develops the bishop and attacks the central pawn chain.",
  ),
  opening(
    "B13",
    "Caro–Kann: Exchange Variation",
    "e4 c6 d4 d5 exd5 cxd5",
    "An open center leads to clear piece development and structural play.",
  ),
  opening(
    "B20",
    "Sicilian Defense",
    "e4 c5",
    "Black fights for d4 and creates an asymmetrical position from the first move.",
  ),
  opening(
    "B21",
    "Sicilian: Smith–Morra Gambit",
    "e4 c5 d4 cxd4 c3",
    "White offers a pawn to open lines and accelerate development.",
  ),
  opening(
    "B22",
    "Sicilian: Alapin Variation",
    "e4 c5 c3",
    "White prepares d4 with the c-pawn and aims for a broad central pawn duo.",
  ),
  opening(
    "B23",
    "Closed Sicilian",
    "e4 c5 Nc3",
    "White often keeps the center closed and develops a kingside attack.",
  ),
  opening(
    "B27",
    "Sicilian: Hyperaccelerated Dragon",
    "e4 c5 Nf3 g6",
    "Black immediately prepares a bishop on the long diagonal.",
  ),
  opening(
    "B30",
    "Sicilian: Old Sicilian",
    "e4 c5 Nf3 Nc6",
    "Black develops the queenside knight and keeps several central setups available.",
  ),
  opening(
    "B33",
    "Sicilian: Sveshnikov",
    "e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5",
    "Black accepts a weak d5 square in return for space and active pieces.",
  ),
  opening(
    "B50",
    "Sicilian: Modern Variations",
    "e4 c5 Nf3 d6",
    "Black supports a solid center and prepares to develop the kingside.",
  ),
  opening(
    "B70",
    "Sicilian: Dragon Variation",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6",
    "The fianchettoed bishop creates long-diagonal pressure and sharp attacking chances.",
  ),
  opening(
    "B90",
    "Sicilian: Najdorf Variation",
    "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6",
    "Black prevents Nb5 and keeps flexible central and queenside plans.",
  ),
  opening(
    "C00",
    "French Defense",
    "e4 e6",
    "Black prepares d5 and aims to challenge White’s central pawn chain.",
  ),
  opening(
    "C01",
    "French: Exchange Variation",
    "e4 e6 d4 d5 exd5 exd5",
    "A symmetrical pawn structure rewards active piece development.",
  ),
  opening(
    "C02",
    "French: Advance Variation",
    "e4 e6 d4 d5 e5",
    "White gains space; Black targets d4 with c5 and piece pressure.",
  ),
  opening(
    "C03",
    "French: Tarrasch Variation",
    "e4 e6 d4 d5 Nd2",
    "White supports e4 while keeping the c-pawn free to move.",
  ),
  opening(
    "C15",
    "French: Winawer Variation",
    "e4 e6 d4 d5 Nc3 Bb4",
    "Black pins the knight and creates complex structural imbalances.",
  ),
  opening(
    "C20",
    "Open Game",
    "e4 e5",
    "Both players occupy the center and open lines for their kingside pieces.",
  ),
  opening(
    "C20",
    "Wayward Queen Attack",
    "e4 e5 Qh5",
    "An early queen sortie threatens the e-pawn but can lose time to development.",
  ),
  opening(
    "C21",
    "Center Game",
    "e4 e5 d4",
    "White challenges the center immediately and opens lines early.",
  ),
  opening(
    "C21",
    "Danish Gambit",
    "e4 e5 d4 exd4 c3",
    "White offers pawns for open diagonals and rapid development.",
  ),
  opening(
    "C25",
    "Vienna Game",
    "e4 e5 Nc3",
    "White develops the queen’s knight first and keeps an f-pawn advance possible.",
  ),
  opening(
    "C30",
    "King’s Gambit",
    "e4 e5 f4",
    "White offers the f-pawn to challenge the center and open attacking lines.",
  ),
  opening(
    "C40",
    "King’s Knight Opening",
    "e4 e5 Nf3",
    "White develops with a threat against e5 and prepares quick castling.",
  ),
  opening(
    "C41",
    "Philidor Defense",
    "e4 e5 Nf3 d6",
    "Black supports e5 with a pawn and builds a compact position.",
  ),
  opening(
    "C42",
    "Petrov Defense",
    "e4 e5 Nf3 Nf6",
    "Black counterattacks the e-pawn and seeks active, balanced play.",
  ),
  opening(
    "C44",
    "King’s Knight: Normal Variation",
    "e4 e5 Nf3 Nc6",
    "Both players develop naturally before White selects an open-game system.",
  ),
  opening(
    "C44",
    "Scotch Game",
    "e4 e5 Nf3 Nc6 d4",
    "White opens the center early and invites active piece play.",
  ),
  opening(
    "C47",
    "Four Knights Game",
    "e4 e5 Nf3 Nc6 Nc3 Nf6",
    "Sound knight development leads to a balanced central struggle.",
  ),
  opening(
    "C50",
    "Italian Game",
    "e4 e5 Nf3 Nc6 Bc4",
    "The bishop targets f7, and White prepares fast castling and central play.",
  ),
  opening(
    "C50",
    "Giuoco Pianissimo",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 d3",
    "A quiet Italian structure emphasizes maneuvering and a well-timed d4 break.",
  ),
  opening(
    "C51",
    "Evans Gambit",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 b4",
    "White sacrifices a flank pawn to gain time and build a strong center.",
  ),
  opening(
    "C54",
    "Giuoco Piano",
    "e4 e5 Nf3 Nc6 Bc4 Bc5 c3",
    "White prepares d4 and builds central tension behind active bishops.",
  ),
  opening(
    "C55",
    "Italian: Two Knights Defense",
    "e4 e5 Nf3 Nc6 Bc4 Nf6",
    "Black attacks e4 and creates immediate tactical possibilities.",
  ),
  opening(
    "C60",
    "Ruy López",
    "e4 e5 Nf3 Nc6 Bb5",
    "White pressures the knight that defends e5 and builds lasting central tension.",
  ),
  opening(
    "C65",
    "Ruy López: Berlin Defense",
    "e4 e5 Nf3 Nc6 Bb5 Nf6",
    "Black develops with a counterattack and aims for a resilient position.",
  ),
  opening(
    "C68",
    "Ruy López: Exchange Variation",
    "e4 e5 Nf3 Nc6 Bb5 a6 Bxc6",
    "White trades the bishop for a knight and changes Black’s queenside pawn structure.",
  ),
  opening(
    "C70",
    "Ruy López: Morphy Defense",
    "e4 e5 Nf3 Nc6 Bb5 a6 Ba4",
    "Black asks the bishop to decide while White preserves long-term pressure.",
  ),
  opening(
    "D00",
    "Queen’s Pawn Game",
    "d4 d5",
    "Both sides claim central space and prepare natural piece development.",
  ),
  opening(
    "D00",
    "London System",
    "d4 d5 Bf4",
    "White develops the bishop before closing the pawn chain with e3.",
  ),
  opening(
    "D02",
    "London System",
    "d4 d5 Nf3 Nf6 Bf4",
    "A stable center and an active dark-square bishop make a reliable setup.",
  ),
  opening(
    "D06",
    "Queen’s Gambit",
    "d4 d5 c4",
    "White offers the c-pawn to challenge Black’s central d-pawn.",
  ),
  opening(
    "D10",
    "Slav Defense",
    "d4 d5 c4 c6",
    "Black supports d5 while keeping the light-square bishop’s diagonal open.",
  ),
  opening(
    "D20",
    "Queen’s Gambit Accepted",
    "d4 d5 c4 dxc4",
    "Black yields the center temporarily and aims for quick, active development.",
  ),
  opening(
    "D30",
    "Queen’s Gambit Declined",
    "d4 d5 c4 e6",
    "Black supports d5 with a solid structure and prepares to develop the kingside.",
  ),
  opening(
    "D43",
    "Semi-Slav Defense",
    "d4 d5 c4 e6 Nc3 Nf6 Nf3 c6",
    "A strong pawn triangle supports Black’s center and prepares counterplay.",
  ),
  opening(
    "D70",
    "Grünfeld Defense",
    "d4 Nf6 c4 g6 Nc3 d5",
    "Black lets White occupy the center and then attacks it with active pieces.",
  ),
  opening(
    "E00",
    "Catalan Opening",
    "d4 Nf6 c4 e6 g3",
    "White combines central space with a bishop on the long diagonal.",
  ),
  opening(
    "E12",
    "Queen’s Indian Defense",
    "d4 Nf6 c4 e6 Nf3 b6",
    "Black controls key light squares with a fianchettoed queen’s bishop.",
  ),
  opening(
    "E20",
    "Nimzo-Indian Defense",
    "d4 Nf6 c4 e6 Nc3 Bb4",
    "Black pins the knight and contests e4 with active pieces.",
  ),
  opening(
    "E60",
    "King’s Indian Defense",
    "d4 Nf6 c4 g6 Nc3 Bg7",
    "Black allows a broad White center and prepares to undermine it later.",
  ),
];

const normalizeSan = (san) =>
  String(typeof san === "string" ? san : san?.san || "")
    .replace(/[!?+#]/g, "")
    .replace(/0/g, "O");

export function getOpening(historySAN = []) {
  const moves = historySAN.map(normalizeSan);
  let match = null;
  for (const item of OPENINGS) {
    if (
      item.moves.length <= moves.length &&
      (!match || item.moves.length > match.moves.length) &&
      item.moves.every((move, index) => normalizeSan(move) === moves[index])
    )
      match = item;
  }
  return (
    match || {
      name: moves.length ? "Unclassified opening" : "Starting position",
      eco: "—",
      moves: [],
      description:
        "Control the center, develop your pieces, and bring your king to safety.",
    }
  );
}

export const openings = OPENINGS;
