"""Deployment configuration and health tests; no cloud credentials or network needed."""
from io import StringIO
from pathlib import Path
from unittest.mock import MagicMock, patch

from django.core.exceptions import ImproperlyConfigured
from django.core.management import call_command
from django.core.management.base import CommandError
from django.db import OperationalError
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APIClient

from config.database import (
    allowed_hosts_from_environment,
    comma_separated,
    database_from_environment,
    database_from_url,
)


class DatabaseConfigurationTests(SimpleTestCase):
    def test_neon_url_decodes_credentials_once_and_keeps_tls_options(self):
        config = database_from_url(
            'postgresql://user%40domain:p%40ss%3Aword%2F%2B%2525@'
            'example-pooler.neon.tech:5432/chess%20club?'
            'sslmode=require&channel_binding=require&connect_timeout=30&'
            'application_name=Knight+Chess&options=-c%20statement_timeout%3D30000'
        )
        self.assertEqual(config['USER'], 'user@domain')
        self.assertEqual(config['PASSWORD'], 'p@ss:word/+%25')
        self.assertEqual(config['NAME'], 'chess club')
        self.assertEqual(config['HOST'], 'example-pooler.neon.tech')
        self.assertEqual(config['OPTIONS']['sslmode'], 'require')
        self.assertEqual(config['OPTIONS']['channel_binding'], 'require')
        self.assertEqual(config['OPTIONS']['connect_timeout'], 30)
        self.assertEqual(config['OPTIONS']['application_name'], 'Knight Chess')
        self.assertEqual(config['OPTIONS']['options'], '-c statement_timeout=30000')
        self.assertTrue(config['CONN_HEALTH_CHECKS'])
        self.assertTrue(config['DISABLE_SERVER_SIDE_CURSORS'])

    def test_both_postgres_schemes_default_to_tls_and_default_port(self):
        for scheme in ('postgres','postgresql'):
            with self.subTest(scheme=scheme):
                config = database_from_url(f'{scheme}://player:password@example.neon.tech/chess')
                self.assertEqual(config['PORT'], '5432')
                self.assertEqual(config['OPTIONS']['sslmode'], 'require')

    def test_stronger_tls_options_and_literal_plus_credentials_are_preserved(self):
        config = database_from_url(
            'postgres://player+tag:pass+word@example.neon.tech/chess?'
            'sslmode=verify-full&sslrootcert=%2Fetc%2Fssl%2Fcerts%2Fca-certificates.crt&channel_binding=require'
        )
        self.assertEqual(config['USER'], 'player+tag')
        self.assertEqual(config['PASSWORD'], 'pass+word')
        self.assertEqual(config['OPTIONS']['sslmode'], 'verify-full')
        self.assertEqual(config['OPTIONS']['sslrootcert'], '/etc/ssl/certs/ca-certificates.crt')

    def test_invalid_urls_fail_without_disclosing_credentials(self):
        values = [
            'mysql://player:never-log-this@example.net/chess',
            'postgresql://player:never-log-this@example.net',
            'postgresql://player:never-log-this@example.net:invalid/chess',
            'postgresql://player:never-log-this@example.net:0/chess',
            'postgresql://player:never-log-this@example.net/chess#fragment',
            'postgresql://player:never-log-this%@example.net/chess',
            'postgresql://player:never-log-this%00@example.net/chess',
        ]
        for value in values:
            with self.subTest(value=value):
                with self.assertRaises(ImproperlyConfigured) as error:
                    database_from_url(value)
                self.assertNotIn('never-log-this', str(error.exception))
                self.assertNotIn('example.net', str(error.exception))

    def test_ambiguous_query_overrides_and_invalid_tls_values_are_rejected(self):
        for query in ('sslmode=require&sslmode=disable', 'password=never-log-this',
                      'sslmode=', 'sslmode=incorrect', 'channel_binding=incorrect',
                      'connect_timeout=0', 'connect_timeout=unbounded'):
            with self.subTest(query=query):
                with self.assertRaises(ImproperlyConfigured):
                    database_from_url('postgresql://player:password@example.net/chess?' + query)

    def test_remote_tls_cannot_silently_downgrade_but_local_override_is_allowed(self):
        for mode in ('disable','allow','prefer'):
            with self.assertRaises(ImproperlyConfigured):
                database_from_url('postgresql://player:password@example.net/chess?sslmode=' + mode)
        local = database_from_url('postgresql://player:password@127.0.0.1/chess?sslmode=disable')
        self.assertEqual(local['OPTIONS']['sslmode'], 'disable')

    def test_explicit_test_override_and_local_postgres_fallback(self):
        base = Path('/temporary-test-base')
        local = database_from_environment({'POSTGRES_DB':'custom','POSTGRES_HOST':'127.0.0.1',
                                           'POSTGRES_USER':'player','POSTGRES_PASSWORD':'local-only','POSTGRES_PORT':'5433'}, base)
        self.assertEqual(local['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(local['NAME'], 'custom')
        self.assertEqual(local['PORT'], '5433')
        self.assertNotIn('sslmode', local['OPTIONS'])
        url = 'postgresql://player:password@example.net/cloud'
        cloud = database_from_environment({'DATABASE_URL':url,'POSTGRES_DB':'ignored','SQLITE_TEST':'0'}, base)
        self.assertEqual(cloud['NAME'], 'cloud')
        test = database_from_environment({'SQLITE_TEST':'1','DATABASE_URL':url}, base)
        self.assertEqual(test['ENGINE'], 'django.db.backends.sqlite3')
        self.assertEqual(test['NAME'], base/'test.sqlite3')

    def test_render_hostname_and_exact_trimmed_origins(self):
        hosts = allowed_hosts_from_environment({'DJANGO_ALLOWED_HOSTS':'localhost, custom.example, ',
                                               'RENDER_EXTERNAL_HOSTNAME':' knight-api.onrender.com '})
        self.assertEqual(hosts, ['localhost','custom.example','knight-api.onrender.com'])
        self.assertNotIn('*', hosts)
        self.assertNotIn('testserver', hosts)
        self.assertIn('testserver', allowed_hosts_from_environment({'SQLITE_TEST':'1'}))
        self.assertEqual(comma_separated(' https://knight.vercel.app , , http://localhost:5173,https://knight.vercel.app '),
                         ['https://knight.vercel.app','http://localhost:5173'])


class HealthCheckTests(TestCase):
    def test_health_reaches_the_database_without_authentication_or_engine_startup(self):
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION='Token obsolete-token')
        with patch('rest_framework.authentication.TokenAuthentication.authenticate',side_effect=AssertionError('Health must not authenticate')):
            with patch('chessapp.engine.open_engine',side_effect=AssertionError('Health must not start Stockfish')):
                response = client.get('/api/health')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['status'], 'ok')
        self.assertTrue(response.data['database_reachable'])
        self.assertEqual(response.data['service'], 'Knight Django API')
        self.assertEqual(response.data['database'], 'sqlite3')
        self.assertIsInstance(response.data['stockfish'], bool)

    def test_database_failure_is_sanitized_and_returns_503(self):
        with patch('chessapp.views.connection.cursor',side_effect=OperationalError('password=never-log-this host=private-host')):
            response = APIClient().get('/api/health')
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.data['status'], 'unavailable')
        self.assertFalse(response.data['database_reachable'])
        self.assertNotIn('never-log-this', response.content.decode())
        self.assertNotIn('private-host', response.content.decode())


class DatabaseStartupTests(SimpleTestCase):
    def test_startup_retries_a_cold_database_and_then_succeeds(self):
        database = MagicMock()
        cursor = MagicMock()
        cursor.__enter__.return_value.fetchone.return_value = (1,)
        database.cursor.side_effect = [OperationalError('never-log-this'), cursor]
        output = StringIO()
        with patch('chessapp.management.commands.wait_for_db.connections', {'default':database}):
            call_command('wait_for_db', attempts=2, delay=0, stdout=output)
        self.assertEqual(database.cursor.call_count, 2)
        database.close.assert_called_once()
        self.assertIn('Database is ready.', output.getvalue())
        self.assertNotIn('never-log-this', output.getvalue())

    def test_startup_failure_is_bounded_and_does_not_disclose_credentials(self):
        database = MagicMock()
        database.cursor.side_effect = OperationalError('password=never-log-this')
        output = StringIO()
        with patch('chessapp.management.commands.wait_for_db.connections', {'default':database}):
            with self.assertRaises(CommandError) as error:
                call_command('wait_for_db', attempts=2, delay=0, stdout=output)
        self.assertEqual(database.cursor.call_count, 2)
        self.assertNotIn('never-log-this', str(error.exception) + output.getvalue())
