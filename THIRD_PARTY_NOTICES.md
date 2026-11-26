# Third-party components and identity

Knight uses original interface code, original educational text, and original SVG artwork. The dark charcoal and green visual direction is inspired by familiar online chess interfaces. Knight is an independent personal project and is not affiliated with Chess.com or the named chess players.

Magnus Carlsen, Hikaru Nakamura, Viswanathan Anand, Judit Polgár, and Garry Kasparov are used as names of independent practice bots. Their illustrated avatars are symbolic original artwork. The coach provides prepared training guidance, not statements or lessons authored by Magnus Carlsen. Bot difficulty labels do not certify a player rating.

Dependencies retain their upstream licenses. Consult the installed packages and their official repositories for complete license texts and notices:

- React and React DOM: MIT, https://github.com/facebook/react
- Vite: MIT, https://github.com/vitejs/vite
- chess.js: BSD-2-Clause, https://github.com/jhlywa/chess.js
- Lucide: ISC, https://github.com/lucide-icons/lucide
- Django: BSD-3-Clause, https://github.com/django/django
- Django REST Framework: BSD-3-Clause, https://github.com/encode/django-rest-framework
- django-cors-headers: MIT, https://github.com/adamchainz/django-cors-headers
- python-chess: GPL-3.0-or-later, https://github.com/niklasf/python-chess
- Stockfish: GPL-3.0, https://github.com/official-stockfish/Stockfish
- Psycopg 3 and psycopg-binary: LGPL-3.0; preserve the packages' license and bundled-library notices, https://github.com/psycopg/psycopg
- Gunicorn: MIT, https://github.com/benoitc/gunicorn
- PostgreSQL: PostgreSQL License, https://www.postgresql.org/about/licence/
- nginx: BSD-2-Clause, https://nginx.org/LICENSE

The backend Docker image installs Stockfish from Debian's package repository. This source archive does not contain an engine binary. If you redistribute images or modified engine/library code, follow the applicable upstream source-distribution and notice obligations.

DM Sans and Manrope use the SIL Open Font License. Font packages include their license notices.

No additional project-wide open-source license has been selected for this personal-use source export. This does not remove any upstream license terms. If you publish an open-source release, choose a compatible project license and include its full LICENSE text. The manual source packager includes an added LICENSE or COPYING file automatically.
