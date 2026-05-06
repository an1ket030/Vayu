FROM python:3.11-slim

WORKDIR /app

# Install system deps needed for numpy/scikit-learn native extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install heavy packages first (better layer caching + increased timeout/retries)
RUN pip install --no-cache-dir \
    --timeout=300 \
    --retries=5 \
    --index-url https://pypi.org/simple/ \
    numpy==1.26.4 pandas==2.2.0 scikit-learn==1.4.1.post1 xgboost==2.0.3

# Install remaining lighter packages
RUN pip install --no-cache-dir \
    --timeout=120 \
    --retries=3 \
    fastapi==0.109.2 \
    uvicorn==0.27.1 \
    "requests>=2.31.0" \
    "charset-normalizer>=2.0.0,<4" \
    python-dotenv==1.0.1 \
    pydantic==2.6.1 \
    pydantic-settings==2.1.0

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
