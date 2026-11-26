import chess
import chess.engine
from pathlib import Path
from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.db import DatabaseError, IntegrityError, connection, transaction
from django.db.models import F, Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, authentication_classes, permission_classes, throttle_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from .engine import BOT_NAMES, analyze_game, bot_move
from .models import Game, Profile, PuzzleAttempt
from .openings import OPENINGS
from .puzzles import make_puzzle, load_puzzle
from .serializers import RegisterSerializer,LoginSerializer,ProfileSerializer,GameSerializer,MoveSerializer,RoomSerializer,PuzzleCheckSerializer
from .services import profile_for,profile_data,replay,settle_clock,game_data,push_move,finish_game

class AuthThrottle(AnonRateThrottle):
    scope='auth'

class EngineThrottle(UserRateThrottle):
    scope='engine'

def validated(serializer,data):
    s=serializer(data=data)
    s.is_valid(raise_exception=True)
    return s.validated_data

def participant(game,user):
    return user.id in (game.owner_id,game.white_id,game.black_id)

def locked_game(game_id,user):
    game=get_object_or_404(Game.objects.select_for_update(),id=game_id)
    if not participant(game,user):
        raise PermissionDenied('This game belongs to other players.')
    return game

def run_bot(game):
    board=replay(game)
    if game.status=='active' and ('w' if board.turn else 'b')!=game.user_color:
        move,label=bot_move(board,game.bot_level)
        settle_clock(game)
        if game.status=='active' and move:
            push_move(game,board,move)

@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
@throttle_classes([])
def health(request):
    payload={'status':'ok','service':'Knight Django API','database':settings.DATABASES['default']['ENGINE'].split('.')[-1],
             'stockfish':Path(settings.STOCKFISH_PATH).is_file(),'database_reachable':True}
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT 1')
            if cursor.fetchone() != (1,):
                raise DatabaseError('Unexpected database readiness result.')
    except (DatabaseError, OSError):
        payload.update(status='unavailable',database_reachable=False)
        return Response(payload,status=503)
    return Response(payload)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def register(request):
    data=validated(RegisterSerializer,request.data)
    try:
        with transaction.atomic():
            user=get_user_model().objects.create_user(username=data['username'],password=data['password'])
            Profile.objects.create(user=user,display_name=data.get('display_name',data['username']))
            token=Token.objects.create(user=user)
    except IntegrityError:
        raise ValidationError({'username':'This username is already in use.'})
    return Response({'token':token.key,'user':profile_data(user)},status=201)

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AuthThrottle])
def login(request):
    data=validated(LoginSerializer,request.data)
    user=authenticate(username=data['username'],password=data['password'])
    if not user:
        return Response({'error':'Incorrect username or password.'},status=401)
    token,_=Token.objects.get_or_create(user=user)
    return Response({'token':token.key,'user':profile_data(user)})

@api_view(['POST'])
def logout(request):
    request.auth.delete()
    return Response({'ok':True})

@api_view(['GET','PATCH'])
@transaction.atomic
def profile(request):
    if request.method=='PATCH':
        data=validated(ProfileSerializer,request.data)
        user=get_user_model().objects.select_for_update().get(pk=request.user.pk)
        if 'username' in data:
            username=data.pop('username')
            if get_user_model().objects.filter(username__iexact=username).exclude(pk=user.pk).exists():
                raise ValidationError({'username':'This username is already in use.'})
            user.username=username
            user.save(update_fields=['username'])
            request.user.username=username
        profile_for(user)
        p=Profile.objects.select_for_update().get(user=user)
        for key,value in data.items():
            setattr(p,key,value)
        p.save()
    return Response(profile_data(request.user))

@api_view(['GET','POST'])
@transaction.atomic
def games(request):
    if request.method=='GET':
        qs=Game.objects.filter(Q(owner=request.user)|Q(white=request.user)|Q(black=request.user)).distinct().order_by('-created_at')[:50]
        result=[]
        for obj in qs:
            # Read results may be stale by at most elapsed wall time; detail polling settles and persists.
            result.append(game_data(obj,request.user))
        return Response({'games':result})
    data=validated(GameSerializer,request.data)
    game=Game.objects.create(owner=request.user,white=request.user if data['user_color']=='w' or data['mode']=='local' else None,
                             black=request.user if data['user_color']=='b' and data['mode']=='bot' else None,
                             white_seconds=data['minutes']*60,black_seconds=data['minutes']*60,last_tick=timezone.now(),**data)
    if game.mode=='bot':
        run_bot(game)
        game.save()
    return Response(game_data(game,request.user),status=201)

@api_view(['GET'])
@transaction.atomic
def game_detail(request,game_id):
    game=locked_game(game_id,request.user)
    settle_clock(game)
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@transaction.atomic
def move(request,game_id):
    data=validated(MoveSerializer,request.data)
    game=locked_game(game_id,request.user)
    settle_clock(game)
    if game.status!='active':
        game.save()
        return Response({'error':'The game is not active.','game':game_data(game,request.user)},status=409)
    board=replay(game)
    if game.mode=='multiplayer':
        expected=game.white_id if board.turn else game.black_id
        if request.user.id!=expected:
            game.save()
            raise PermissionDenied('It is the other player’s turn.')
    elif game.mode=='bot' and ('w' if board.turn else 'b')!=game.user_color:
        game.save()
        raise PermissionDenied('It is the bot’s turn.')
    selected=chess.Move.from_uci(data['uci'])
    if selected not in board.legal_moves:
        game.save()
        raise ValidationError({'uci':'That move is not legal in this position.'})
    push_move(game,board,selected)
    if game.mode=='bot' and game.status=='active':
        run_bot(game)
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@transaction.atomic
def resign(request,game_id):
    game=locked_game(game_id,request.user)
    settle_clock(game)
    if game.status=='waiting' and game.owner_id==request.user.id:
        game.status='finished'
        game.result='*'
        game.termination='cancelled'
        game.last_tick=None
        game.awarded=True
    elif game.status=='active':
        is_white=request.user.id==game.white_id
        if game.mode=='local':
            is_white=replay(game).turn
        finish_game(game,'0-1' if is_white else '1-0','resignation')
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@transaction.atomic
def claim_draw(request,game_id):
    game=locked_game(game_id,request.user)
    settle_clock(game)
    board=replay(game)
    if game.mode=='multiplayer' and request.user.id!=(game.white_id if board.turn else game.black_id):
        raise PermissionDenied('Only the player to move may claim a draw.')
    if game.status=='active' and board.can_claim_draw():
        finish_game(game,'1/2-1/2','draw_claimed')
    elif game.status=='active':
        game.save()
        raise ValidationError('A draw cannot be claimed in this position.')
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@transaction.atomic
def agree_draw(request,game_id):
    """Both local players confirm through the one authenticated device owner."""
    game=locked_game(game_id,request.user)
    if game.mode!='local' or game.owner_id!=request.user.id:
        raise PermissionDenied('Agreed draws are available only to the owner of a local same-device game.')
    settle_clock(game)
    if game.status=='active':
        finish_game(game,'1/2-1/2','draw_agreement')
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@transaction.atomic
def rooms(request):
    data=validated(RoomSerializer,request.data)
    game=Game.objects.create(owner=request.user,white=request.user,mode='multiplayer',status='waiting',
                             minutes=data['minutes'],white_seconds=data['minutes']*60,black_seconds=data['minutes']*60)
    return Response(game_data(game,request.user),status=201)

@api_view(['POST'])
@transaction.atomic
def room_join(request,code):
    game=get_object_or_404(Game.objects.select_for_update(),code=code.upper(),mode='multiplayer')
    if game.owner_id==request.user.id:
        return Response(game_data(game,request.user))
    if game.black_id==request.user.id:
        settle_clock(game)
        game.save()
        return Response(game_data(game,request.user))
    if game.status!='waiting' or game.black_id:
        return Response({'error':'This room is already full or finished.'},status=409)
    game.black=request.user
    game.status='active'
    game.last_tick=timezone.now()
    game.save()
    return Response(game_data(game,request.user))

@api_view(['GET'])
@transaction.atomic
def room_detail(request,code):
    game=get_object_or_404(Game.objects.select_for_update(),code=code.upper(),mode='multiplayer')
    if not participant(game,request.user):
        raise PermissionDenied('Join the room before reading its game.')
    settle_clock(game)
    game.save()
    return Response(game_data(game,request.user))

@api_view(['POST'])
@throttle_classes([EngineThrottle])
def review(request,game_id):
    game=get_object_or_404(Game,id=game_id)
    if not participant(game,request.user):
        raise PermissionDenied('This game belongs to other players.')
    if game.mode=='multiplayer' and game.status!='finished':
        raise PermissionDenied('Game review becomes available when the multiplayer game finishes.')
    if game.review is None:
        try:
            analysis=analyze_game(game)
        except (OSError,chess.engine.EngineError):
            return Response({'error':'The analysis engine is unavailable. Please try again.'},status=503)
        # Cache only if no move was played while the analysis ran.
        Game.objects.filter(pk=game.pk,updated_at=game.updated_at).update(review=analysis)
        return Response(analysis)
    return Response(game.review)

@api_view(['GET'])
@permission_classes([AllowAny])
def puzzle_next(request):
    try:
        return Response(make_puzzle())
    except RuntimeError as error:
        return Response({'error':str(error)},status=503)

@api_view(['POST'])
@permission_classes([AllowAny])
@transaction.atomic
def puzzle_check(request):
    data=validated(PuzzleCheckSerializer,request.data)
    try:
        board,key=load_puzzle(data['puzzle_id'])
    except (signing.BadSignature,ValueError,KeyError):
        raise ValidationError('The puzzle has expired or is invalid. Load a new puzzle.')
    selected=chess.Move.from_uci(data['uci'])
    if selected not in board.legal_moves:
        return Response({'correct':False,'message':'That move is not legal. Try again.'})
    san=board.san(selected)
    board.push(selected)
    correct=board.is_checkmate()
    awarded=False
    if correct and request.user.is_authenticated:
        attempt,created=PuzzleAttempt.objects.get_or_create(user=request.user,puzzle_key=key,defaults={'solved':True})
        if created:
            p=profile_for(request.user)
            Profile.objects.filter(pk=p.pk).update(xp=F('xp')+15,puzzles_solved=F('puzzles_solved')+1)
            awarded=True
    return Response({'correct':correct,'san':san,'fen':board.fen(),'xp_awarded':15 if awarded else 0,
                     'message':'Checkmate! Well found.' if correct else 'The opponent still has a legal response. Try again.'})

@api_view(['GET','PATCH'])
@transaction.atomic
def progress(request):
    profile_for(request.user)
    p=Profile.objects.select_for_update().get(user=request.user)
    if request.method=='PATCH':
        lesson=request.data.get('lesson_id')
        allowed={'meet-the-board','how-pieces-move','check-and-mate','special-moves','draws-and-time','piece-values',
                 'opening-principles','reading-notation','forks','pins-skewers','discovered-attacks','mating-patterns',
                 'italian-game','queens-gambit','defense-toolkit','king-pawn-endings','basic-checkmates','candidate-moves',
                 'pawn-structures','weak-squares','open-files','ruy-lopez','defenses-to-d4','rook-endgames','prophylaxis',
                 'positional-sacrifices','defensive-resources','practical-decisions','analyze-your-games','training-plan'}
        if not isinstance(lesson,str) or lesson not in allowed:
            raise ValidationError({'lesson_id':'Choose a lesson from the course curriculum.'})
        if lesson not in p.completed_lessons:
            p.completed_lessons=[*p.completed_lessons,lesson]
            p.xp+=25
            p.save()
    return Response({'completed_lessons':p.completed_lessons,'xp':p.xp,'level':1+p.xp//250})

@api_view(['GET'])
@permission_classes([AllowAny])
def catalog(request):
    return Response({'bots':[{'name':name,'levels':[1,2,3,4]} for name in BOT_NAMES],
                     'bot_disclaimer':'Fictional training bots named after players; no endorsement or personal coaching.',
                     'time_controls':[10,15,20],
                     'openings':[{'eco':eco,'name':name,'moves':line,'description':description} for eco,name,line,description in OPENINGS]})
