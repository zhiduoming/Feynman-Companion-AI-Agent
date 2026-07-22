import { useState, useRef, useEffect } from "react";
import { CheckCircle2, X, AlertTriangle, ChevronRight, RotateCcw } from "lucide-react";
import { useNavigate } from "react-router";
import { UserMenu } from "../components/UserMenu";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Message = { id: number; role: "ai" | "user"; text: string };

const messages: Message[] = [
  { id: 1, role: "ai", text: "同学你好！请用大白话向我解释一下，Dijkstra 算法是怎么保证一定能找到最短路径的？" },
  { id: 2, role: "user", text: "每次找离起点最近的点，然后更新它邻居的距离，一直找下去就可以了。" },
  { id: 3, role: "ai", text: "今天的对练结束，这是你的诊断报告：" },
];

const radarData = [
  { axis: "理解深度", value: 85 },
  { axis: "表达完整性", value: 68 },
  { axis: "逻辑连贯性", value: 78 },
  { axis: "结构化能力", value: 72 },
];

function RobotAvatar() {
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="5" y="8" width="14" height="10" rx="2" fill="#2563EB" />
        <rect x="9" y="11" width="2.5" height="2.5" rx="0.5" fill="#fff" />
        <rect x="12.5" y="11" width="2.5" height="2.5" rx="0.5" fill="#fff" />
        <rect x="9.5" y="15" width="5" height="1" rx="0.5" fill="#93C5FD" />
        <rect x="10.5" y="5" width="3" height="3" rx="1" fill="#2563EB" />
        <rect x="11.5" y="4" width="1" height="2" rx="0.5" fill="#2563EB" />
        <circle cx="11.5" cy="4" r="1" fill="#60A5FA" />
        <rect x="3" y="10" width="2" height="4" rx="1" fill="#93C5FD" />
        <rect x="19" y="10" width="2" height="4" rx="1" fill="#93C5FD" />
      </svg>
    </div>
  );
}

function UserAvatar() {
  return (
    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shadow-sm">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="8" r="4" fill="#fff" fillOpacity="0.9" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    </div>
  );
}

function AiBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2.5 max-w-[80%] sm:max-w-[65%]">
      <RobotAvatar />
      <div className="bg-card text-card-foreground rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-border text-[0.9375rem] leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex items-end gap-2.5 max-w-[80%] sm:max-w-[65%] self-end">
      <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-3 shadow-sm text-[0.9375rem] leading-relaxed">
        {text}
      </div>
      <UserAvatar />
    </div>
  );
}

function ReportCard({ onViewReport }: { onViewReport: () => void }) {
  return (
    <div className="self-center w-full max-w-sm">
      <div className="bg-card rounded-2xl shadow-lg border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />
            <span className="text-white font-semibold text-sm tracking-wide">本次费曼训练已完成</span>
          </div>
        </div>
        <div className="px-5 py-4 flex flex-col gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[2rem] font-bold text-foreground leading-none">8.5</span>
            <span className="text-muted-foreground text-base font-medium">/ 10</span>
          </div>
          <div className="text-[0.8125rem] text-muted-foreground -mt-1">综合评分</div>
          <div className="border-t border-border" />
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
            <div>
              <div className="text-[0.75rem] text-muted-foreground mb-0.5 font-medium uppercase tracking-wider">核心盲区</div>
              <div className="text-[0.9rem] font-semibold text-foreground">贪心原理前提</div>
            </div>
          </div>
          <button
            onClick={onViewReport}
            className="mt-1 w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-[0.9375rem] py-2.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            查看完整四维诊断
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DiagnosticModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10, 15, 30, 0.72)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border border-border flex flex-col max-h-[90vh] overflow-hidden"
        style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <h2 className="text-base font-semibold text-foreground tracking-wide">四维费曼诊断报告</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="关闭"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6 [scrollbar-width:thin]">
          <div className="flex gap-5 items-start">
            <div className="flex-shrink-0 w-44 h-44">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <PolarGrid stroke="var(--border)" strokeOpacity={0.6} />
                  <PolarAngleAxis
                    dataKey="axis"
                    tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontFamily: "'Noto Sans SC', sans-serif" }}
                  />
                  <Radar dataKey="value" stroke="#2563EB" fill="#2563EB" fillOpacity={0.18} strokeWidth={1.8} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                    formatter={(v: number) => [`${v} 分`, ""]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider mb-2">总结评价</div>
              <p className="text-[0.9rem] text-foreground leading-relaxed">
                你对 Dijkstra 算法的基本流程掌握较好，能用通俗语言描述"贪心选点 + 松弛更新"的核心操作。但在表达中缺乏对算法前提条件的说明——尤其是<strong>边权非负</strong>这一隐含约束，这是理解算法正确性的根基，也是面试中最常被追问的细节。
              </p>
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider mb-3">小白刁难点</div>
              <ul className="flex flex-col gap-2.5">
                {["若图中存在环，算法会不会死循环？", "为什么已访问的节点不需要再次更新？"].map((q, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="mt-[3px] flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 text-primary text-[0.625rem] font-bold flex items-center justify-center leading-none">
                      {i + 1}
                    </span>
                    <span className="text-[0.875rem] text-foreground leading-snug">{q}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider mb-3">用户回应漏洞</div>
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 flex gap-2.5 items-start">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                <p className="text-[0.875rem] text-amber-900 leading-snug">
                  遗漏了<strong>图的边权不能为负数</strong>的前提——这是 Dijkstra 正确性的根本保证。
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          <div>
            <div className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider mb-3">深度剖析</div>
            <div className="rounded-xl bg-blue-50 border border-blue-100 px-5 py-4 text-[0.9rem] text-foreground leading-relaxed">
              <p className="mb-2">
                Dijkstra 算法的正确性依赖于<strong>贪心选择性质</strong>与<strong>最优子结构</strong>的结合。每次从优先队列中取出距离最小的未访问节点 <em>u</em> 时，可以证明此时 dist[u] 已经是从源点到 u 的最短距离——这一证明的关键前提是：所有边权均为非负值。
              </p>
              <p>
                若存在负权边，贪心假设将被打破：当我们"锁定" u 后，后续可能通过一条负权边以更小代价到达 u，使得已锁定的最短路径失效。此场景下应改用 <strong>Bellman-Ford 算法</strong>（时间复杂度 O(VE)），它通过对所有边进行 V-1 轮松弛来规避贪心假设。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <>
      <div
        className="flex flex-col h-screen w-full bg-background"
        style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
      >
        <header className="flex-shrink-0 bg-card border-b border-border h-14 flex items-center justify-between px-5">
          <button
            onClick={() => navigate("/select")}
            className="text-[0.8125rem] text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 选择知识点
          </button>
          <h1 className="text-[0.9375rem] font-semibold text-foreground tracking-wide absolute left-1/2 -translate-x-1/2">
            费曼伴学智能体 &mdash; 数据结构专练
          </h1>
          <UserMenu />
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-5 scroll-smooth [scrollbar-width:thin] [scrollbar-color:var(--muted)_transparent]">
          {messages.map((msg) =>
            msg.role === "ai" ? (
              <AiBubble key={msg.id} text={msg.text} />
            ) : (
              <UserBubble key={msg.id} text={msg.text} />
            )
          )}

          <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[72%]">
            <RobotAvatar />
            <div className="flex-1 min-w-0">
              <ReportCard onViewReport={() => setModalOpen(true)} />
            </div>
          </div>

          <div ref={bottomRef} />
        </main>

        <footer className="flex-shrink-0 bg-card border-t border-border px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-500" strokeWidth={2.2} />
              <span className="text-[0.9rem] text-muted-foreground font-medium">本次费曼学习训练已完成</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1.5 border border-border text-foreground text-sm font-medium px-4 py-2 rounded-xl hover:bg-muted active:scale-[0.98] transition-all duration-150"
            >
              <RotateCcw size={13} strokeWidth={2.2} />
              重新开始
            </button>
          </div>
        </footer>
      </div>

      {modalOpen && <DiagnosticModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
