from datetime import timedelta
from unittest.mock import patch
import chess
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from .models import Game,Profile
from .puzzles import make_puzzle
from .services import replay

class ChessApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.user=get_user_model().objects.create_user('alice',password='a-complex-password-492')
        self.other=get_user_model().objects.create_user('bob',password='another-complex-password-492')
        self.client=APIClient()
        self.client.force_authenticate(user=self.user)

    def new_game(self,**kwargs):
        response=self.client.post('/api/games',{'mode':'local','minutes':10,**kwargs},format='json')
        self.assertEqual(response.status_code,201,response.data)
        return response.data['id']

    def move(self,game_id,uci):
        return self.client.post(f'/api/games/{game_id}/move',{'uci':uci},format='json')

    def test_authentication_and_profile(self):
        anon=APIClient()
        self.assertEqual(anon.get('/api/profile').status_code,401)
        response=anon.post('/api/auth/register',{'username':'charlie','password':'secure-personal-chess-719'},format='json')
        self.assertEqual(response.status_code,201,response.data)
        anon.credentials(HTTP_AUTHORIZATION='Token '+response.data['token'])
        self.assertEqual(anon.get('/api/profile').data['username'],'charlie')
        self.assertEqual(anon.post('/api/auth/logout').status_code,200)
        self.assertEqual(anon.get('/api/profile').status_code,401)

    def test_illegal_move_rejected_without_mutation(self):
        gid=self.new_game()
        self.assertEqual(self.move(gid,'e2e5').status_code,400)
        self.assertEqual(Game.objects.get(pk=gid).moves,[])
        self.assertEqual(self.move(gid,'e2e4').status_code,200)
        game=Game.objects.get(pk=gid)
        self.assertEqual(game.moves[0]['san'],'e4')
        self.assertEqual(replay(game).turn,chess.BLACK)

    def test_checkmate_finishes_and_awards_once(self):
        gid=self.new_game()
        for uci in ['f2f3','e7e5','g2g4','d8h4']:
            response=self.move(gid,uci)
            self.assertEqual(response.status_code,200)
        self.assertEqual(response.data['result'],'0-1')
        self.assertEqual(response.data['termination'],'checkmate')
        p=Profile.objects.get(user=self.user)
        self.assertEqual(p.games_played,1)
        self.client.get(f'/api/games/{gid}')
        p.refresh_from_db()
        self.assertEqual(p.games_played,1)
        self.assertEqual(self.move(gid,'a2a3').status_code,409)

    def test_timeout_is_authoritative(self):
        gid=self.new_game()
        Game.objects.filter(pk=gid).update(last_tick=timezone.now()-timedelta(seconds=605))
        result=self.move(gid,'e2e4')
        self.assertEqual(result.status_code,409)
        self.assertEqual(result.data['game']['termination'],'timeout')
        self.assertEqual(result.data['game']['white_seconds'],0)
        self.assertEqual(result.data['game']['result'],'0-1')
        self.assertEqual(Game.objects.get(pk=gid).moves,[])

    def test_timeout_draw_with_insufficient_opponent_material(self):
        gid=self.new_game()
        fen='7k/8/8/8/8/8/4P3/4K3 w - - 0 1'
        Game.objects.filter(pk=gid).update(initial_fen=fen,fen=fen,last_tick=timezone.now()-timedelta(seconds=605))
        result=self.client.get(f'/api/games/{gid}')
        self.assertEqual(result.data['result'],'1/2-1/2')
        self.assertEqual(result.data['termination'],'timeout_insufficient_material')

    def test_room_join_and_player_authorization(self):
        room=self.client.post('/api/rooms',{'minutes':15},format='json').data
        self.assertEqual(room['status'],'waiting')
        self.assertIsNone(Game.objects.get(pk=room['id']).last_tick)
        bob=APIClient()
        bob.force_authenticate(user=self.other)
        joined=bob.post(f"/api/rooms/{room['code']}/join")
        self.assertEqual(joined.data['status'],'active')
        self.assertEqual(bob.post(f"/api/games/{room['id']}/move",{'uci':'e2e4'},format='json').status_code,403)
        self.assertEqual(self.move(room['id'],'e2e4').status_code,200)
        self.assertEqual(self.move(room['id'],'e7e5').status_code,403)
        self.assertEqual(bob.post(f"/api/games/{room['id']}/move",{'uci':'e7e5'},format='json').status_code,200)
        intruder=get_user_model().objects.create_user('eve')
        bob.force_authenticate(user=intruder)
        self.assertEqual(bob.post(f"/api/rooms/{room['code']}/join").status_code,409)
        self.assertEqual(bob.get(f"/api/games/{room['id']}").status_code,403)

    def test_no_engine_assistance_during_live_multiplayer(self):
        room=self.client.post('/api/rooms',{'minutes':10},format='json').data
        result=self.client.post(f"/api/games/{room['id']}/review")
        self.assertEqual(result.status_code,403)

    def test_local_draw_agreement_is_owner_only_and_idempotent(self):
        gid=self.new_game()
        other=APIClient()
        other.force_authenticate(user=self.other)
        self.assertEqual(other.post(f'/api/games/{gid}/agree-draw').status_code,403)
        response=self.client.post(f'/api/games/{gid}/agree-draw')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.data['result'],'1/2-1/2')
        self.assertEqual(response.data['termination'],'draw_agreement')
        self.client.post(f'/api/games/{gid}/agree-draw')
        self.assertEqual(Profile.objects.get(user=self.user).games_played,1)
        room=self.client.post('/api/rooms',{'minutes':10},format='json').data
        self.assertEqual(self.client.post(f"/api/games/{room['id']}/agree-draw").status_code,403)
        bot=self.new_game(mode='bot')
        self.assertEqual(self.client.post(f'/api/games/{bot}/agree-draw').status_code,403)

    def test_timeout_takes_priority_over_draw_agreement(self):
        gid=self.new_game()
        Game.objects.filter(pk=gid).update(last_tick=timezone.now()-timedelta(seconds=605))
        result=self.client.post(f'/api/games/{gid}/agree-draw')
        self.assertEqual(result.data['result'],'0-1')
        self.assertEqual(result.data['termination'],'timeout')

    def test_underpromotion(self):
        gid=self.new_game()
        fen='7k/P7/8/8/8/8/8/4K3 w - - 0 1'
        Game.objects.filter(pk=gid).update(initial_fen=fen,fen=fen)
        response=self.move(gid,'a7a8n')
        self.assertEqual(response.status_code,200)
        self.assertEqual(chess.Board(response.data['fen']).piece_at(chess.A8),chess.Piece(chess.KNIGHT,chess.WHITE))
        self.assertEqual(response.data['termination'],'insufficient_material')

    def test_castling_and_en_passant(self):
        for fen,uci,square,piece in [
            ('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1','e1g1',chess.F1,chess.ROOK),
            ('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 2','e5d6',chess.D6,chess.PAWN),
        ]:
            gid=self.new_game()
            Game.objects.filter(pk=gid).update(initial_fen=fen,fen=fen)
            response=self.move(gid,uci)
            self.assertEqual(response.status_code,200,response.data)
            board=chess.Board(response.data['fen'])
            self.assertEqual(board.piece_type_at(square),piece)
            if uci=='e5d6':
                self.assertIsNone(board.piece_at(chess.D5))

    def test_threefold_uses_full_move_history(self):
        gid=self.new_game()
        for uci in ['g1f3','g8f6','f3g1','f6g8']*2:
            self.assertEqual(self.move(gid,uci).status_code,200)
        response=self.client.post(f'/api/games/{gid}/claim-draw')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.data['result'],'1/2-1/2')

    def test_puzzles_legal_and_xp_idempotent(self):
        puzzle=make_puzzle()
        board=chess.Board(puzzle['fen'])
        self.assertTrue(board.is_valid())
        solution=None
        for candidate in list(board.legal_moves):
            board.push(candidate)
            if board.is_checkmate():
                solution=candidate.uci()
            board.pop()
        self.assertIsNotNone(solution)
        data={'puzzle_id':puzzle['id'],'uci':solution}
        result=self.client.post('/api/puzzles/check',data,format='json')
        self.assertTrue(result.data['correct'])
        self.assertEqual(result.data['xp_awarded'],15)
        again=self.client.post('/api/puzzles/check',data,format='json')
        self.assertEqual(again.data['xp_awarded'],0)
        self.assertEqual(Profile.objects.get(user=self.user).puzzles_solved,1)
        self.assertEqual(self.client.post('/api/puzzles/check',{'puzzle_id':'forged','uci':solution},format='json').status_code,400)

    def test_lesson_progress_and_profile_cannot_forge_xp(self):
        first=self.client.patch('/api/progress',{'lesson_id':'meet-the-board'},format='json')
        second=self.client.patch('/api/progress',{'lesson_id':'meet-the-board'},format='json')
        self.assertEqual(first.data['xp'],25)
        self.assertEqual(second.data['xp'],25)
        self.assertEqual(self.client.patch('/api/progress',{'lesson_id':'invented-id'},format='json').status_code,400)
        response=self.client.patch('/api/profile',{'xp':999999,'bio':'Learning chess'},format='json')
        self.assertEqual(response.data['xp'],25)
        self.assertEqual(response.data['bio'],'Learning chess')

    @patch('chessapp.views.bot_move',return_value=(chess.Move.from_uci('e7e5'),'test'))
    def test_bot_replies_legally(self,mock_bot):
        gid=self.new_game(mode='bot',bot_level=4)
        response=self.move(gid,'e2e4')
        self.assertEqual(response.status_code,200,response.data)
        self.assertEqual(len(response.data['moves']),2)
        self.assertEqual(response.data['turn'],'w')

    def test_clock_charges_first_move_wait_and_bot_thinking(self):
        now=[timezone.now()]
        def fake_bot(board,level):
            now[0]+=timedelta(seconds=3)
            return chess.Move.from_uci('e7e5'),'test'
        with patch('chessapp.views.timezone.now',side_effect=lambda:now[0]), patch('chessapp.views.bot_move',side_effect=fake_bot):
            gid=self.new_game(mode='bot')
            now[0]+=timedelta(seconds=7)
            response=self.move(gid,'e2e4')
        self.assertEqual(response.status_code,200)
        self.assertEqual(response.data['white_seconds'],593)
        self.assertEqual(response.data['black_seconds'],597)

    def test_time_control_and_profile_validation(self):
        self.assertEqual(self.client.post('/api/games',{'minutes':-1},format='json').status_code,400)
        self.assertEqual(self.client.patch('/api/profile',{'avatar':'javascript:alert(1)'},format='json').status_code,400)
        self.assertEqual(self.client.patch('/api/profile',{'username':'bob'},format='json').status_code,400)

    def test_accented_bot_name_is_accepted(self):
        gid=self.new_game(mode='bot',bot_name='Judit Polgár')
        self.assertEqual(Game.objects.get(pk=gid).bot_name,'Judit Polgar')

    def test_waiting_room_cancellation_has_no_rewards(self):
        room=self.client.post('/api/rooms',{'minutes':10},format='json').data
        other=APIClient()
        other.force_authenticate(user=self.other)
        self.assertEqual(other.post(f"/api/games/{room['id']}/resign").status_code,403)
        result=self.client.post(f"/api/games/{room['id']}/resign")
        self.assertEqual(result.data['status'],'finished')
        self.assertEqual(result.data['result'],'*')
        self.assertEqual(result.data['termination'],'cancelled')
        self.assertEqual(other.post(f"/api/rooms/{room['code']}/join").status_code,409)
        self.client.post(f"/api/games/{room['id']}/resign")
        profile=self.client.get('/api/profile').data
        self.assertEqual(profile['xp'],0)
        self.assertEqual(profile['games_played'],0)

    def test_profile_statistics_use_all_games_and_separate_local_practice(self):
        records=[]
        for result,count in [('0-1',55),('1-0',2),('1/2-1/2',3)]:
            records.extend(Game(owner=self.user,white=self.user,mode='bot',status='finished',result=result,termination='test') for _ in range(count))
        records.extend(Game(owner=self.user,white=self.user,mode='local',status='finished',result='1/2-1/2',termination='draw_agreement') for _ in range(2))
        Game.objects.bulk_create(records)
        profile=self.client.get('/api/profile').data
        self.assertEqual(profile['games_played'],62)
        self.assertEqual(profile['opponent_games'],60)
        self.assertEqual(profile['practice_games'],2)
        self.assertEqual(profile['wins'],2)
        self.assertEqual(profile['losses'],55)
        self.assertEqual(profile['draws'],3)
        self.assertEqual(len(self.client.get('/api/games').data['games']),50)

    def test_fallback_review_returns_real_move_analysis(self):
        gid=self.new_game()
        self.move(gid,'e2e4')
        with self.settings(STOCKFISH_PATH='/missing/stockfish'):
            result=self.client.post(f'/api/games/{gid}/review')
        self.assertEqual(result.status_code,200,result.data)
        self.assertEqual(len(result.data['moves']),1)
        self.assertEqual(result.data['engine'],'Material and positional heuristic')
        self.assertEqual(result.data['accuracy']['white'],result.data['accuracy']['w'])
        self.assertEqual(result.data['moves'][0]['fenBefore'],chess.STARTING_FEN)
        self.assertEqual(result.data['moves'][0]['fenAfter'],result.data['finalFen'])
        self.assertEqual(result.data['moves'][0]['bestMove'],result.data['moves'][0]['best_san'])
        self.assertEqual(result.data['moves'][0]['color'],'w')
