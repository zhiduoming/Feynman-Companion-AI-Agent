import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  ChevronDown,
  CheckCircle2,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  BookOpen,
} from "lucide-react";

/* ─── Types ─── */
type KpStatus = "done" | "pending_regenerate" | "failed";

interface KnowledgePoint {
  id: string;
  name: string;
  pageStart: number;
  pageEnd: number;
  status: KpStatus;
}

interface Chapter {
  id: string;
  title: string;
  expanded: boolean;
  kps: KnowledgePoint[];
}

/* ─── Mock data ─── */
const initialChapters: Chapter[] = [
  {
    id: "ch1",
    title: "第4章 最短路径算法",
    expanded: true,
    kps: [
      { id: "kp1", name: "Dijkstra算法", pageStart: 45, pageEnd: 52, status: "done" },
      { id: "kp2", name: "Floyd算法", pageStart: 53, pageEnd: 60, status: "pending_regenerate" },
    ],
  },
  {
    id: "ch2",
    title: "第5章 图的遍历",
    expanded: true,
    kps: [
      { id: "kp3", name: "深度优先搜索", pageStart: 63, pageEnd: 70, status: "done" },
      { id: "kp4", name: "广度优先搜索", pageStart: 71, pageEnd: 77, status: "failed" },
    ],
  },
];

/* ─── Status config ─── */
const STATUS_CONFIG: Record<KpStatus, { label: string; textClass: string; Icon: typeof CheckCircle2 }> = {
  done: { label: "已完成", textClass: "text-green-600", Icon: CheckCircle2 },
  pending_regenerate: { label: "rubric生成中", textClass: "text-amber-600", Icon: Clock },
  failed: { label: "生成失败", textClass: "text-red-500", Icon: AlertCircle },
};

/* ─── Form modal ─── */
interface KpFormValues {
  name: string;
  pageStart: string;
  pageEnd: string;
}

function KpModal({
  initial,
  onClose,
  onSubmit,
}: {
  initial?: KnowledgePoint;
  onClose: () => void;
  onSubmit: (values: KpFormValues) => void;
}) {
  const [form, setForm] = useState<KpFormValues>({
    name: initial?.name ?? "",
    pageStart: initial ? String(initial.pageStart) : "",
    pageEnd: initial ? String(initial.pageEnd) : "",
  });
  const [errors, setErrors] = useState<Partial<KpFormValues>>({});

  function validate(): boolean {
    const errs: Partial<KpFormValues> = {};
    if (!form.name.trim()) errs.name = "请填写知识点名称";
    const ps = parseInt(form.pageStart);
    const pe = parseInt(form.pageEnd);
    if (!form.pageStart || isNaN(ps) || ps < 1) errs.pageStart = "请输入正整数";
    if (!form.pageEnd || isNaN(pe) || pe < 1) errs.pageEnd = "请输入正整数";
    else if (!errs.pageStart && pe < ps) errs.pageEnd = "结束页码须≥起始页码";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit() {
    if (validate()) onSubmit(form);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10, 15, 30, 0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card w-full max-w-md rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
        style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-[0.9375rem] font-semibold text-foreground">
            {initial ? "编辑知识点" : "新增知识点"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8125rem] font-medium text-foreground">
              知识点名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="例：Dijkstra算法"
              className={`rounded-xl border px-3.5 py-2.5 text-[0.9rem] text-foreground bg-background outline-none transition-all
                focus:ring-2 focus:ring-ring focus:border-primary/30
                ${errors.name ? "border-red-400 bg-red-50/50" : "border-border"}`}
            />
            {errors.name && <span className="text-[0.75rem] text-red-500">{errors.name}</span>}
          </div>

          {/* Page range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-medium text-foreground">起始页码</label>
              <input
                type="number"
                min={1}
                value={form.pageStart}
                onChange={(e) => setForm((f) => ({ ...f, pageStart: e.target.value }))}
                placeholder="如 45"
                className={`rounded-xl border px-3.5 py-2.5 text-[0.9rem] text-foreground bg-background outline-none transition-all
                  focus:ring-2 focus:ring-ring focus:border-primary/30
                  ${errors.pageStart ? "border-red-400 bg-red-50/50" : "border-border"}`}
              />
              {errors.pageStart && <span className="text-[0.75rem] text-red-500">{errors.pageStart}</span>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8125rem] font-medium text-foreground">结束页码</label>
              <input
                type="number"
                min={1}
                value={form.pageEnd}
                onChange={(e) => setForm((f) => ({ ...f, pageEnd: e.target.value }))}
                placeholder="如 52"
                className={`rounded-xl border px-3.5 py-2.5 text-[0.9rem] text-foreground bg-background outline-none transition-all
                  focus:ring-2 focus:ring-ring focus:border-primary/30
                  ${errors.pageEnd ? "border-red-400 bg-red-50/50" : "border-border"}`}
              />
              {errors.pageEnd && <span className="text-[0.75rem] text-red-500">{errors.pageEnd}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.875rem] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl text-[0.875rem] font-semibold bg-primary text-primary-foreground hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete confirm modal ─── */
function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(10, 15, 30, 0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card w-full max-w-sm rounded-2xl shadow-2xl border border-border overflow-hidden"
        style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
      >
        <div className="px-6 pt-6 pb-4 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center mb-1">
            <Trash2 size={18} className="text-red-500" strokeWidth={2} />
          </div>
          <h3 className="text-[0.9375rem] font-semibold text-foreground">确认删除</h3>
          <p className="text-[0.875rem] text-muted-foreground leading-relaxed">
            即将删除知识点「<strong className="text-foreground">{name}</strong>」，此操作不可撤销。
          </p>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-[0.875rem] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-[0.875rem] font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all"
          >
            确认删除
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── KP row ─── */
function KpRow({
  kp,
  onEdit,
  onDelete,
  onRegenerate,
}: {
  kp: KnowledgePoint;
  onEdit: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) {
  const cfg = STATUS_CONFIG[kp.status];
  const StatusIcon = cfg.Icon;
  const showRegenerate = kp.status === "done" || kp.status === "failed";

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors group">
      <BookOpen size={15} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />

      <div className="flex-1 min-w-0">
        <span className="text-[0.9rem] font-medium text-foreground">{kp.name}</span>
        <span className="ml-2 text-[0.8rem] text-muted-foreground tabular-nums">
          p.{kp.pageStart}–{kp.pageEnd}
        </span>
      </div>

      <div className={`flex items-center gap-1 flex-shrink-0 ${cfg.textClass}`}>
        <StatusIcon size={13} strokeWidth={2.2} />
        <span className="text-[0.8125rem] font-medium">{cfg.label}</span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {showRegenerate && (
          <button
            onClick={onRegenerate}
            title="重新生成rubric"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        )}
        <button
          onClick={onEdit}
          title="编辑"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Edit2 size={13} strokeWidth={2} />
        </button>
        <button
          onClick={onDelete}
          title="删除"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
type ModalState =
  | { type: "add"; chapterId: string }
  | { type: "edit"; chapterId: string; kp: KnowledgePoint }
  | { type: "delete"; chapterId: string; kp: KnowledgePoint }
  | null;

export default function KnowledgePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const materialName = searchParams.get("name") ?? "教材知识点";

  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [modal, setModal] = useState<ModalState>(null);

  /* ── Chapter toggle ── */
  function toggleChapter(id: string) {
    setChapters((prev) =>
      prev.map((ch) => (ch.id === id ? { ...ch, expanded: !ch.expanded } : ch))
    );
  }

  /* ── Add KP ── */
  function handleAddSubmit(chapterId: string, values: KpFormValues) {
    const newKp: KnowledgePoint = {
      id: `kp${Date.now()}`,
      name: values.name.trim(),
      pageStart: parseInt(values.pageStart),
      pageEnd: parseInt(values.pageEnd),
      status: "pending_regenerate",
    };
    setChapters((prev) =>
      prev.map((ch) => (ch.id === chapterId ? { ...ch, kps: [...ch.kps, newKp] } : ch))
    );
    setModal(null);
    // simulate regeneration completion
    setTimeout(() => {
      setChapters((prev) =>
        prev.map((ch) => ({
          ...ch,
          kps: ch.kps.map((k) => (k.id === newKp.id ? { ...k, status: "done" } : k)),
        }))
      );
    }, 4000);
  }

  /* ── Edit KP ── */
  function handleEditSubmit(chapterId: string, kpId: string, values: KpFormValues, prevKp: KnowledgePoint) {
    const pageChanged =
      parseInt(values.pageStart) !== prevKp.pageStart ||
      parseInt(values.pageEnd) !== prevKp.pageEnd;

    setChapters((prev) =>
      prev.map((ch) =>
        ch.id !== chapterId
          ? ch
          : {
              ...ch,
              kps: ch.kps.map((k) =>
                k.id !== kpId
                  ? k
                  : {
                      ...k,
                      name: values.name.trim(),
                      pageStart: parseInt(values.pageStart),
                      pageEnd: parseInt(values.pageEnd),
                      status: pageChanged ? "pending_regenerate" : k.status,
                    }
              ),
            }
      )
    );
    setModal(null);
    if (pageChanged) {
      setTimeout(() => {
        setChapters((prev) =>
          prev.map((ch) => ({
            ...ch,
            kps: ch.kps.map((k) => (k.id === kpId ? { ...k, status: "done" } : k)),
          }))
        );
      }, 3500);
    }
  }

  /* ── Delete KP ── */
  function handleDeleteConfirm(chapterId: string, kpId: string) {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id !== chapterId ? ch : { ...ch, kps: ch.kps.filter((k) => k.id !== kpId) }
      )
    );
    setModal(null);
  }

  /* ── Regenerate ── */
  function handleRegenerate(chapterId: string, kpId: string) {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id !== chapterId
          ? ch
          : {
              ...ch,
              kps: ch.kps.map((k) =>
                k.id === kpId ? { ...k, status: "pending_regenerate" } : k
              ),
            }
      )
    );
    setTimeout(() => {
      setChapters((prev) =>
        prev.map((ch) => ({
          ...ch,
          kps: ch.kps.map((k) => (k.id === kpId ? { ...k, status: "done" } : k)),
        }))
      );
    }, 3500);
  }

  return (
    <>
      <div
        className="min-h-screen bg-background flex flex-col"
        style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center px-5 gap-4">
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-1.5 text-[0.875rem] text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            返回
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[0.9375rem] font-semibold text-foreground truncate">{decodeURIComponent(materialName)}</h1>
          </div>
          <button
            onClick={() => {
              const firstChId = chapters[0]?.id;
              if (firstChId) setModal({ type: "add", chapterId: firstChId });
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[0.875rem] font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all flex-shrink-0"
          >
            <Plus size={15} strokeWidth={2.5} />
            新增知识点
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-7 flex flex-col gap-4">
          {chapters.map((chapter) => (
            <div key={chapter.id} className="flex flex-col gap-2">
              {/* Chapter header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                className="flex items-center gap-2 w-full text-left group"
              >
                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`text-muted-foreground transition-transform duration-200 flex-shrink-0 ${
                    chapter.expanded ? "rotate-0" : "-rotate-90"
                  }`}
                />
                <span className="text-[0.9375rem] font-semibold text-foreground group-hover:text-primary transition-colors">
                  {chapter.title}
                </span>
                <span className="ml-1 text-[0.8rem] text-muted-foreground">({chapter.kps.length})</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setModal({ type: "add", chapterId: chapter.id });
                  }}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[0.8rem] text-primary font-medium hover:underline"
                >
                  <Plus size={12} strokeWidth={2.5} />
                  添加
                </button>
              </button>

              {/* KP list */}
              {chapter.expanded && (
                <div className="ml-6 flex flex-col gap-1.5">
                  {chapter.kps.length === 0 ? (
                    <div className="py-6 text-center text-[0.875rem] text-muted-foreground">
                      暂无知识点，点击上方添加
                    </div>
                  ) : (
                    chapter.kps.map((kp) => (
                      <KpRow
                        key={kp.id}
                        kp={kp}
                        onEdit={() => setModal({ type: "edit", chapterId: chapter.id, kp })}
                        onDelete={() => setModal({ type: "delete", chapterId: chapter.id, kp })}
                        onRegenerate={() => handleRegenerate(chapter.id, kp.id)}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </main>
      </div>

      {/* Add modal */}
      {modal?.type === "add" && (
        <KpModal
          onClose={() => setModal(null)}
          onSubmit={(values) => handleAddSubmit(modal.chapterId, values)}
        />
      )}

      {/* Edit modal */}
      {modal?.type === "edit" && (
        <KpModal
          initial={modal.kp}
          onClose={() => setModal(null)}
          onSubmit={(values) => handleEditSubmit(modal.chapterId, modal.kp.id, values, modal.kp)}
        />
      )}

      {/* Delete confirm */}
      {modal?.type === "delete" && (
        <DeleteModal
          name={modal.kp.name}
          onClose={() => setModal(null)}
          onConfirm={() => handleDeleteConfirm(modal.chapterId, modal.kp.id)}
        />
      )}
    </>
  );
}
