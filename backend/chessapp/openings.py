OPENINGS = [
    ('B00','King’s Pawn Opening','e4','Claim the center and open lines for the bishop and queen.'),
    ('A40','Queen’s Pawn Opening','d4','Control the center with the queen’s pawn.'),
    ('A10','English Opening','c4','Control d5 from the flank.'),
    ('A04','Réti Opening','Nf3','Develop before committing the center pawns.'),
    ('B20','Sicilian Defense','e4 c5','Black fights for the center with an asymmetrical pawn structure.'),
    ('B10','Caro–Kann Defense','e4 c6','Prepare d5 with a solid pawn structure.'),
    ('C00','French Defense','e4 e6','Prepare d5 and challenge the white center.'),
    ('B01','Scandinavian Defense','e4 d5','Black immediately challenges e4.'),
    ('B07','Pirc Defense','e4 d6 d4 Nf6','Black invites a broad center and plans to undermine it.'),
    ('B06','Modern Defense','e4 g6','Develop the bishop on g7 before committing the center.'),
    ('C20','Open Game','e4 e5','Both sides occupy the center.'),
    ('C40','King’s Knight Opening','e4 e5 Nf3','White develops with an attack on e5.'),
    ('C30','King’s Gambit','e4 e5 f4','White offers a pawn for open lines and initiative.'),
    ('C21','Danish Gambit','e4 e5 d4 exd4 c3','White offers pawns for rapid development.'),
    ('C42','Petrov Defense','e4 e5 Nf3 Nf6','Black counters by attacking the e4 pawn.'),
    ('C41','Philidor Defense','e4 e5 Nf3 d6','Black reinforces the e5 pawn.'),
    ('C50','Italian Game','e4 e5 Nf3 Nc6 Bc4','The bishop eyes the vulnerable f7 square.'),
    ('C50','Giuoco Piano','e4 e5 Nf3 Nc6 Bc4 Bc5','Both bishops develop to active diagonals.'),
    ('C55','Two Knights Defense','e4 e5 Nf3 Nc6 Bc4 Nf6','Black develops quickly and attacks e4.'),
    ('C60','Ruy Lopez','e4 e5 Nf3 Nc6 Bb5','White pressures the defender of e5.'),
    ('C60','Ruy Lopez: Morphy Defense','e4 e5 Nf3 Nc6 Bb5 a6','Black asks the bishop to decide its intentions.'),
    ('C45','Scotch Game','e4 e5 Nf3 Nc6 d4','White opens the center early.'),
    ('C47','Four Knights Game','e4 e5 Nf3 Nc6 Nc3 Nf6','Both players develop their knights naturally.'),
    ('B90','Sicilian: Najdorf Variation','e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6','A flexible Sicilian system controlling b5.'),
    ('B70','Sicilian: Dragon Variation','e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6','The dark-squared bishop is fianchettoed on g7.'),
    ('D00','Closed Game','d4 d5','Both sides establish a queen’s-pawn center.'),
    ('D06','Queen’s Gambit','d4 d5 c4','White challenges Black’s central d5 pawn.'),
    ('D30','Queen’s Gambit Declined','d4 d5 c4 e6','Black reinforces the center.'),
    ('D20','Queen’s Gambit Accepted','d4 d5 c4 dxc4','Black accepts the wing pawn and allows central play.'),
    ('D10','Slav Defense','d4 d5 c4 c6','Black supports d5 while keeping the light bishop free.'),
    ('D02','London System','d4 d5 Nf3 Nf6 Bf4','White develops the queen’s bishop outside the pawn chain.'),
    ('A45','Indian Defense','d4 Nf6','Black develops first and keeps central options open.'),
    ('E60','King’s Indian Defense','d4 Nf6 c4 g6 Nc3 Bg7 e4 d6','Black builds a flexible kingside fianchetto.'),
    ('E20','Nimzo-Indian Defense','d4 Nf6 c4 e6 Nc3 Bb4','Black pins the knight and contests e4.'),
    ('A80','Dutch Defense','d4 f5','Black controls e4 and seeks kingside space.'),
]

def identify_opening(moves):
    sans = [m['san'] if isinstance(m,dict) else m for m in moves]
    result = {'eco':None,'name':'Starting position' if not sans else 'Unclassified opening','description':'Develop pieces, contest the center, and protect your king.'}
    length = 0
    for eco,name,line,description in OPENINGS:
        sequence = line.split()
        if len(sequence)>length and sans[:len(sequence)]==sequence:
            result = {'eco':eco,'name':name,'description':description}
            length = len(sequence)
    return result
