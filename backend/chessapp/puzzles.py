"""Procedural, legal mate-in-one training. Unlimited requests; positions may recur."""
import hashlib
import random
import secrets
import chess
from django.core import signing

def make_puzzle():
    rng=random.SystemRandom()
    edge=[s for s in chess.SQUARES if chess.square_file(s) in (0,7) or chess.square_rank(s) in (0,7)]
    for _ in range(1200):
        board=chess.Board(None)
        black_king=rng.choice(edge)
        white_king=rng.choice([s for s in chess.SQUARES if 2<=chess.square_distance(s,black_king)<=3])
        queen=rng.choice(chess.SQUARES)
        if len({black_king,white_king,queen})<3:
            continue
        board.set_piece_at(black_king,chess.Piece(chess.KING,chess.BLACK))
        board.set_piece_at(white_king,chess.Piece(chess.KING,chess.WHITE))
        board.set_piece_at(queen,chess.Piece(chess.QUEEN,chess.WHITE))
        board.turn=chess.WHITE
        if not board.is_valid() or board.is_game_over():
            continue
        solutions=[]
        for move in list(board.legal_moves):
            board.push(move)
            if board.is_checkmate():
                solutions.append(move.uci())
            board.pop()
        if solutions:
            if rng.choice([False,True]):
                board=board.mirror()
            fen=board.fen()
            payload={'fen':fen,'nonce':secrets.token_hex(8)}
            return {'id':signing.dumps(payload,salt='knight-puzzle',compress=True), 'fen':fen,
                    'turn':'w' if board.turn else 'b','theme':'Mate in one','rating':650,
                    'title':'Finish the game','description':'Find a move that checkmates the opposing king.',
                    'generator':'Procedural king-and-queen mate training','unlimited':True}
    raise RuntimeError('Could not generate a puzzle; try again.')

def load_puzzle(puzzle_id):
    payload=signing.loads(puzzle_id,salt='knight-puzzle',max_age=86400)
    return chess.Board(payload['fen']),hashlib.sha256(payload['fen'].encode()).hexdigest()
