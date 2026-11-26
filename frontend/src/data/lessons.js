export const LEARNING_STAGES = [
  {
    id: "beginner",
    label: "Build your foundation",
    level: "Beginner",
    description:
      "Know the board, make legal moves, and finish your first games.",
  },
  {
    id: "intermediate",
    label: "See the possibilities",
    level: "Intermediate",
    description:
      "Recognize patterns, play purposeful openings, and win simple endings.",
  },
  {
    id: "advanced",
    label: "Think in plans",
    level: "Advanced",
    description:
      "Connect pawn structures, piece activity, and concrete calculation.",
  },
  {
    id: "expert",
    label: "Train with intention",
    level: "Expert",
    description:
      "Refine decision making, analyze your games, and build a training routine.",
  },
];

export const LESSONS = [
  {
    id: "meet-the-board",
    title: "Meet the chessboard",
    stage: "beginner",
    category: "Fundamentals",
    duration: 4,
    summary: "64 squares. A whole world of possibilities.",
    paragraphs: [
      "A chessboard has eight files, labeled a through h, and eight ranks, numbered 1 through 8. From White’s side, a1 is the bottom-left square. Place the board with a light square at your right-hand corner. White begins on ranks 1 and 2; Black begins on ranks 7 and 8.",
      "Each square has an address: the file letter followed by the rank number. The center squares are d4, e4, d5, and e5. Learning these coordinates makes it easier to follow lessons, read moves, and discuss a position. The queen starts on her own color: White’s queen on d1 and Black’s queen on d8.",
    ],
    takeaway:
      "Look for the file first and the rank second. A light square belongs on your right.",
    quiz: {
      question: "Which square does White’s queen occupy at the start?",
      options: ["e1", "d1", "d8", "c1"],
      correct: 1,
      explanation:
        "White’s queen starts on d1, a light square. The king starts beside her on e1.",
    },
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  },
  {
    id: "how-pieces-move",
    title: "Every piece has a purpose",
    stage: "beginner",
    category: "Fundamentals",
    duration: 7,
    summary: "Learn the movement of your six different pieces.",
    paragraphs: [
      "Rooks travel along ranks and files. Bishops travel diagonally and stay on the same color throughout the game. Queens combine rook and bishop movement. These pieces may move any distance if their path is clear, but they cannot jump over another piece. A king moves one square in any direction, provided the destination is safe.",
      "Knights move two squares along a rank or file, then one square at a right angle. A knight is the only piece that can jump over other pieces. Pawns move one square forward into an empty square, or two from their starting square if both squares are clear. They capture one square diagonally forward, never straight ahead.",
    ],
    takeaway:
      "A piece can capture an opponent on its destination square, but cannot land on a friendly piece.",
    quiz: {
      question: "Which piece can jump over other pieces?",
      options: ["Bishop", "Rook", "Knight", "Queen"],
      correct: 2,
      explanation:
        "The knight jumps. Rooks, bishops, and queens need a clear path.",
    },
  },
  {
    id: "check-and-mate",
    title: "Check, checkmate, and safety",
    stage: "beginner",
    category: "Fundamentals",
    duration: 6,
    summary: "The goal is to trap the king, not capture it.",
    paragraphs: [
      "A king is in check when an enemy piece attacks its square. You must answer the check immediately. You can move the king to safety, capture the attacking piece, or block the attack. Blocking only works against a rook, bishop, or queen attacking from a distance. A king can never move into check or remain in check after your move.",
      "Checkmate occurs when the king is in check and no legal move removes that check. The game ends at once. Before calling a move mate, inspect every safe king square, every possible capture of the attacker, and every possible block. A double check can only be answered by a king move.",
    ],
    takeaway:
      "When you are in check, stop your own plan and make your king safe first.",
    quiz: {
      question: "Can you ignore a check to capture the opponent’s queen?",
      options: [
        "Always",
        "Only if you are ahead",
        "Only if the capture also ends the check",
        "Only with a pawn",
      ],
      correct: 2,
      explanation:
        "Every legal response must remove the check. Winning a queen does not override king safety.",
    },
  },
  {
    id: "special-moves",
    title: "Castling, promotion, en passant",
    stage: "beginner",
    category: "Fundamentals",
    duration: 8,
    summary: "Three special rules that change the position.",
    paragraphs: [
      "Castling moves your king two squares toward a rook and places that rook on the square the king crossed. The king and that rook must not have moved, the squares between them must be empty, and the king cannot be in check, cross an attacked square, or land on an attacked square. An attacked rook does not itself prevent castling.",
      "When a pawn reaches the last rank, it must become a queen, rook, bishop, or knight. It can promote even if you still have your original queen. En passant is a special pawn capture: immediately after an opposing pawn advances two squares from its starting square beside your pawn, you may capture it as though it advanced only one. If you make another move, that opportunity disappears.",
    ],
    takeaway:
      "Castle before your king becomes a target. Always check for promotion and en passant opportunities.",
    quiz: {
      question: "When is an en passant capture available?",
      options: [
        "At any later point",
        "Only immediately after the relevant two-square pawn move",
        "Only when the king is in check",
        "Only on the first move",
      ],
      correct: 1,
      explanation:
        "En passant must be played immediately on the next move or the right is lost.",
    },
  },
  {
    id: "draws-and-time",
    title: "Draws and the chess clock",
    stage: "beginner",
    category: "Fundamentals",
    duration: 5,
    summary: "Understand how a game can end without mate.",
    paragraphs: [
      "Stalemate is a draw: the player to move has no legal moves, but their king is not in check. Draws can also occur by agreement, an insufficient mating position, or repeated positions. Under standard rules a threefold repetition or 50 moves by each side without a pawn move or capture can be claimed; fivefold repetition and 75 moves trigger automatic draws, with checkmate taking precedence on the final move.",
      "Each player has their own clock. Your time runs while it is your turn, and completing your move starts your opponent’s clock. When your time expires, you generally lose; the game is drawn if the opponent cannot possibly checkmate by any legal sequence. Platform implementations may differ in how they detect that exception. Choose a slower time control while you learn so you can check each move.",
    ],
    takeaway:
      "A king with no legal squares is not automatically mated. First ask: is it in check?",
    quiz: {
      question:
        "Your opponent has no legal moves and is not in check. What is the result?",
      options: ["You win", "You lose", "Stalemate: a draw", "They must pass"],
      correct: 2,
      explanation:
        "No legal move without check is stalemate, so neither player wins.",
    },
  },
  {
    id: "piece-values",
    title: "Keep your pieces safe",
    stage: "beginner",
    category: "Fundamentals",
    duration: 5,
    summary: "Use material values and a quick safety scan.",
    paragraphs: [
      "A useful beginner scale is pawn = 1, knight = 3, bishop = 3, rook = 5, and queen = 9. These values are a guide, not a law: an active piece can be worth much more than a trapped one. Kings have no trade value because king safety decides the game.",
      "Before moving, ask what your opponent’s last move threatens. Then inspect checks, captures, and attacks for both sides. When you plan a capture, count defenders and calculate the exchange sequence rather than stopping after the first capture. A defended piece can still be lost if the defender is pinned or overloaded.",
    ],
    takeaway:
      "After choosing a move, pause once: what can my opponent capture?",
    quiz: {
      question:
        "Ignoring position, trading a rook for an unprotected knight usually loses how much material?",
      options: ["1 point", "2 points", "3 points", "No material"],
      correct: 1,
      explanation:
        "A rook is roughly 5 and a knight roughly 3, so the exchange costs about 2 points.",
    },
  },
  {
    id: "opening-principles",
    title: "A confident first ten moves",
    stage: "beginner",
    category: "Openings",
    duration: 6,
    summary: "Center, development, king safety: your opening compass.",
    paragraphs: [
      "In the opening, fight for the center, develop your knights and bishops, and make your king safe. Central pawns and active minor pieces give you space and help you move from one side of the board to the other. Developing usually means bringing a piece from its starting square to a useful square where it influences the center.",
      "Avoid moving the same piece repeatedly without a clear reason. Do not chase small pawn gains while your opponent develops freely. An early queen can become a target for developing moves. Castling often connects your plans by protecting the king and bringing a rook closer to the center. Concrete threats always take priority over general principles.",
    ],
    takeaway: "Ask what each opening move develops, controls, or protects.",
    quiz: {
      question: "Which is usually the best early-opening priority?",
      options: [
        "Move every edge pawn",
        "Bring the queen out alone",
        "Develop pieces and secure the king",
        "Move one knight five times",
      ],
      correct: 2,
      explanation:
        "Development and king safety prepare your whole army to work together.",
    },
  },
  {
    id: "reading-notation",
    title: "Read and replay a game",
    stage: "beginner",
    category: "Fundamentals",
    duration: 5,
    summary: "Turn move notation into a story you can follow.",
    paragraphs: [
      "Algebraic notation identifies pieces with K, Q, R, B, and N. Pawns have no letter. Nf3 means a knight moves to f3; exd5 means the pawn from the e-file captures on d5. A plus sign marks check and a hash marks checkmate. O-O is kingside castling and O-O-O is queenside castling.",
      "When two identical pieces could move to the same square, notation adds the origin file or rank, such as Nbd2. Promotion is written e8=Q, with the chosen piece after the equals sign. Replaying games slowly helps you connect notation with board patterns. At every move, ask what changed: an attack, a defended square, an open line, or a new weakness.",
    ],
    takeaway:
      "Notation records the destination. Captures use x, checks use +, and mate uses #.",
    quiz: {
      question: "What does Nf3 mean?",
      options: [
        "A pawn captures on f3",
        "A knight moves to f3",
        "A king moves to f3",
        "White castles",
      ],
      correct: 1,
      explanation: "N represents a knight. The destination square is f3.",
    },
  },
  {
    id: "forks",
    title: "One move, two threats",
    stage: "intermediate",
    category: "Tactics",
    duration: 6,
    summary: "Find forks with knights, pawns, and queens.",
    paragraphs: [
      "A fork attacks two or more targets with one move. A knight is especially good at forks because its unusual movement can attack a king and queen without being attacked by either. Pawns can fork two pieces on adjacent diagonals; queens create forks over long distances.",
      "Look for undefended pieces, exposed kings, and valuable pieces placed on the same color as a knight’s future landing square. A checking fork is forcing because the opponent must answer the check. Before playing a fork, verify that your attacking piece cannot simply be captured and that both targets are worth attacking.",
    ],
    takeaway:
      "Checks narrow the opponent’s replies. Look for a fork that arrives with check.",
    quiz: {
      question: "Why is a fork that checks the king especially strong?",
      options: [
        "The king can be captured",
        "The opponent must answer the check first",
        "Knights become queens",
        "It always forces checkmate",
      ],
      correct: 1,
      explanation:
        "Answering the check often leaves the second target available to capture.",
    },
  },
  {
    id: "pins-skewers",
    title: "Pins and skewers",
    stage: "intermediate",
    category: "Tactics",
    duration: 6,
    summary: "Use straight lines to make pieces vulnerable.",
    paragraphs: [
      "A pin places a piece in front of a more valuable target along a rook, bishop, or queen’s line. An absolute pin is against the king: the pinned piece cannot legally move if doing so exposes check. A relative pin is against another valuable piece; the pinned piece may move, but at a possible material cost.",
      "A skewer reverses the arrangement: the more valuable piece stands in front and must move, exposing the target behind it. Once you identify a pin, consider adding attackers or attacking the pinned piece with a pawn. Do not assume every pinned piece is helpless: it may move along the pin line, capture the attacker, or create a stronger threat.",
    ],
    takeaway:
      "In a pin the valuable target is behind; in a skewer it is in front.",
    quiz: {
      question: "What makes a pin absolute?",
      options: [
        "The pinned piece is a queen",
        "Moving the pinned piece would expose its king to check",
        "The attacker is a bishop",
        "It wins immediately",
      ],
      correct: 1,
      explanation: "A piece cannot legally expose its own king to check.",
    },
  },
  {
    id: "discovered-attacks",
    title: "Reveal a hidden attack",
    stage: "intermediate",
    category: "Tactics",
    duration: 6,
    summary: "Move one piece to unleash another.",
    paragraphs: [
      "A discovered attack happens when a piece moves out of the way of a rook, bishop, or queen, revealing an attack behind it. The moving piece can create a second threat of its own. This is especially powerful when the revealed attack is a check, because the opponent must respond to the king’s danger.",
      "A double check attacks the king with two pieces at once. The defending side must move its king, because a single capture or block cannot resolve both checks. To spot these patterns, inspect lines between your long-range pieces and the enemy king or queen, then imagine the blocking piece moving to an active square.",
    ],
    takeaway:
      "Look through your own pieces: what line would open if one moved?",
    quiz: {
      question: "How must a player answer a double check?",
      options: [
        "Block either line",
        "Move the king to a safe square",
        "Capture any pawn",
        "Offer a draw",
      ],
      correct: 1,
      explanation: "Only a king move can answer both checks simultaneously.",
    },
  },
  {
    id: "mating-patterns",
    title: "Build a mating net",
    stage: "intermediate",
    category: "Tactics",
    duration: 8,
    summary: "Recognize back-rank mates and coordinated attacks.",
    paragraphs: [
      "A back-rank mate often occurs when a king is trapped behind its own pawns and a rook or queen enters the last rank. A small pawn move may create a flight square, but only if that square is safe. Other common patterns use a queen supported by a bishop or knight to cover the king’s escape squares.",
      "Think of checkmate as a net: one piece gives check while other pieces, pawns, or the edge of the board remove escape squares. Count the king’s legal destinations before calculating sacrifices. A forcing sequence of checks is useful only when you have verified every defensive reply, including captures and interpositions.",
    ],
    takeaway: "Do not just attack the king. Take away its safe squares.",
    quiz: {
      question: "Why can a king’s own pawns help create a back-rank mate?",
      options: [
        "They defend the attacking rook",
        "They block the king’s escape squares",
        "They must promote",
        "They give check",
      ],
      correct: 1,
      explanation:
        "The king can be trapped by its own pawn shield when a rook or queen attacks the back rank.",
    },
  },
  {
    id: "italian-game",
    title: "The Italian Game",
    stage: "intermediate",
    category: "Openings",
    duration: 7,
    summary: "Develop naturally after 1.e4 e5 2.Nf3 Nc6 3.Bc4.",
    paragraphs: [
      "The Italian Game begins 1.e4 e5 2.Nf3 Nc6 3.Bc4. White develops quickly, attacks the center, and points the bishop toward f7. Black can respond with 3...Bc5, developing symmetrically, or 3...Nf6, entering the Two Knights Defense. Both sides should watch tactical threats rather than treating the opening as a fixed script.",
      "A quiet plan with d3, c3, castling, and Re1 prepares a later d4 break. The c3 pawn supports d4, while the rook supports the central e-pawn. Keep the c4 bishop’s retreat squares available and avoid launching a kingside attack before your pieces are ready. If the center opens, development and king safety become even more urgent.",
    ],
    takeaway:
      "Develop first; prepare the central d4 break with your whole position.",
    quiz: {
      question: "Which move defines the Italian Game after 1.e4 e5 2.Nf3 Nc6?",
      options: ["3.Bb5", "3.Bc4", "3.d4", "3.f4"],
      correct: 1,
      explanation: "3.Bc4 starts the Italian. 3.Bb5 is the Ruy Lopez.",
    },
  },
  {
    id: "queens-gambit",
    title: "The Queen’s Gambit",
    stage: "intermediate",
    category: "Openings",
    duration: 7,
    summary: "Challenge the center with 1.d4 d5 2.c4.",
    paragraphs: [
      "The Queen’s Gambit begins 1.d4 d5 2.c4. White offers the c-pawn to challenge Black’s central d-pawn. After 2...dxc4, White can often recover the pawn while building a strong center. Black does not need to cling to the extra pawn if doing so creates weaknesses or falls behind in development.",
      "In the Queen’s Gambit Declined, Black supports d5 with ...e6. White develops with Nc3 and Nf3 and often prepares pressure on the center. Black looks for freeing breaks such as ...c5 or ...e5. Learn the pawn structures and typical breaks before memorizing long variations; the same plans appear in many different move orders.",
    ],
    takeaway:
      "The purpose of c4 is to challenge central control, not simply to lose a pawn.",
    quiz: {
      question: "What does 2.c4 primarily challenge in the Queen’s Gambit?",
      options: [
        "Black’s d5 pawn and central control",
        "Black’s h8 rook",
        "White’s king",
        "Black’s a7 pawn",
      ],
      correct: 0,
      explanation:
        "The c-pawn attacks d5 and tries to weaken Black’s hold on the center.",
    },
  },
  {
    id: "defense-toolkit",
    title: "A defense against 1.e4",
    stage: "intermediate",
    category: "Openings",
    duration: 8,
    summary: "Understand the Sicilian, French, and Caro-Kann.",
    paragraphs: [
      "After 1.e4, the Sicilian Defense begins 1...c5 and contests d4 asymmetrically. The French Defense begins 1...e6, usually followed by ...d5; its locked central structures make pawn breaks crucial. The Caro-Kann begins 1...c6, also preparing ...d5 while often allowing Black’s light-squared bishop to develop outside the pawn chain.",
      "Choose one defense to study in depth. Learn its central pawn breaks, piece placements, and common tactical dangers. In the French, ...c5 often attacks White’s d4 pawn; in the Caro-Kann, timely ...c5 or ...e5 can free Black’s position. In the Sicilian, development and control of d5 matter, but plans vary widely by variation.",
    ],
    takeaway:
      "A defense is a family of plans. Start with one structure you understand.",
    quiz: {
      question: "Which first move defines the Caro-Kann Defense?",
      options: ["1...c5", "1...e6", "1...c6", "1...g6"],
      correct: 2,
      explanation: "1.e4 c6 is the Caro-Kann. Black usually prepares ...d5.",
    },
  },
  {
    id: "king-pawn-endings",
    title: "The king becomes a fighter",
    stage: "intermediate",
    category: "Endgames",
    duration: 8,
    summary: "Activate the king and understand opposition.",
    paragraphs: [
      "With queens and most pieces gone, the king becomes a powerful attacking piece. Bring it toward passed pawns and important entry squares. A passed pawn has no opposing pawn on its file or adjacent files that can stop it from the front. Supporting it with your king is often more important than pushing it immediately.",
      "Opposition occurs when kings face each other with one square between them. Because kings cannot approach adjacent squares, the side to move may have to yield ground. Opposition is a tool for reaching useful squares, not a goal by itself. Before trading into a pawn ending, calculate king activity, pawn races, and whether the remaining position is actually winning.",
    ],
    takeaway:
      "In the endgame, improve the king before automatically pushing a pawn.",
    quiz: {
      question: "Why is an active king so valuable in a pawn ending?",
      options: [
        "It can move twice",
        "It supports promotion and attacks pawns",
        "It may move into check",
        "It becomes a queen",
      ],
      correct: 1,
      explanation:
        "With fewer pieces to threaten it, the king can escort passed pawns and capture enemy pawns.",
    },
  },
  {
    id: "basic-checkmates",
    title: "Finish with king and rook",
    stage: "intermediate",
    category: "Endgames",
    duration: 7,
    summary: "Use a shrinking box to checkmate safely.",
    paragraphs: [
      "A king and rook can checkmate a lone king by pushing it toward the edge. Use the rook to cut off a rank or file, creating a box. Bring your king closer to support the rook and take away squares. Do not give endless checks without improving the position; the goal is to make the box smaller.",
      "Keep the rook far enough from the defending king that it cannot be captured. When your king controls the escape squares in front of the enemy king on the edge, a rook check along that edge can deliver mate. With a queen, the same restriction method works, but watch carefully for stalemate when the defending king has very few squares.",
    ],
    takeaway: "Restrict, approach, and only then deliver the finishing check.",
    quiz: {
      question: "What is a useful plan with king and rook against a lone king?",
      options: [
        "Give random checks forever",
        "Cut off the king and bring your own king closer",
        "Sacrifice the rook",
        "Keep your king in the corner",
      ],
      correct: 1,
      explanation:
        "The rook restricts the defending king while your king helps drive it to the edge.",
    },
  },
  {
    id: "candidate-moves",
    title: "Calculate with candidate moves",
    stage: "advanced",
    category: "Calculation",
    duration: 9,
    summary: "Organize your thinking before calculating deeper.",
    paragraphs: [
      "Start by identifying the opponent’s threat and evaluating king safety, material, activity, and pawn structure. Then choose a small set of candidate moves. Forcing moves—checks, captures, and direct threats—deserve early attention because they restrict replies. Quiet improving moves belong on your list when no forcing continuation works.",
      "Calculate each candidate against the opponent’s strongest reply, not the reply you hope to see. Continue until the position becomes stable enough to evaluate. Avoid repeatedly switching between lines without finishing them. Before committing, run a final blunder check for unexpected checks, captures, and tactical resources in the resulting position.",
    ],
    takeaway:
      "Find candidates, test the strongest defense, and compare the final positions.",
    quiz: {
      question: "Which opponent reply should you use to test a candidate?",
      options: [
        "The weakest legal move",
        "The most convenient reply",
        "The strongest plausible defense",
        "Only captures",
      ],
      correct: 2,
      explanation:
        "Sound calculation assumes the opponent will find their best available response.",
    },
  },
  {
    id: "pawn-structures",
    title: "Read the pawn structure",
    stage: "advanced",
    category: "Strategy",
    duration: 9,
    summary: "Let the pawns tell you where to play.",
    paragraphs: [
      "Pawn moves are irreversible. A pawn chain points toward a region where you may gain space, while its base can become a target. Isolated pawns have no friendly pawns on neighboring files; doubled pawns share a file; backward pawns struggle to advance safely. These features are not automatic weaknesses: activity and open lines may compensate for them.",
      "Identify pawn breaks that challenge the opponent’s structure. In a closed center, a timely break can open a file for rooks or a diagonal for bishops. In an open position, development and king safety usually demand immediate attention. Choose piece placements that support the break you want to play rather than making unrelated moves.",
    ],
    takeaway: "A plan should name a useful square, a target, or a pawn break.",
    quiz: {
      question: "What is a pawn break?",
      options: [
        "Any pawn capture",
        "A pawn move that challenges the opposing structure to open lines or change the center",
        "A pawn promotion only",
        "A move that loses a pawn",
      ],
      correct: 1,
      explanation:
        "A pawn break creates contact with enemy pawns and can transform the position.",
    },
  },
  {
    id: "weak-squares",
    title: "Outposts and weak squares",
    stage: "advanced",
    category: "Strategy",
    duration: 7,
    summary: "Give your pieces a square they can call home.",
    paragraphs: [
      "A weak square cannot easily be defended by a pawn. An outpost is a useful square, often in enemy territory, where a piece can be supported and resist pawn attacks. Knights thrive on central outposts because they can attack in several directions without needing open lines.",
      "An outpost matters only if it influences the game. A beautiful knight on the edge may have no targets. Compare the piece’s activity with the opponent’s alternatives, and consider whether a favorable exchange would remove your advantage. Creating an outpost can require provoking a pawn advance, exchanging its defender, or fixing pawns on one color.",
    ],
    takeaway:
      "A strong square is valuable because of what your piece can do from it.",
    quiz: {
      question: "Why is a protected central knight outpost often strong?",
      options: [
        "Knights can no longer be captured",
        "It gives stable access to important squares and targets",
        "It changes how the knight moves",
        "It wins by rule",
      ],
      correct: 1,
      explanation:
        "A secure central knight can influence many key squares and be difficult to challenge with pawns.",
    },
  },
  {
    id: "open-files",
    title: "Rooks belong on useful files",
    stage: "advanced",
    category: "Strategy",
    duration: 7,
    summary: "Turn open lines into real targets.",
    paragraphs: [
      "An open file contains no pawns; a half-open file contains no friendly pawn but does contain an enemy pawn. Rooks often use these files to attack pawns or enter the opponent’s position. Doubling rooks can increase pressure, but it takes time and should serve a concrete purpose.",
      "Before claiming an open file, identify an entry square. If the opponent controls every invasion square, the file may offer little. A rook on the seventh rank can attack pawns and restrict the king, especially when the enemy king is trapped on the back rank. Coordinate rooks with minor pieces so entry squares are protected.",
    ],
    takeaway:
      "Do not occupy a file just because it is open. Find the square you want to enter.",
    quiz: {
      question:
        "What should you look for before doubling rooks on an open file?",
      options: [
        "An invasion square or a concrete target",
        "A way to move the queen backward",
        "The board’s color",
        "Only the move number",
      ],
      correct: 0,
      explanation:
        "Control of a file matters when it lets your rooks penetrate or attack something useful.",
    },
  },
  {
    id: "ruy-lopez",
    title: "Plans in the Ruy Lopez",
    stage: "advanced",
    category: "Openings",
    duration: 9,
    summary: "Understand the pressure after 3.Bb5.",
    paragraphs: [
      "The Ruy Lopez begins 1.e4 e5 2.Nf3 Nc6 3.Bb5. White pressures the knight that defends e5, but capturing on c6 does not automatically win the e-pawn because Black often has tactical ways to recover material. The opening is rich in maneuvering and central tension.",
      "In many closed variations, White prepares c3 and d4, repositions a knight through d2 and f1 toward g3 or e3, and maintains the light-squared bishop. Black seeks counterplay through ...d5 or queenside expansion. These are recurring ideas, not mandatory moves: the exact position determines whether a central break is ready.",
    ],
    takeaway:
      "Preserve useful tension until your pieces are ready for the center to open.",
    quiz: {
      question: "Which move distinguishes the Ruy Lopez from the Italian Game?",
      options: ["3.Bc4", "3.Bb5", "3.Nc3", "3.d3"],
      correct: 1,
      explanation:
        "The Ruy Lopez starts with 3.Bb5, putting pressure on the c6 knight.",
    },
  },
  {
    id: "defenses-to-d4",
    title: "A defense against 1.d4",
    stage: "advanced",
    category: "Openings",
    duration: 9,
    summary: "Compare solid centers and dynamic counterplay.",
    paragraphs: [
      "Against 1.d4, ...d5 contests the center immediately. The Slav structure with ...c6 supports d5 while keeping the light-squared bishop’s diagonal available. The Queen’s Gambit Declined with ...e6 builds a solid center but requires a plan to develop that bishop and achieve a freeing pawn break.",
      "Indian defenses often begin ...Nf6. The King’s Indian develops with ...g6 and ...Bg7, allowing White a broad center before attacking it with ...e5 or ...c5. The Nimzo-Indian uses ...Bb4 against a knight on c3 and combines pressure with flexible central play. Choose based on the structures you want to understand, and study model games for both sides.",
    ],
    takeaway:
      "Every defense needs a plan for challenging the opponent’s central pawns.",
    quiz: {
      question: "What is a common King’s Indian idea?",
      options: [
        "Never challenge White’s center",
        "Allow a center, then attack it with a pawn break",
        "Trade every piece immediately",
        "Move only flank pawns",
      ],
      correct: 1,
      explanation:
        "Black often permits a broad White center and later challenges it with ...e5 or ...c5.",
    },
  },
  {
    id: "rook-endgames",
    title: "Active rooks win endings",
    stage: "advanced",
    category: "Endgames",
    duration: 9,
    summary: "Activity, passed pawns, and cutting off the king.",
    paragraphs: [
      "Rook endings reward activity. A passive rook tied to defending pawns may allow the opposing king to invade. An active rook can give checks from a distance, attack pawns, and cut off the enemy king. The familiar guideline of placing rooks behind passed pawns is useful, but concrete tactics and king position can override it.",
      "Learn basic theoretical positions such as Lucena, where the stronger side builds a bridge to shelter the king from checks, and Philidor, where the defender prevents the king from advancing before switching to checking from behind. Start with the exact piece placement and side to move, then practice both sides until you understand why the technique works.",
    ],
    takeaway:
      "Seek active defense. A rook that can check and attack is harder to defeat.",
    quiz: {
      question:
        "What is often more valuable than passively protecting every pawn in a rook ending?",
      options: [
        "Rook activity and counterplay",
        "Keeping the rook in a corner",
        "Avoiding all checks",
        "Moving the rook once only",
      ],
      correct: 0,
      explanation:
        "An active rook can create threats and prevent the opponent from making progress.",
    },
  },
  {
    id: "prophylaxis",
    title: "Ask what your opponent wants",
    stage: "expert",
    category: "Strategy",
    duration: 8,
    summary: "Improve your plans by understanding theirs.",
    paragraphs: [
      "Prophylaxis means anticipating and limiting the opponent’s useful plans. Before your move, ask what they would play if given another turn. They may want a pawn break, an exchange, a key square, or a tactical attack. A small preventive move can make your own plan easier to execute.",
      "Prevention is valuable only when it addresses a real idea. Do not spend every move stopping harmless possibilities while your own pieces remain passive. The strongest moves often do two jobs: they improve your position and reduce the opponent’s counterplay. Evaluate the cost of prevention in time, space, or weakened squares.",
    ],
    takeaway:
      "Make a plan for both sides before selecting a move for your side.",
    quiz: {
      question: "Which question best supports prophylactic thinking?",
      options: [
        "What would my opponent like to do next?",
        "How can I move the queen every turn?",
        "Which move looks most dramatic?",
        "How many moves remain?",
      ],
      correct: 0,
      explanation:
        "Understanding the opponent’s plan lets you prevent or prepare for their most useful ideas.",
    },
  },
  {
    id: "positional-sacrifices",
    title: "Evaluate compensation",
    stage: "expert",
    category: "Strategy",
    duration: 10,
    summary: "When activity can matter more than material.",
    paragraphs: [
      "A positional sacrifice gives material for lasting advantages rather than an immediate forced win. Compensation may include a safer king, dominant squares, a powerful passed pawn, or a long-term initiative. These benefits must be concrete enough to survive the opponent’s best defensive plan.",
      "Before sacrificing, ask which advantage you obtain, how long it lasts, and whether the opponent can return material to neutralize it. Compare the position with a simpler alternative. Avoid justifying a sacrifice with vague activity when you cannot identify useful follow-up moves. Study master examples, then analyze your own decisions without an engine before checking them.",
    ],
    takeaway:
      "Name the compensation and test how the opponent could reduce it.",
    quiz: {
      question:
        "Which is the strongest justification for a positional sacrifice?",
      options: [
        "It looks exciting",
        "The opponent will probably panic",
        "Durable, concrete advantages that withstand best defense",
        "Sacrifices always improve a position",
      ],
      correct: 2,
      explanation:
        "A sound sacrifice needs specific compensation, not merely hope or visual appeal.",
    },
  },
  {
    id: "defensive-resources",
    title: "Defend with imagination",
    stage: "expert",
    category: "Calculation",
    duration: 9,
    summary: "Find counterplay, exchanges, and unexpected escapes.",
    paragraphs: [
      "When under pressure, identify the actual threat before reacting. Look for active defense: checks, counterattacks, exchanges of key attackers, or a timely material return. A king may need to leave its shelter if the familiar squares are more dangerous. Do not assume the opponent’s attack is sound because it looks frightening.",
      "Search for forcing resources at the end of variations. Zwischenzugs—intermediate moves before an expected recapture—can change the outcome. In difficult endings, stalemate ideas, fortress structures, and perpetual checks may offer drawing chances. Defend the position in front of you, and make the opponent prove their advantage with accurate moves.",
    ],
    takeaway:
      "A defensive move can create a threat. Check your forcing options first.",
    quiz: {
      question: "What is a zwischenzug?",
      options: [
        "An automatic recapture",
        "An intermediate move before an expected response",
        "A type of castling",
        "A draw offer",
      ],
      correct: 1,
      explanation:
        "A zwischenzug inserts a useful move—often a check or threat—before the expected continuation.",
    },
  },
  {
    id: "practical-decisions",
    title: "Make better decisions on the clock",
    stage: "expert",
    category: "Calculation",
    duration: 8,
    summary: "Spend your thinking time where it changes the game.",
    paragraphs: [
      "Not every position deserves the same amount of time. Spend more when the pawn structure may change, a sacrifice is possible, a forced sequence begins, or you must choose an endgame. In familiar positions with several reasonable moves, avoid using most of your clock to find a tiny improvement.",
      "Use a repeatable thinking routine: understand the last move, identify threats, choose candidates, calculate, and check your intended move. When low on time, simplify the routine without abandoning king safety. Review your time usage after the game: a mistake on move 35 may have started with excessive thinking on move 12.",
    ],
    takeaway:
      "Save time in routine positions so you can invest it at critical moments.",
    quiz: {
      question: "Which moment usually deserves extra calculation?",
      options: [
        "A forced recapture with no alternatives",
        "A decision that changes the pawn structure or enters an ending",
        "Every move equally",
        "Only the first move",
      ],
      correct: 1,
      explanation:
        "Irreversible decisions and transitions can determine the rest of the game.",
    },
  },
  {
    id: "analyze-your-games",
    title: "Turn every game into a lesson",
    stage: "expert",
    category: "Calculation",
    duration: 10,
    summary: "Build a useful review habit before asking an engine.",
    paragraphs: [
      "Start your review without an engine. Mark where you felt uncertain, what candidate moves you considered, and what you believed the opponent threatened. Find the first moment your plan became difficult, not just the final blunder. Write down a better plan and calculate a few alternatives yourself.",
      "Then compare your analysis with an engine or a stronger player. An evaluation number tells you the result of best play, but you still need to understand the idea. Classify recurring mistakes: missed tactics, poor piece placement, opening misunderstandings, endgame technique, or time management. Choose one pattern to train next rather than trying to fix everything at once.",
    ],
    takeaway: "A useful review ends with one clear training action.",
    quiz: {
      question: "What is the best first step in reviewing your own game?",
      options: [
        "Memorize the engine’s top line immediately",
        "Analyze your decisions and uncertainties without assistance",
        "Look only at the final move",
        "Delete every loss",
      ],
      correct: 1,
      explanation:
        "Independent analysis reveals how you think and makes later engine feedback more meaningful.",
    },
  },
  {
    id: "training-plan",
    title: "Build your long-term training plan",
    stage: "expert",
    category: "Strategy",
    duration: 8,
    summary: "A consistent practice loop for continued improvement.",
    paragraphs: [
      "Combine thoughtful games, tactical practice, endgame study, and analysis. A manageable session might include a few carefully calculated puzzles, one endgame position, and a review of a recent game. Playing slower games gives you time to practice the thinking habits you want to develop.",
      "Track useful behaviors rather than only rating: did you check the opponent’s threats, calculate before moving, and review your mistakes? Revisit material with spaced repetition, and gradually increase difficulty. Advanced mastery requires years of sustained work and often feedback from a qualified coach; completing a course is a foundation for that work, not a title or guarantee.",
    ],
    takeaway: "Play, reflect, train one weakness, and repeat consistently.",
    quiz: {
      question: "Which routine is most likely to support lasting improvement?",
      options: [
        "Only play faster games",
        "Memorize openings without understanding them",
        "Combine practice, analysis, and focused study consistently",
        "Change your entire repertoire after every loss",
      ],
      correct: 2,
      explanation:
        "Balanced, reflective practice builds skills that transfer into your games.",
    },
  },
].map((lesson, index) => ({
  ...lesson,
  index,
  level: LEARNING_STAGES.find((stage) => stage.id === lesson.stage).level,
}));

export const lessons = LESSONS;
