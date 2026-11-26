"""Wait briefly for a cold or restarting database before applying migrations."""
import time

from django.core.management.base import BaseCommand, CommandError
from django.db import DatabaseError, connections


class Command(BaseCommand):
    help = 'Wait for the configured database without logging connection credentials.'
    requires_system_checks = []

    def add_arguments(self, parser):
        parser.add_argument('--attempts', type=int, default=10)
        parser.add_argument('--delay', type=float, default=2)

    def handle(self, *args, **options):
        attempts, delay = options['attempts'], options['delay']
        if not 1 <= attempts <= 30 or not 0 <= delay <= 10:
            raise CommandError('Use 1–30 attempts and a delay of 0–10 seconds.')
        database = connections['default']
        for attempt in range(1, attempts + 1):
            try:
                with database.cursor() as cursor:
                    cursor.execute('SELECT 1')
                    if cursor.fetchone() != (1,):
                        raise DatabaseError('Unexpected database readiness result.')
                self.stdout.write('Database is ready.')
                return
            except (DatabaseError, OSError):
                database.close()
                if attempt < attempts:
                    self.stdout.write(f'Waiting for database ({attempt}/{attempts})…')
                    time.sleep(delay)
        raise CommandError('Database is not reachable. Check the database environment variables and try again.') from None
