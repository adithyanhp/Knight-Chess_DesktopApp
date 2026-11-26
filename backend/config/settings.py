"""Django configuration. PostgreSQL is the default; SQLite is for unit tests only."""
import os
from pathlib import Path
from django.core.exceptions import ImproperlyConfigured
from .database import allowed_hosts_from_environment, comma_separated, database_from_environment

BASE_DIR = Path(__file__).resolve().parent.parent
DEBUG = os.getenv('DJANGO_DEBUG', '0') == '1'
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', '')
if not SECRET_KEY:
    if DEBUG or os.getenv('SQLITE_TEST', '0') == '1':
        SECRET_KEY = 'development-only-change-before-deployment-8127'
    else:
        raise ImproperlyConfigured('Set DJANGO_SECRET_KEY to a long random value.')
ALLOWED_HOSTS = allowed_hosts_from_environment(os.environ)
INSTALLED_APPS = [
    'django.contrib.auth', 'django.contrib.contenttypes', 'django.contrib.sessions',
    'django.contrib.messages', 'django.contrib.staticfiles',
    'rest_framework', 'rest_framework.authtoken', 'corsheaders', 'chessapp',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware', 'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware', 'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware', 'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware', 'django.middleware.clickjacking.XFrameOptionsMiddleware',
]
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
DATABASES = {'default': database_from_environment(os.environ, BASE_DIR)}
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.TokenAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_THROTTLE_CLASSES': ['rest_framework.throttling.AnonRateThrottle','rest_framework.throttling.UserRateThrottle'],
    'DEFAULT_THROTTLE_RATES': {'anon': '60/min', 'user': '600/min', 'auth': '12/min', 'engine':'30/min'},
    'EXCEPTION_HANDLER': 'chessapp.errors.exception_handler',
}
CORS_ALLOWED_ORIGINS = comma_separated(os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080'))
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
APPEND_SLASH = False
DATA_UPLOAD_MAX_MEMORY_SIZE = 3 * 1024 * 1024
STOCKFISH_PATH = os.getenv('STOCKFISH_PATH', '/usr/games/stockfish')
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
