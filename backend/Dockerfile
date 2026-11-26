FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=8000
RUN apt-get update && apt-get install -y --no-install-recommends stockfish ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN useradd --create-home appuser && chown -R appuser:appuser /app && chmod +x /app/start.sh
USER appuser
EXPOSE 8000
CMD ["/app/start.sh"]
