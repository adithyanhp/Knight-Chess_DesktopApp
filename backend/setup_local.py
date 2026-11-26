#!/usr/bin/env python3
"""Create private local configuration without printing credentials."""
from pathlib import Path
import secrets

root=Path(__file__).resolve().parent.parent
target=root/'.env'
if target.exists():
    print('An .env file already exists; keeping your configuration.')
else:
    contents=(root/'.env.example').read_text()
    contents=contents.replace('replace-with-a-long-random-secret',secrets.token_urlsafe(64))
    contents=contents.replace('replace-with-a-random-database-password',secrets.token_urlsafe(32))
    with target.open('x') as file:
        file.write(contents)
    target.chmod(0o600)
    print('Local configuration created.')
print('Follow Local_Setup_Guide.md for manual Windows setup.')
print('Optional Docker setup: docker compose up --build -d')
