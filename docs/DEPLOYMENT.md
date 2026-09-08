# Production Deployment Guide

## 1. Local Production Deployment (Single Container / Python)

The platform compiles into an all-in-one distribution where FastAPI serves both the REST API and the built static React terminal:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Build frontend distribution
cd frontend && npm install && npm run build && cd ..

# 3. Start server
python3 -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
Open `http://localhost:8000/`.

---

## 2. Docker Compose Deployment

```bash
docker-compose up -d --build
```
Services started:
- `backend`: FastAPI Python 3.12 container on port 8000
- `frontend`: Nginx Alpine serving optimized React production bundle on port 3000

---

## 3. Production Environment Configuration

Set in `.env` or cloud secret manager:
```ini
ENVIRONMENT=production
DEMO_MODE=false
DATABASE_URL=postgresql+asyncpg://user:password@pg-host:5432/macro_db
REDIS_URL=redis://redis-host:6379/0
CACHE_ENABLED=true
POLL_INTERVAL_SECONDS=300
AI_API_KEY=your_gemini_or_openai_key
LOG_LEVEL=INFO
```
