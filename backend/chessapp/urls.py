from django.urls import path
from . import views

urlpatterns=[
    path('health',views.health),path('auth/register',views.register),path('auth/login',views.login),path('auth/logout',views.logout),
    path('profile',views.profile),path('games',views.games),path('games/<uuid:game_id>',views.game_detail),
    path('games/<uuid:game_id>/move',views.move),path('games/<uuid:game_id>/resign',views.resign),
    path('games/<uuid:game_id>/claim-draw',views.claim_draw),path('games/<uuid:game_id>/agree-draw',views.agree_draw),path('games/<uuid:game_id>/review',views.review),
    path('rooms',views.rooms),path('rooms/<str:code>/join',views.room_join),path('rooms/<str:code>',views.room_detail),
    path('puzzles/next',views.puzzle_next),path('puzzles/check',views.puzzle_check),
    path('progress',views.progress),path('catalog',views.catalog),
]
