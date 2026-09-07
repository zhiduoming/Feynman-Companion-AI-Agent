# 费曼伴学智能体 第九周 PRD（V1.0）

版本：V1.0

日期：2026-09-06

周期：第九周

范围：中期里程碑 · 端到端主链路打通联调（前八周功能点串通）+ 复习闭环落地 + 体验打磨（P1）

团队：2 后端 + 1 前端

前置基线：第八周已完成复习上下文的数据契约、Provider 骨架与 LangGraph 注入、复习 greeting 骨架（当前 provider 为桩：仅 `session-test-review` 命中 mock，真实数据源未接）；第七周 SRS/学情统计/报告 UI 已落地；后端 82 个测试通过。

定位说明：第九周为**中期目标里程碑**——不做横向新功能扩张，而是把前八周累积的功能点打通成一条用户可完整走通的端到端主链路，并收口复习闭环、整合 UI 体验问题。

---

## 一、产品概述与本周目标

### 1.1 本周核心目标

本周的核心交付物是**一条用户能完整走通的端到端主链路**（中期里程碑）。链路每一步都对应前八周某一周的产出，第九周把它们串起来做打通联调，把「桩」换成「真」：

> **注册登录 → 选择学情画像 → 上传教材自动分解知识点 → 基于学情的个性化费曼对话 → 生成学习报告 + 复习计划 → 「今日待复习」显示当天到期知识点（SRS 间隔提醒）→ 复习后成功落库 → 查看「本次 vs 上次」报告对比。**

围绕这条主链路，本周三大块工作：

1. **端到端主链路打通（P0，本周第一优先级）**
   用真实账号完整走通上面整条链路，把各环节的衔接处打通——重点是第八周尚未落地、当前仍是「桩」的后半段（见第 3 点）。前半段（注册/画像/教材分解/个性化对话/报告+复习计划）第七周前已基本实现，本周以联调收口为主。

2. **复习闭环从「桩」到「真」（P0）**
   第八周只做了 `review_context` 骨架与桩 provider，真正让闭环运转的 `review_attempt` 表、`/reviews/start`、`/reviews/{id}`、按得分自动收敛漏洞、复习结果对比，仓库里都还没有。本周把它们落地，使链路的第 6~8 步真正可用。

3. **学习体验打磨（P1，整合历史 UI 问题）**
   报告抽屉内容去重（收敛为「教材重读指引」唯一复习建议源）、漏洞卡片与「今日待复习」显示 `next_review_at` 复习时间、上传页「教材名称必填 + 显式上传按钮」。若时间不足，只保证 P0 链路全通，P1 顺延第十周。

> 语义约定：掌握阈值沿用「单维度 0~6 未掌握 / 7~10 已掌握，6 分仍属未掌握」；`review_count` 只在有效复习报告成功落库后递增；新报告永远新增、不覆盖旧报告；同一事务内完成「报告 + review_attempt + 漏洞收敛」；以上为第九周实现的唯一标准，各处不得各自硬编码。

### 1.2 本周非目标（顺延后续）

1. 错题库 / 错题拍照 / 错题复盘
2. 主观题训练场景
3. SRS 定时推送通知（外部通知渠道）
4. 完整学科定制化追问 Prompt（数学/政治/计算机/英语差异化，等教材库覆盖多学科后启动）
5. 系统预设教材库
6. 知识图谱 / 双模型核验 / 模型微调
7. 跨教材综合复习与长期学习计划自动编排
8. rubric 二次 LLM 校验（历史 V1.5 遗留项，本期仍不启动）
9. 对话 SSE 流式输出

### 1.3 成功指标

| 指标 | 目标值 |
|---|---|
| 端到端主链路走通：注册→画像→上传分解→个性化对话→报告+复习计划→到期提醒→复习落库→对比，全环节无断点 | 100% |
| `/reviews/start` 新建/恢复/409 三分支正确返回 | 100% |
| 复习报告落库后目标漏洞自动收敛正确（7~10→resolved，0~6→保持 reviewing） | 100% |
| `review_count` 只在有效报告保存后 +1（点击开始不 +1、中途退出不 +1、重复提交不重复 +1） | 100% |
| 报告、attempt、漏洞更新处于同一事务，失败整体回滚 | 100% |
| `GET /reviews/{review_id}` 的 dimension_changes 与落库结果一致 | 100% |
| 复习入口（知识漏洞/今日待复习）能进对应 KP 对话并保留复习目标 | 100% |
| 直接 `PATCH /gaps/{id}` 置 reviewing 返回 400 | 100% |
| 体验项：上传名称必填提示 + 显式上传按钮；漏洞显示下次复习时间；报告抽屉无重复区块 | 100%（P1） |
| 后端新增状态转换/幂等/隔离/降级测试，全量测试通过 | 100% |

---

## 二、团队分工

| 角色 | 负责模块 |
|---|---|
| 马茗燕 | ① review_context 真实化（桩 → 真数据源）；② 复习对比 Prompt 与输出结构；③ 复习 greeting 收口；④ 报告结构体验收敛（P1，prompt/模型侧）；⑤ 针对性追问与防重复（P1） |
| 陈艺博 | ① review_attempt 表 + 字段迁移；② `/reviews/start`；③ 复习报告落库事务与漏洞自动收敛 + review_count 语义迁移 + PATCH 约束；④ `/reviews/{review_id}`；⑤ review-due 增加 active/action；⑥ 复习统计（P1） |
| 许嘉琪 | ① 复习入口改走 `/reviews/start`；② 复习结果反馈；③ 返回个人中心自动刷新；④ 体验 P1：复习时间显示 / 报告抽屉收敛 / 上传两步式（P1） |

---

## 三、功能点清单

### 3.1 马茗燕：复习上下文真实化 + 复习对比 Prompt + 体验收敛（P0 + P1）

#### 1. review_context 真实化（P0）—— `services/review_context_service.py`

**现状**：`get_feynman_service()` 注入的是 `TemporaryTestReviewContextProvider`（`feynman_service.py`），仅 `session-test-review` 返回写死的 Dijkstra mock；真实用户复习会话拿不到历史漏洞/上次分数。

**目标**：将复习会话的上下文加载接到后端 B 提供的真实数据源：

- `DefaultReviewContextProvider` 从「当前 active review_attempt → 目标漏洞 + baseline 报告」读取 `ReviewContext`（`gap_id / kp_id / kp_name / review_focus / target_gap`，`previous_scores` 取 baseline 报告同名维度分，缺失置 null）。
- **契约先行**：后端 A 只依赖后端 B 暴露的 reader（懒加载/接口对接，contract-first）。后端 B 未就绪时，provider 保持返回 `None`，对话自动降级为普通费曼对话，互不阻塞。
- 任何异常一律吞掉返回 `None`；游客/无历史漏洞/无 active attempt 均返回 `None`。
- 移除/退役测试专用桩（保留仅测试内部可用），线上 `get_feynman_service` 注入真实实现。
- 保持现有「无历史 → None → 普通对话」的降级路径，覆盖已有 `test_week8_review_context.py` 三个用例并扩充。

#### 2. 复习对比 Prompt（P0）—— `services/prompt_builder.py` + `models/feynman.py`

**现状**：`_build_review_instructions` 只用了 `gap_desc / review_focus / weak_dimensions`；`TargetGap.previous_scores`、`ReviewContext.previous_report_summary` 已建模但**未进 prompt**。

**目标**：让复习会话的 LLM 输出「相对上次」的四维对比，为后端 B `/reviews/{review_id}` 的 `dimension_changes` 提供依据：

- `build_system_prompt` 增加可选 `review_context` 分支：注入「上次各维度得分 / 上次报告摘要」，并要求本次评分后附对比字段；普通会话（无 review_context）输出结构不变。
- 输出结构在 `final_report` 维度项上扩展 `previous_score`（可空）与结果标记字段（`mastered / continue / unchanged` 的判定归后端 B，由后端按分数算，LLM 只负责给出四维分与解释；见 3.2 契约）。**数值对比（delta、是否 mastered）一律由后端 B 计算，不在 prompt 里让模型判，避免模型漂移**——prompt 只多携带「上次分数」供模型把握难度与判断进步与否的措辞。
- `deepseek_client.py` / `mock_llm.py` 透传新字段；Mock 兜底沿用现有 `_build_mock_review_plan`、`_pain_point_suffix`，并在复习分支给出可复现的对比样例。
- 复习场景追问守则：优先验证上次没讲清的薄弱点；不泄露标准答案；仍保持「小白听众式追问」。

#### 3. 复习 greeting 收口（P0）—— `services/feynman_service.py` / `api/routes.py`

- greeting 的 `is_review / review_focus` 改由真实 provider 判定：当传入的 `session_id` 命中 active review_attempt 时返回复习开场语（提示「上次 X 维度得分偏低，本次重点讲清 Y」，不给答案）；普通会话与游客保持不变。
- 后端 B 提供 `/reviews/start` 后，前端把返回的 session_id 传给 greeting 即可进入复习开场。

#### 4. 报告结构体验收敛（P1）—— prompt + `models/feynman.py` 侧

- 收敛 `review_plan` 输出：以 `reread_guide`（`priority / material_name / page_hint / focus / reason`）为**唯一复习建议源**，按优先级排列；不再让模型输出与维度 suggestion 重复的 `priority_order` 长文本（前端同步隐藏该块，见 3.3）。
- 每维 `suggestion` 内聚在「分维度分析」卡片内（analysis=已覆盖+真实不足，suggestion=针对真实不足的具体做法）。
- 去掉「重点关注：…」等套话式固定措辞，改为自然一句话。
- 改动前先与陈艺博确认 `review_plan` JSON 落库/历史报告兼容策略（老报告缺字段时前端做兼容，不迁移数据）。

#### 5. 针对性追问与防重复（P1，承接第八周原 P1）

- 按薄弱维度选择追问侧重点；对已讲清的薄弱点减少重复追问；记录「复习 Prompt 命中策略」供统计与调优。

### 3.2 陈艺博：复习闭环数据与接口落地（P0 + P1）

#### 1. 数据模型与迁移（P0）—— `models/review_attempt.py` + `core/database.py`

新增 `review_attempt` 表（沿用第八周契约字段）：

| 字段 | 类型/约束 | 说明 |
|---|---|---|
| `id` | str PK `review-`前缀 | attempt 唯一 ID |
| `user_id` | str FK index | 归属用户 |
| `session_id` | str UNIQUE | 关联的复习会话；一个 session 只关联一个 attempt |
| `kp_id` | str index | 复习的知识点 |
| `baseline_report_id` | str | 开始时基线报告（固定，完成后不改） |
| `target_gap_ids` | JSON 数组 | 当前用户当前 KP 的 open/reviewing 漏洞 |
| `source` | `gap` / `due` | 入口来源 |
| `status` | `active` / `completed` | 状态 |
| `result_report_id` | str 可空 | 复习结果报告 |
| `started_at` / `completed_at` | str 可空 | 起止时间 |

存量表字段（内联迁移，沿用 `core/database.py` 现有风格，不破坏旧数据）：
- `diagnostic_report` 新增 `review_attempt_id`（普通学习为 null）
- `knowledge_gap` 新增 `resolved_at`、`resolution_source`（`assessment` / `manual`，重新打开时清空）

约束：旧报告保持普通报告，不强制回填 review_attempt；同用户同 KP 同时只允许一个 `active` attempt。

#### 2. `POST /api/v1/reviews/start`（P0）—— 复习入口

请求 `{ kp_id, source }`，Bearer 鉴权：

- 该 KP 无未解决漏洞 → `409`，`msg=no unresolved gaps`
- 已有 active attempt → 返回 `resumed=true` + 原 session_id，不重复创建
- 否则：建 review_attempt（status=active）+ 新 session_id；目标 open 漏洞 → `reviewing`
- **此时不修改 review_count / last_reviewed_at / next_review_at**

#### 3. 复习报告落库事务 + 状态收敛迁移（P0，本周核心）

**把第七周「开始复习即 +1」迁移为第八周语义**：

- `chat` 生成最终报告时（后端按 session_id 命中 active review_attempt 自动进入复习收尾），在**同一事务**内完成：
  1. 新增 `diagnostic_report`（永不覆盖旧报告，`review_attempt_id` 回填 attempt）；
  2. attempt → `completed`，写 `result_report_id`、`completed_at`；
  3. 目标漏洞按阈值收敛：单维度 7~10 → `resolved`（写 `resolved_at`、`resolution_source=assessment`、`next_review_at=null`）；0~6 → 保持 `reviewing` 并更新 score/原因，`review_count += 1`、`last_reviewed_at=落库时间`、按 SRS 递增后次数重排 `next_review_at`（间隔沿用 1/3/7/14/30，起算=本次完成时间）；
  4. 本轮新发现、不在 target_gap_ids 的低分维度 → 新建 `open`、`review_count=0`；
  5. 已 resolved 漏洞后续普通学习再得 0~6 → 原记录重新 `open`，不新增。
- **幂等**：同一报告重复提交不重复落库/不重复 +1；中途退出保持 active，再点「开始复习」返回同一 active 会话继续。
- 迁移 `knowledge_gap_service.update_gap_status`：
  - `PATCH /gaps/{id}` 置 `reviewing` → `400`（复习开始统一走 `/reviews/start`）；
  - gap 处于 active attempt 时，手动改 `open`/`resolved` → `409`；
  - `resolved`（手动）写 `resolution_source=manual` + `resolved_at`；`open`（重新加入）清空解决信息。
- **阈值常量统一**：掌握阈值、severity 映射收敛到单一共享常量/函数，禁止多处硬编码。

#### 4. `GET /api/v1/reviews/{review_id}`（P0）—— 复习结果

- active：返回 `result_report_id=null`、`dimension_changes=[]`、`action=continue`
- completed：返回 `dimension_changes`，每项含 `dimension / previous_score(可空) / current_score / delta / result(mastered|continue|unchanged) / gap_id / gap_status / review_count / next_review_at`
- 对比规则：`previous_score` 取 baseline 同名维度（缺失 null），`delta = current - previous`，result 由后端按阈值计算，前端只展示

#### 5. `/gaps/review-due` 扩展（P0）

到期项增加 `active_review_id`（该漏洞存在未完成复习时返回 review_id）与 `action`（`start` / `continue`）。

#### 6. 复习统计与摘要（P1）

- 每 KP 复习次数、平均分提升；区分「手动掌握 manual」与「系统判定 assessment」；提供最近一次复习结果摘要。

### 3.3 许嘉琪：复习入口与结果反馈（P0）+ 体验打磨（P1）

> 交互细节由许嘉琪自行设计，字段契约以 3.2 为准。

#### 1. 复习入口改走 `/reviews/start`（P0）

- 知识漏洞 Tab / 「今日待复习」的「开始复习」不再 `PATCH` 置 reviewing，改为调 `POST /reviews/start` → 拿到 session_id → 进入该 KP 的费曼对话页并保留复习目标（`review_focus`）。
- 响应 `resumed=true` 时提示「继续上次复习」，进入同一会话。
- 重复点击：loading 态 + 按钮禁用，防连点。

#### 2. 复习场景提示与结果反馈（P0）

- 复习会话开始前/中提示「本次重点：上次 XX 维度得分偏低」，**不泄露标准答案**。
- 复习结束后（对话出报告 / 回到个人中心）展示复习结果：哪些维度已改善/mastered、哪些 continue、`delta` 变化、下一步去哪里；数据来源 `GET /reviews/{review_id}`。

#### 3. 页面数据自动刷新（P0）

- 从对话/复习返回个人中心时，漏洞、报告、统计自动刷新，不依赖手动刷新浏览器。

#### 4. 体验 P1：复习时间可见

- 漏洞卡片与「今日待复习」条目渲染 `next_review_at`：显示「下次复习：X 月 X 日 · 剩余 X 天」，逾期标红；`reviewing` 且有 `last_reviewed_at` 时展示上次复习时间。字段后端已就绪，纯前端。Mock 数据同步补该字段。

#### 5. 体验 P1：报告抽屉收敛

- 报告抽屉「复习建议」区收敛为「教材重读指引」优先级卡片（含教材名/页码/重点/原因）；移除「学习优先级排序」重复区块与「重点关注：…」套话；「分维度分析」每维保留 analysis+suggestion。对老报告（缺字段）做兼容不报错。

#### 6. 体验 P1：上传两步式

- 「教材名称」改必填（为空禁用上传并提示）；选文件后先展示待上传文件名，出现显式「上传」按钮，点击后才真正发起上传；PDF 类型与 50MB 校验保留。后端接口不变。

#### 7. 体验 P1：复习前后四维对比小可视化（可选）

- 复习结果里用迷你四维对比图展示 previous vs current（复用 RadarChart 或 mini bar，许嘉琪自判）。

---

## 四、完整用户流程

### 4.0 端到端主链路联调（本周验收主线）

1. 用户注册 → 登录（`/auth/register` → `/auth/login`，拿 Token）。
2. 首次登录弹「完善学情画像」，选择报考学科 / 阶段 / 类型 / 痛点并保存（`/user/profile`）。
3. 上传教材 PDF → 后台自动分解（切片 → 抽知识点 → 生成四维 rubric → 向量化），状态轮询至 done。
4. 四级级联选中知识点 → 进入费曼对话，大模型基于学情画像个性化追问（痛点/阶段注入）。
5. 3 轮后生成诊断报告 + 复习计划（`review_plan`），报告落库（不覆盖）。
6. 个人中心「今日待复习」展示当天到期知识点（SRS `next_review_at <= today`）。
7. 点「开始复习」→ `/reviews/start` → 复习对话（注入上次薄弱维度/分数）→ 复习报告落库，漏洞按得分自动收敛。
8. 「复习结果」展示本次 vs 上次的四维对比（`dimension_changes`），复习计数与排期正确更新。

> 联调口径：以上每一步都须用真实账号走通，任一环节断点即视为 P0 缺陷；前端 `VITE_USE_FEYNMAN_MOCK=false`、`VITE_USE_MATERIAL_MOCK=false` 全链路真实后端联调。

### 4.1 复习闭环端到端

1. 9月6日 用户讲解 Dijkstra，「理解深度」4 分 ≤6 → 该维度 open 漏洞落库（`review_count=0`）。
2. 用户进个人中心 → 知识漏洞 → 点「开始复习」→ `POST /reviews/start`（kp=Dijkstra）→ 新建 review_attempt(active) + 新 session；open→reviewing；**次数不变**。
3. 前端携 session_id 进对话页 → greeting 返回 `is_review=true` + review_focus=「上次理解深度偏低」。
4. 用户按提示重新讲解 → 后端注入上次分数，追问优先薄弱点。
5. 第 3 轮后出报告 → 单事务：新增报告(不覆盖) + attempt→completed + 该漏洞评分 8 分(≥7)→`resolved`（next_review_at=null）；若仍 5 分则保持 reviewing、`review_count=1`、`next_review_at=+1 天`。
6. 回到个人中心自动刷新：漏洞状态、今日待复习、学情统计同步更新；「复习结果」页展示维度对比（8-4=+4 mastered）。

### 4.2 异常与边界

1. 无未解决漏洞点「开始复习」→ 409「no unresolved gaps」，前端提示。
2. 复习中途退出 → attempt 保持 active；再次进入返回 `resumed=true`，不重复计数。
3. 直接 PATCH 置 reviewing → 400（提示走复习入口）。
4. active 期间手动标记已掌握 → 409。
5. 游客 / 无历史漏洞用户 → 走普通对话，无复习提示。
6. LLM 异常 / 上下文加载失败 → 降级普通对话，报告可返回但事务失败记日志，禁止半更新。
7. 报告、attempt、漏洞任一步失败 → 整体回滚，前端提示「复习结果暂未保存，请重试」并可重新触发（幂等）。

---

## 五、数据模型变更

（仅后端 B 变更，后端 A 不建表）

1. **新增 `review_attempt` 表**：见 3.2-1 字段表。表名/索引遵循现有 `learn_session`/`knowledge_gap` 命名风格（`idx_review_user`、`idx_review_kp` 等）。
2. **`diagnostic_report` 增加列** `review_attempt_id`（nullable）。
3. **`knowledge_gap` 增加列** `resolved_at`（nullable）、`resolution_source`（`assessment`/`manual`，nullable；重开漏洞时清空）。
4. 迁移走 `core/database.py` 内联 `ALTER TABLE` 风格（参考现有 `material.name`、`diagnostic_report.review_plan` 迁移），不引入 ORM 外迁移工具。
5. 旧报告保持普通报告（`review_attempt_id=null`），不强制回填。

---

## 六、验收标准

### 6.1 复习闭环（后端）

1. `POST /reviews/start`：新建（resumed=false）/恢复（resumed=true）/409 三分支正确；**点击开始不 +1**。
2. 复习报告落库后：目标漏洞 7~10→resolved、0~6→保持 reviewing 且 `review_count` 恰好 +1、`last_reviewed_at`/`next_review_at` 按完成时间计算；新低分维度 open、`review_count=0`；resolved 后普通学习再低分→原记录重新 open。
3. `review_count` 迁移验证：点开始 +1（应无）、中途退出 +1（应无）、重复提交同一报告 +1 一次、有效报告 +1 一次。
4. `GET /reviews/{review_id}`：active 与 completed 两态返回符合契约，dimension_changes 与库内一致。
5. 事务：人为制造报告写入失败，验证 attempt 与漏洞**同步回滚**、无半更新；重试幂等不重复落库。
6. `PATCH /gaps` 置 reviewing → 400；active 期手动改 → 409；手动 resolved 写 `resolution_source=manual`。
7. 阈值一致：全仓库掌握阈值/severity 收敛到共享常量，无多处硬编码。
8. `/gaps/review-due` 到期项带 `active_review_id` 与 `action`。

### 6.2 复习上下文（后端 A）

1. 从真实 active attempt 能识别 KP 与待验证维度（provider 返回 ReviewContext），普通会话/游客/无历史返回 None。
2. 复习会话的 system prompt 含上次分数与摘要；普通会话 prompt 与现状一致（无 diff 污染）。
3. 至少一个追问针对上次薄弱点；复习 greeting `is_review=true` 且不给答案；普通 greeting 不变。
4. 后端 B 未就绪时（mock/异常）provider 返回 None，对话正常降级，全量测试通过。

### 6.3 前端

1. 两个入口（知识漏洞 / 今日待复习）均能进对应 KP 复习对话并显示复习目标；重复点击有 loading/禁用；`resumed=true` 时提示继续。
2. 复习结果页展示 mastered / continue 与 delta；不泄露标准答案。
3. 返回个人中心数据自动刷新。
4. P1 体验：上传名称必填 + 显式上传按钮；漏洞/待复习显示下次复习时间（逾期标红）；报告抽屉无重复区块、老报告兼容不报错。
5. Chrome/Edge 回归无异常；生产构建通过。

### 6.4 工程质量

- 新增状态转换 / 幂等 / 去重 / 隔离 / 降级测试；全量后端测试通过。
- 不提交 `.env`、本地库、Chroma、PDF、构建产物；接口变更同步 Mock 与文档。

---

## 附录 A：本周砍项（顺延第十周+）

1. 错题库 / 错题拍照 / 错题复盘
2. 主观题训练场景
3. SRS 定时推送通知（外部通知渠道）
4. 完整学科定制化追问 Prompt
5. 系统预设教材库
6. 知识图谱 / 双模型核验 / 模型微调
7. 跨教材综合复习与长期学习计划自动编排
8. rubric 二次 LLM 校验（历史 V1.5）
9. 对话 SSE 流式输出

（承接第八周 PRD 附录 A「10 条固定实现结论」作为本周实现的硬性契约：0~6/7~10 阈值、review_count 只在有效报告后 +1、`/reviews/start` 与 `/reviews/{id}` 契约、review_attempt 表、报告永不覆盖、单事务、系统评分 7 分自动解决、中途退出不计次数、前端不再用 PATCH reviewing 启动复习或推进 SRS。）
