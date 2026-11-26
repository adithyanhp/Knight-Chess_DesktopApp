import chess
from django.db import transaction
from django.db.models import Count, F, Q
from django.utils import timezone
from .models import Game, Profile
from .openings import identify_opening

def profile_for(user):
    return Profile.objects.get_or_create(user=user)[0]

def profile_data(user):
    p=profile_for(user)
    finished=Game.objects.filter(status='finished',result__in=['1-0','0-1','1/2-1/2']).filter(Q(owner=user)|Q(white=user)|Q(black=user))
    opponent=~Q(mode='local')
    statistics=finished.aggregate(
        games_played=Count('id'),
        practice_games=Count('id',filter=Q(mode='local')),
        opponent_games=Count('id',filter=opponent),
        wins=Count('id',filter=opponent&(Q(white=user,result='1-0')|Q(black=user,result='0-1'))),
        losses=Count('id',filter=opponent&(Q(white=user,result='0-1')|Q(black=user,result='1-0'))),
        draws=Count('id',filter=opponent&Q(result='1/2-1/2')),
    )
    achievements=[]
    for key,title,earned in [
        ('first-game','First steps',statistics['games_played']>=1),('first-win','First victory',statistics['wins']>=1),
        ('ten-games','Regular player',statistics['games_played']>=10),('puzzle-first','Problem solver',p.puzzles_solved>=1),
        ('puzzle-25','Tactician',p.puzzles_solved>=25),('lesson-first','Eager learner',len(p.completed_lessons)>=1),
        ('lesson-ten','Knowledge builder',len(p.completed_lessons)>=10),('level-five','Rising star',p.xp>=1000),
    ]:
        achievements.append({'id':key,'title':title,'earned':earned})
    return {'id':user.id,'username':user.username,'display_name':p.display_name or user.username,
            'avatar':p.avatar,'bio':p.bio,'country':p.country,'xp':p.xp,'level':1+p.xp//250,
            'next_level_xp':250,'level_progress':p.xp%250,**statistics,
            'puzzles_solved':p.puzzles_solved,'completed_lessons':p.completed_lessons,
            'settings':p.settings,'achievements':achievements,'joined_at':p.created_at.isoformat()}

def player_data(user):
    if user is None:
        return None
    p=profile_for(user)
    return {'id':user.id,'username':user.username,'display_name':p.display_name or user.username,'avatar':p.avatar,'level':1+p.xp//250}

def replay(game):
    board=chess.Board(game.initial_fen)
    for item in game.moves:
        board.push_uci(item['uci'])
    return board

def award_game(game):
    if game.awarded or game.status!='finished':
        return
    participants={u.id:u for u in (game.white,game.black,game.owner) if u}
    for user in participants.values():
        p=profile_for(user)
        is_white = game.white_id==user.id
        won=(game.result=='1-0' and is_white) or (game.result=='0-1' and game.black_id==user.id)
        if game.mode=='local':
            won=False
        Profile.objects.filter(pk=p.pk).update(xp=F('xp')+20+(30 if won else 0),games_played=F('games_played')+1,wins=F('wins')+int(won))
    game.awarded=True

def finish_game(game,result,termination):
    game.status='finished'
    game.result=result
    game.termination=termination
    game.last_tick=None
    award_game(game)

def settle_clock(game,now=None):
    now=now or timezone.now()
    if game.status!='active' or not game.last_tick:
        return
    board=replay(game)
    elapsed=max(0,(now-game.last_tick).total_seconds())
    field='white_seconds' if board.turn else 'black_seconds'
    remaining=max(0,getattr(game,field)-elapsed)
    setattr(game,field,remaining)
    game.last_tick=now
    if remaining<=0:
        if board.has_insufficient_material(not board.turn):
            finish_game(game,'1/2-1/2','timeout_insufficient_material')
        else:
            finish_game(game,'0-1' if board.turn else '1-0','timeout')

def push_move(game,board,move):
    san=board.san(move)
    piece=board.piece_at(move.from_square)
    capture=board.is_capture(move)
    board.push(move)
    game.fen=board.fen()
    game.moves=[*game.moves,{'ply':len(game.moves)+1,'san':san,'uci':move.uci(),'fen':board.fen(),
                           'piece':piece.symbol(),'capture':capture,'check':board.is_check(),
                           'white_seconds':round(game.white_seconds,3),'black_seconds':round(game.black_seconds,3)}]
    game.last_tick=timezone.now()
    game.review=None
    outcome=board.outcome(claim_draw=False)
    if outcome:
        finish_game(game,outcome.result(),outcome.termination.name.lower())

def game_data(game,user=None):
    board=replay(game)
    return {'id':str(game.id),'code':game.code,'mode':game.mode,'owner_id':game.owner_id,
            'white':player_data(game.white),'black':player_data(game.black),
            'bot_name':game.bot_name,'bot_level':game.bot_level,'user_color':game.user_color,
            'initial_fen':game.initial_fen,'fen':game.fen,'turn':'w' if board.turn else 'b',
            'moves':game.moves,'minutes':game.minutes,'white_seconds':round(game.white_seconds,3),
            'black_seconds':round(game.black_seconds,3),'status':game.status,'result':game.result,
            'termination':game.termination,'opening':identify_opening(game.moves),
            'in_check':board.is_check(),'legal_moves':[m.uci() for m in board.legal_moves] if game.status=='active' else [],
            'can_claim_draw':board.can_claim_draw() if game.status=='active' else False,
            'server_time':timezone.now().isoformat(),'created_at':game.created_at.isoformat()}
