"""Local engine integration. Stockfish is bundled in Docker; fallback is clearly labeled."""
import math
import random
from pathlib import Path
import chess
import chess.engine
from django.conf import settings

BOT_NAMES = ['Magnus Carlsen', 'Hikaru Nakamura', 'Viswanathan Anand', 'Garry Kasparov', 'Judit Polgar']
VALUES = {chess.PAWN:100, chess.KNIGHT:320, chess.BISHOP:330, chess.ROOK:500, chess.QUEEN:900, chess.KING:0}

def open_engine():
    if Path(settings.STOCKFISH_PATH).is_file():
        engine = chess.engine.SimpleEngine.popen_uci(settings.STOCKFISH_PATH, timeout=8)
        engine.configure({'Threads': 1, 'Hash': 32})
        return engine
    return None

def evaluate(board):
    if board.is_checkmate():
        return -10000 if board.turn == chess.WHITE else 10000
    if board.is_game_over():
        return 0
    score = 0
    for square, piece in board.piece_map().items():
        # Small development/centralization bonus makes the fallback useful, but not master strength.
        center = 3.5 - abs(3.5 - chess.square_file(square)) + 3.5 - abs(3.5 - chess.square_rank(square))
        advance = chess.square_rank(square) if piece.color else 7 - chess.square_rank(square)
        positional = center * (8 if piece.piece_type in (chess.KNIGHT,chess.BISHOP) else 2)
        if piece.piece_type == chess.PAWN:
            positional += advance * 5
        score += (VALUES[piece.piece_type]+positional) * (1 if piece.color else -1)
    return round(score)

def ordered_moves(board):
    return sorted(board.legal_moves, key=lambda m: (bool(m.promotion), board.is_capture(m), board.gives_check(m)), reverse=True)

def negamax(board, depth, alpha=-100000, beta=100000):
    if depth == 0 or board.is_game_over():
        return evaluate(board) * (1 if board.turn else -1)
    best = -100000
    for move in ordered_moves(board):
        board.push(move)
        score = -negamax(board, depth-1, -beta, -alpha)
        board.pop()
        best = max(best, score)
        alpha = max(alpha, score)
        if alpha >= beta:
            break
    return best

def fallback_move(board, level):
    moves = list(board.legal_moves)
    if not moves:
        return None
    if level == 1 and random.random() < 0.35:
        return random.choice(moves)
    depth = {1:1, 2:2, 3:2, 4:3}[level]
    choices = []
    for move in ordered_moves(board):
        board.push(move)
        score = -negamax(board, depth-1)
        board.pop()
        choices.append((score,move))
    choices.sort(key=lambda row:row[0], reverse=True)
    return choices[0][1]

def bot_move(board, level=2):
    engine = None
    try:
        engine = open_engine()
        if engine:
            skill = {1:0,2:6,3:14,4:20}[level]
            if 'Skill Level' in engine.options:
                engine.configure({'Skill Level':skill})
            result = engine.play(board, chess.engine.Limit(time={1:0.08,2:0.15,3:0.4,4:1.0}[level]))
            return result.move, 'Stockfish'
    except (OSError,chess.engine.EngineError):
        pass
    finally:
        if engine:
            engine.quit()
    return fallback_move(board,level), 'Local search (limited strength)'

def analyze_game(game):
    board = chess.Board(game.initial_fen)
    engine = None
    label = 'Material and positional heuristic'
    try:
        engine = open_engine()
        if engine:
            label = 'Stockfish, 40 ms per position'
        entries = []
        losses = {'w':[],'b':[]}
        for index,record in enumerate(game.moves):
            color = 'w' if board.turn else 'b'
            move = chess.Move.from_uci(record['uci'])
            if move not in board.legal_moves:
                break
            before = board.copy()
            capture = board.is_capture(move)
            if engine:
                info = engine.analyse(board,chess.engine.Limit(time=0.04))
                best_score = info['score'].white().score(mate_score=10000) or 0
                best_move = info.get('pv',[None])[0]
            else:
                best_move = fallback_move(board,2)
                board.push(best_move)
                best_score = evaluate(board)
                board.pop()
            best_san = board.san(best_move) if best_move else None
            board.push(move)
            if engine:
                info = engine.analyse(board,chess.engine.Limit(time=0.04))
                score = info['score'].white().score(mate_score=10000) or 0
            else:
                score = evaluate(board)
            loss = max(0, (best_score-score) * (1 if color=='w' else -1))
            if move == best_move or board.is_checkmate():
                classification = 'Best'
                loss = 0
            elif loss < 40:
                classification = 'Excellent'
            elif loss < 90:
                classification = 'Good'
            elif loss < 180:
                classification = 'Inaccuracy'
            elif loss < 350:
                classification = 'Mistake'
            else:
                classification = 'Blunder'
            losses[color].append(loss)
            if board.is_checkmate():
                explanation = 'Checkmate: the opposing king has no legal escape.'
            elif classification in ('Mistake','Blunder','Inaccuracy'):
                explanation = f'{best_san} was stronger. This move gives up approximately {loss/100:.1f} pawns of evaluation.'
            elif board.is_check():
                explanation = 'A forcing check. The opponent must answer the threat to their king.'
            elif capture:
                explanation = 'A capture that maintains the position’s balance.'
            elif before.is_castling(move):
                explanation = 'Castling brings the king toward safety and activates the rook.'
            else:
                explanation = 'A sound move that preserves the position’s evaluation.'
            entries.append({'ply':index+1,'moveNumber':index//2+1,'color':color,
                            'san':record['san'],'uci':move.uci(),'fen':board.fen(),
                            'from':chess.square_name(move.from_square),'to':chess.square_name(move.to_square),
                            'fenBefore':before.fen(),'fenAfter':board.fen(),
                            'evaluation':round(score/100,2),'evaluationBefore':round(best_score/100,2),
                            'centipawn_loss':loss,'centipawnLoss':loss,
                            'classification':classification,'classification_key':classification.lower(),
                            'best_move':best_move.uci() if best_move else None,
                            'best_san':best_san,'bestMove':best_san,
                            'bestUci':best_move.uci() if best_move else None,
                            'analyzed':True,'explanation':explanation})
        accuracy = {color:round(sum(100*math.exp(-loss/220) for loss in values)/len(values),1) if values else None
                    for color,values in losses.items()}
        accuracy.update({'white':accuracy['w'],'black':accuracy['b']})
        counts={}
        for entry in entries:
            key=entry['classification']
            counts[key]=counts.get(key,0)+1
        note='Accuracy is an estimated training score, not a rating. Short analysis can miss deep tactics.'
        return {'engine':label,'estimated':True,'accuracy':accuracy,'moves':entries,
                'summary':counts,'analysisCoverage':len(entries),'finalFen':board.fen(),
                'note':note,'disclaimer':note}
    finally:
        if engine:
            engine.quit()
