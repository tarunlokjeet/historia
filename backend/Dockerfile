# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for audio processing
RUN apt-get update && apt-get install -y \
    ffmpeg \
    portaudio19-dev \
    python3-dev \
    gcc \
    g++ \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Install Ollama
RUN curl -fsSL https://ollama.com/install.sh | sh

# Copy application code
COPY . .

# Create directory for Ollama
RUN mkdir -p /root/.ollama

# Expose port
EXPOSE 8000

# Start script that runs Ollama and FastAPI
CMD ["sh", "-c", "ollama serve & sleep 10 && ollama pull llama3.2:1b && python -m uvicorn main:app --host 0.0.0.0 --port 8000"]