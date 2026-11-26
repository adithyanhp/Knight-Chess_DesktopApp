"""Parse deployment database configuration without exposing connection secrets."""
import re
from urllib.parse import parse_qsl, unquote, urlsplit

from django.core.exceptions import ImproperlyConfigured


# These are libpq connection options, passed as values to psycopg, never to a shell.
# Connection identity remains in the URL authority/path rather than query overrides.
CONNECTION_OPTIONS = {
    'sslmode', 'channel_binding', 'sslrootcert', 'sslcert', 'sslkey', 'sslpassword',
    'sslcrl', 'sslcrldir', 'ssl_min_protocol_version', 'ssl_max_protocol_version',
    'sslsni', 'connect_timeout', 'application_name', 'options', 'keepalives',
    'keepalives_idle', 'keepalives_interval', 'keepalives_count', 'tcp_user_timeout',
    'target_session_attrs', 'gssencmode',
}
LOCAL_DATABASE_HOSTS = {'localhost', '127.0.0.1', '::1', 'db'}


def database_from_url(value):
    """Accept standard postgres/postgresql URLs, including Neon pooled URLs."""
    try:
        value = value.strip()
        if re.search(r'%(?![0-9a-fA-F]{2})', value) or any(ord(c) < 32 for c in value):
            raise ValueError
        parsed = urlsplit(value)
        if parsed.scheme not in {'postgres', 'postgresql'} or parsed.fragment:
            raise ValueError
        hostname = parsed.hostname
        port = parsed.port if parsed.port is not None else 5432
        name = unquote(parsed.path[1:], errors='strict') if parsed.path.startswith('/') else ''
        user = unquote(parsed.username or '', errors='strict')
        password = unquote(parsed.password or '', errors='strict')
        if not hostname or not name or not user or not 1 <= port <= 65535 or any('\x00' in part for part in (hostname,name,user,password)):
            raise ValueError
        pairs = parse_qsl(parsed.query, keep_blank_values=True, strict_parsing=True,
                          encoding='utf-8', errors='strict', max_num_fields=30)
    except (ValueError, UnicodeError, TypeError):
        raise ImproperlyConfigured(
            'DATABASE_URL must be a valid postgres:// or postgresql:// connection URL '
            'with a host, user, and database name. Percent-encode special characters in credentials.'
        ) from None

    options = {'sslmode': 'require', 'connect_timeout': 10}
    seen = set()
    for key, option in pairs:
        if key not in CONNECTION_OPTIONS or key in seen or not option or '\x00' in option:
            raise ImproperlyConfigured('DATABASE_URL contains an unsupported, duplicate, or empty connection option.')
        seen.add(key)
        options[key] = option
    if options['sslmode'] not in {'disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'}:
        raise ImproperlyConfigured('DATABASE_URL contains an invalid sslmode option.')
    if hostname not in LOCAL_DATABASE_HOSTS and options['sslmode'] in {'disable', 'allow', 'prefer'}:
        raise ImproperlyConfigured('A remote DATABASE_URL must use sslmode=require, verify-ca, or verify-full.')
    if options.get('channel_binding', 'prefer') not in {'disable', 'prefer', 'require'}:
        raise ImproperlyConfigured('DATABASE_URL contains an invalid channel_binding option.')
    try:
        timeout = int(options['connect_timeout'])
        if not 1 <= timeout <= 120:
            raise ValueError
        options['connect_timeout'] = timeout
    except (ValueError, TypeError):
        raise ImproperlyConfigured('DATABASE_URL connect_timeout must be between 1 and 120 seconds.') from None

    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': name,
        'USER': user,
        'PASSWORD': password,
        'HOST': hostname,
        'PORT': str(port),
        'OPTIONS': options,
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
        # Neon pooled connections use transaction pooling; cursors must not outlive a transaction.
        'DISABLE_SERVER_SIDE_CURSORS': True,
    }


def database_from_environment(environ, base_dir):
    if environ.get('SQLITE_TEST', '0') == '1':
        return {'ENGINE': 'django.db.backends.sqlite3', 'NAME': base_dir / 'test.sqlite3'}
    if environ.get('DATABASE_URL', '').strip():
        return database_from_url(environ['DATABASE_URL'])
    return {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': environ.get('POSTGRES_DB', 'knight'),
        'USER': environ.get('POSTGRES_USER', 'knight'),
        'PASSWORD': environ.get('POSTGRES_PASSWORD', ''),
        'HOST': environ.get('POSTGRES_HOST', 'db'),
        'PORT': environ.get('POSTGRES_PORT', '5432'),
        'OPTIONS': {'connect_timeout': 10},
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }


def comma_separated(value):
    """Preserve exact origins/hosts while trimming environment-variable whitespace."""
    return list(dict.fromkeys(part.strip() for part in value.split(',') if part.strip()))


def allowed_hosts_from_environment(environ):
    hosts = comma_separated(environ.get('DJANGO_ALLOWED_HOSTS', 'localhost,127.0.0.1,backend'))
    render_host = environ.get('RENDER_EXTERNAL_HOSTNAME', '').strip()
    if render_host and render_host not in hosts:
        hosts.append(render_host)
    if environ.get('SQLITE_TEST', '0') == '1' and 'testserver' not in hosts:
        hosts.append('testserver')
    return hosts
