FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias del sistema requeridas para compilar paquetes si fuera necesario
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el código de la aplicación
COPY app/ ./app/

# Crear directorio para subida de multimedia
RUN mkdir -p /uploads/laptops

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
