# Feynman Companion Backend MVP

Minimal FastAPI backend for the week-3 Feynman companion demo.

## Run

```bash
cd /Users/chen/Code/Feynman-Companion-AI-Agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

## Local Env

`.env.local` is ignored by Git. Fill only the API key:

```env
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
LLM_PROVIDER=deepseek
```

Use mock mode without a model call:

```env
LLM_PROVIDER=mock
```

## API

- `GET /health`
- `GET /api/v1/feynman/greeting`
- `POST /api/v1/feynman/chat`
- `POST /api/v1/feynman/reset`
- `GET /api/v1/feynman/session/{session_id}`

Request:

```json
{
  "session_id": "uuid-string",
  "user_input": "用户对 Dijkstra 算法的讲解"
}
```

See `docs/backend-api.md` for frontend integration details.
