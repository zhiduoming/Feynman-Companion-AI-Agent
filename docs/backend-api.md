# 费曼伴学智能体后端接口文档 MVP

本文档面向前端对接，覆盖第三周 demo 所需的最小后端接口。

## 基础信息

- 后端地址：`http://localhost:8000`
- Swagger 文档：`http://localhost:8000/docs`
- 主要知识点：`Dijkstra 算法`
- 会话机制：前端页面初始化时生成一个 `session_id`，同一轮对话必须一直使用同一个 `session_id`

## 1. 健康检查

```http
GET /health
```

示例响应：

```json
{
  "status": "ok",
  "app": "Feynman Companion Backend",
  "llm_provider": "deepseek",
  "deepseek_configured": true
}
```

前端一般不需要调用；联调时可以用来确认后端是否启动、DeepSeek 配置是否读取成功。

## 2. 初始引导语

```http
GET /api/v1/feynman/greeting
```

示例响应：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "reply_text": "请你向我讲解一下 Dijkstra 算法的核心原理，讲得越详细越好。"
  }
}
```

前端处理：页面初始化时展示为第一条 AI 气泡。

## 3. 费曼对话接口

```http
POST /api/v1/feynman/chat
Content-Type: application/json
```

请求体：

```json
{
  "session_id": "demo-001",
  "user_input": "Dijkstra 是用来求图中最短路径的算法。"
}
```

字段说明：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `session_id` | string | 是 | 前端生成的会话 ID。同一轮对话保持不变 |
| `user_input` | string | 是 | 用户输入内容，最大 500 字 |

### 响应结构

所有成功响应都遵循：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "next_action": "follow_up",
    "reply_text": "AI 回复文本",
    "card_preview": null,
    "final_report": null
  }
}
```

### next_action 前端处理规则

| `next_action` | 含义 | 前端处理 |
| --- | --- | --- |
| `follow_up` | AI 继续追问 | 展示一条 AI 气泡，解锁输入框，允许用户继续回答 |
| `guide_topic` | 用户偏题 | 展示一条 AI 引导气泡，解锁输入框，本轮不算正式追问 |
| `generate_report` | 对话结束，生成报告 | 展示 AI 气泡，渲染底部报告卡片，锁定输入框 |

### follow_up 示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "next_action": "follow_up",
    "reply_text": "如果图里出现负权边，这个方法还能保证正确吗？为什么？",
    "card_preview": null,
    "final_report": null
  }
}
```

### guide_topic 示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "next_action": "guide_topic",
    "reply_text": "这个问题先放一放，我们这轮只围绕 Dijkstra 算法。你可以先讲讲它解决什么问题。",
    "card_preview": null,
    "final_report": null
  }
}
```

### generate_report 示例

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "next_action": "generate_report",
    "reply_text": "这轮讲解先到这里，我给你整理了一份诊断报告。",
    "card_preview": {
      "total_score": 32,
      "summary": "掌握流程，原理需补强"
    },
    "final_report": {
      "dimensions": [
        {
          "name": "理解深度",
          "score": 8,
          "analysis": "对核心机制有基本理解，但正确性依据仍需补强。",
          "suggestion": "补充非负权前提与贪心选择成立原因。"
        },
        {
          "name": "表达完整性",
          "score": 8,
          "analysis": "覆盖了主要流程，但部分边界条件没有讲清楚。",
          "suggestion": "讲解时加入适用条件和常见误区。"
        },
        {
          "name": "逻辑连贯性",
          "score": 8,
          "analysis": "步骤顺序基本清晰，但因果解释略弱。",
          "suggestion": "用“为什么可以确定最短路”串起整体逻辑。"
        },
        {
          "name": "结构化能力",
          "score": 8,
          "analysis": "表达能形成基本结构。",
          "suggestion": "按“用途-前提-步骤-原理”组织。"
        }
      ],
      "overall_comment": "本次讲解已经覆盖部分核心内容，后续重点是把非负权前提、贪心选择和松弛操作之间的因果关系讲清楚。"
    }
  }
}
```

## 4. 重置会话

用于前端“重新开始”按钮。

```http
POST /api/v1/feynman/reset
Content-Type: application/json
```

请求体：

```json
{
  "session_id": "demo-001"
}
```

响应：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "session_id": "demo-001",
    "reset": true
  }
}
```

前端处理：清空聊天区，重新展示初始引导语，解锁输入框。

## 5. Session 调试接口

仅用于开发联调，不建议展示给用户。

```http
GET /api/v1/feynman/session/{session_id}
```

示例响应：

```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "session_id": "demo-001",
    "exists": true,
    "follow_up_count": 2,
    "invalid_answer_count": 0,
    "off_topic_count": 0,
    "ended": false,
    "message_count": 4,
    "last_provider": "deepseek",
    "fallback_used": false,
    "recent_messages": []
  }
}
```

字段说明：

| 字段 | 说明 |
| --- | --- |
| `follow_up_count` | 已发起的正式追问次数，最多 3 |
| `invalid_answer_count` | 用户输入“不会/不知道”等无效回答次数 |
| `off_topic_count` | 偏题次数 |
| `ended` | 是否已经生成最终报告 |
| `last_provider` | 最近一次响应来源：`deepseek`、`mock`、`rule` |
| `fallback_used` | DeepSeek 调用失败后是否使用 mock 兜底 |

## 前端联调注意事项

1. 同一轮对话必须复用同一个 `session_id`。
2. 页面刷新或点击“重新开始”时，建议生成新的 `session_id`，或调用 reset 接口。
3. 请求发出后锁定输入框和发送按钮，接口返回后再根据 `next_action` 决定是否解锁。
4. `generate_report` 返回后，本轮对话结束，输入框应保持锁定。
5. `card_preview` 和 `final_report` 只有在 `next_action=generate_report` 时才不是 `null`。
