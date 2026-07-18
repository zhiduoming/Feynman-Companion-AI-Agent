# 费曼伴学前端 MVP

基于 Vue 3 + Vite + Pinia 的单屏沉浸式对话窗口。

## Run

```bash
cd /Users/chen/Code/Feynman-Companion-AI-Agent/frontend
npm install
npm run dev
```

默认监听 `http://localhost:5173`。

## Mock / Backend

修改 `frontend/.env.development`：

```ini
# false: greeting/chat/reset 调真实 LangGraph 后端
VITE_USE_FEYNMAN_MOCK=false

# true: 上传、教材树、KP 接口暂时使用前端 Mock
VITE_USE_MATERIAL_MOCK=true

# 前端等待时间要大于后端 DeepSeek 超时，给 Mock 兜底留出返回时间
VITE_API_TIMEOUT_MS=60000
```

`VITE_USE_MOCK` 仅作为旧配置的兼容回退。新配置应分别设置两个开关，避免教材后端尚未接入时阻塞真实 Feynman 对话联调。

`frontend/vite.config.js` 中已配置 `/api` 代理到 `http://127.0.0.1:8000`。

## Structure

```text
src/
├── api/                # API layer and mock data
├── components/         # Chat bubbles, input, report card, chart
├── stores/             # Pinia state
├── styles/             # Global CSS
├── views/              # Page-level views
├── App.vue
└── main.js
```

## Current Demo Behavior

- 首屏自动展示后端引导问题。
- 用户发送解释后，后端返回追问或最终报告。
- `generate_report` 返回后，前端展示报告卡片并锁定输入框。
- 点击重新开始时，前端调用后端 reset 接口。
