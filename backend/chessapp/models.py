import secrets
import uuid
from django.conf import settings
from django.db import models

def room_code():
    return secrets.token_hex(4).upper()

class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='chess_profile')
    display_name = models.CharField(max_length=80, blank=True)
    avatar = models.TextField(blank=True)
    bio = models.CharField(max_length=500, blank=True)
    country = models.CharField(max_length=80, blank=True)
    xp = models.PositiveIntegerField(default=0)
    games_played = models.PositiveIntegerField(default=0)
    wins = models.PositiveIntegerField(default=0)
    puzzles_solved = models.PositiveIntegerField(default=0)
    settings = models.JSONField(default=dict)
    completed_lessons = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)

class Game(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=8, default=room_code, unique=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='owned_chess_games')
    white = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='white_chess_games')
    black = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='black_chess_games')
    mode = models.CharField(max_length=12, default='local')
    bot_name = models.CharField(max_length=80, blank=True)
    bot_level = models.PositiveSmallIntegerField(default=2)
    user_color = models.CharField(max_length=1, default='w')
    initial_fen = models.CharField(max_length=128, default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    fen = models.CharField(max_length=128, default='rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
    moves = models.JSONField(default=list)
    minutes = models.PositiveSmallIntegerField(default=10)
    white_seconds = models.FloatField(default=600)
    black_seconds = models.FloatField(default=600)
    status = models.CharField(max_length=16, default='active')
    result = models.CharField(max_length=7, default='*')
    termination = models.CharField(max_length=40, blank=True)
    last_tick = models.DateTimeField(null=True, blank=True)
    awarded = models.BooleanField(default=False)
    review = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class PuzzleAttempt(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    puzzle_key = models.CharField(max_length=64)
    solved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=['user','puzzle_key'], name='unique_user_puzzle')]
