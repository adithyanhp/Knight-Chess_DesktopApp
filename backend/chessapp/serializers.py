import base64
import json
import re
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers
from .engine import BOT_NAMES

class RegisterSerializer(serializers.Serializer):
    username=serializers.RegexField(r'^[a-zA-Z0-9_]{3,30}$')
    password=serializers.CharField(min_length=8,max_length=128,write_only=True)
    display_name=serializers.CharField(max_length=80,required=False)
    def validate_username(self,value):
        if get_user_model().objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('This username is already in use.')
        return value
    def validate(self,data):
        try:
            validate_password(data['password'],get_user_model()(username=data['username']))
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password':list(error.messages)})
        return data

class LoginSerializer(serializers.Serializer):
    username=serializers.CharField(max_length=150)
    password=serializers.CharField(max_length=128,write_only=True)

class ProfileSerializer(serializers.Serializer):
    username=serializers.RegexField(r'^[a-zA-Z0-9_]{3,30}$',required=False)
    display_name=serializers.CharField(max_length=80,required=False,allow_blank=True)
    avatar=serializers.CharField(max_length=1500000,required=False,allow_blank=True)
    bio=serializers.CharField(max_length=500,required=False,allow_blank=True)
    country=serializers.CharField(max_length=80,required=False,allow_blank=True)
    settings=serializers.JSONField(required=False)
    def validate_avatar(self,value):
        if value:
            if not re.match(r'^data:image/(png|jpeg|webp);base64,',value):
                raise serializers.ValidationError('Upload a PNG, JPEG, or WebP image.')
            try:
                base64.b64decode(value.split(',',1)[1],validate=True)
            except (ValueError,TypeError):
                raise serializers.ValidationError('Invalid image data.')
        return value
    def validate_settings(self,value):
        if not isinstance(value,dict) or len(json.dumps(value))>12000:
            raise serializers.ValidationError('Settings must be an object smaller than 12 KB.')
        return value

class GameSerializer(serializers.Serializer):
    mode=serializers.ChoiceField(choices=['local','bot'],default='local')
    minutes=serializers.ChoiceField(choices=[10,15,20],default=10)
    bot_name=serializers.CharField(max_length=80,default='Magnus Carlsen')
    bot_level=serializers.IntegerField(min_value=1,max_value=4,default=2)
    user_color=serializers.ChoiceField(choices=['w','b'],default='w')
    def validate_bot_name(self,value):
        value={'Judit Polgár':'Judit Polgar'}.get(value,value)
        if value not in BOT_NAMES:
            raise serializers.ValidationError('Choose one of the five available training bots.')
        return value

class MoveSerializer(serializers.Serializer):
    uci=serializers.RegexField(r'^[a-h][1-8][a-h][1-8][qrbn]?$')

class RoomSerializer(serializers.Serializer):
    minutes=serializers.ChoiceField(choices=[10,15,20],default=10)

class PuzzleCheckSerializer(serializers.Serializer):
    puzzle_id=serializers.CharField(max_length=2048)
    uci=serializers.RegexField(r'^[a-h][1-8][a-h][1-8][qrbn]?$')
