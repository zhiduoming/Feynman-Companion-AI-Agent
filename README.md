# Feynman Companion AI Agent

费曼伴学智能体 demo 仓库，当前采用前后端同仓管理：

- `frontend/`: Vue 3 + Vite + Pinia 聊天界面
- `backend/`: FastAPI 后端服务、DeepSeek 调用、会话状态与测试
- `docs/`: 产品需求、接口文档和项目资料

## Quick Start

### 1. Start Backend

```bash
cd /Users/chen/Code/Feynman-Companion-AI-Agent
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

后端默认监听 `http://localhost:8000`，Swagger 文档在 `http://localhost:8000/docs`。

本地 DeepSeek 配置仍然放在根目录 `.env.local`，该文件不会提交到 Git。组员第一次启动前可以先复制示例文件：

```bash
cp .env.local.example .env.local
```

然后在 `.env.local` 里填自己的 DeepSeek API key：

```env
DEEPSEEK_API_KEY=your_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
LLM_PROVIDER=deepseek
REQUEST_TIMEOUT_SECONDS=45
```

### 2. Start Frontend

```bash
cd /Users/chen/Code/Feynman-Companion-AI-Agent/frontend
npm install
npm run dev
```

前端默认监听 `http://localhost:5173`，开发环境会把 `/api` 代理到 `http://127.0.0.1:8000`。

## Project Layout

```text
Feynman-Companion-AI-Agent/
├── backend/
│   ├── app/                  # FastAPI application code
│   ├── scripts/              # Backend helper scripts
│   ├── tests/                # Backend tests
│   ├── requirements.txt      # Python dependencies
│   └── README.md
├── frontend/
│   ├── src/                  # Vue frontend source code
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.js        # Vite dev server and proxy config
│   ├── .env.development      # Frontend development env
│   └── README.md
├── docs/
│   └── backend-api.md        # Frontend-backend API contract
├── .env.local.example        # Local backend env template
├── .env.local                # Local backend secrets, ignored by Git
└── README.md
```

## Useful Commands

```bash
# Backend tests
source .venv/bin/activate
pytest -q backend/tests

# Frontend production build
cd frontend
npm run build
```

## Demo Flow

1. 前端页面初始化时请求 `GET /api/v1/feynman/greeting`。
2. 用户输入讲解后，前端请求 `POST /api/v1/feynman/chat`。
3. 后端围绕 Dijkstra 算法进行追问，最多 3 轮正式追问。
4. 达到报告条件后，后端返回 `generate_report`，前端展示诊断报告。
5. 用户点击重新开始时，前端请求 `POST /api/v1/feynman/reset`。

详细接口见 `docs/backend-api.md`。
