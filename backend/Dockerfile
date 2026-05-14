# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Instalar dependências de build do sistema
RUN apt-get update && apt-get install -y gcc postgresql-client && rm -rf /var/lib/apt/lists/*

# Instalar dependências Python em um diretório temporário
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt


# Runtime stage
FROM python:3.11-slim

WORKDIR /app

# Copiar wheels da fase de build
COPY --from=builder /app/wheels /wheels
COPY --from=builder /app/requirements.txt .

# Instalar wheels e dependências de runtime do sistema
RUN pip install --no-cache /wheels/* && apt-get update && apt-get install -y postgresql-client curl && rm -rf /var/lib/apt/lists/*

# Copiar código
COPY . .

# Variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Porta
EXPOSE 8000

# Comando padrão
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]