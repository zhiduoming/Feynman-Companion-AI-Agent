import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, ArrowRight, BookOpen, Tag, FileText, Layers } from "lucide-react";
import { Toaster, toast } from "sonner";
import { UserMenu } from "../components/UserMenu";

/* ─── Types ─── */
type Subject = "computer" | "math" | "politics";

interface KnowledgePoint {
  kp_id: string;
  name: string;
  summary: string;
  tag?: string;
}

interface ChapterNode {
  chapter_id: string;
  title: string;
  knowledge_points: KnowledgePoint[];
}

interface MaterialNode {
  material_id: string;
  title: string;
  chapters: ChapterNode[];
}

/* ─── Mock data ─── */
const MOCK_TREE: Record<Subject, MaterialNode[]> = {
  computer: [
    {
      material_id: "mat-demo",
      title: "数据结构教材",
      chapters: [
        {
          chapter_id: "ch-demo",
          title: "第6章 图论",
          knowledge_points: [
            { kp_id: "kp-demo", name: "Dijkstra 算法", summary: "非负权图求单源最短路径的贪心算法", tag: "高频考点" },
            { kp_id: "kp-mst", name: "最小生成树", summary: "连通图总权值最小的生成子图" },
            { kp_id: "kp-topo", name: "拓扑排序", summary: "有向无环图节点线性排序方式" },
          ],
        },
        { chapter_id: "ch-tree", title: "第5章 树结构", knowledge_points: [] },
      ],
    },
    { material_id: "mat-os", title: "操作系统教材", chapters: [] },
  ],
  math: [],
  politics: [],
};

const MOCK_GREETING: Record<string, string> = {
  "kp-demo": "请你向我讲解一下 Dijkstra 算法的核心原理，讲得越详细越好。",
  "kp-mst": "请你向我讲解一下最小生成树的概念与常见算法。",
  "kp-topo": "请你向我讲解一下拓扑排序的原理和适用场景。",
};

const SUBJECT_LABELS: Record<Subject, string> = {
  computer: "计算机",
  math: "数学",
  politics: "政治",
};

/* ─── Custom dropdown ─── */
interface DropdownOption { value: string; label: string; disabled?: boolean }

function Dropdown({
  value,
  options,
  onChange,
  placeholder,
  disabled,
  icon: Icon,
}: {
  value: string;
  options: DropdownOption[];
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  icon: typeof ChevronDown;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl border text-[0.9rem] transition-all duration-150 text-left
          ${disabled
            ? "bg-muted border-border text-muted-foreground cursor-not-allowed opacity-60"
            : "bg-card border-border text-foreground hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
          }
          ${open ? "border-primary ring-2 ring-ring" : ""}
        `}
      >
        <Icon size={15} className="text-muted-foreground flex-shrink-0" strokeWidth={1.8} />
        <span className={`flex-1 truncate ${selected ? "text-foreground" : "text-muted-foreground"}`}>
          {selected ? selected.label : (placeholder ?? "请选择")}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`text-muted-foreground flex-shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={opt.disabled}
              onClick={() => {
                if (!opt.disabled) {
                  onChange(opt.value);
                  setOpen(false);
                }
              }}
              className={`w-full text-left px-4 py-2.5 text-[0.875rem] transition-colors
                ${opt.disabled ? "text-muted-foreground cursor-not-allowed" : ""}
                ${opt.value === value && !opt.disabled
                  ? "bg-primary/8 text-primary font-semibold"
                  : !opt.disabled ? "text-foreground hover:bg-muted" : ""
                }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── KP radio card ─── */
function KpCard({
  kp,
  selected,
  onClick,
}: {
  kp: KnowledgePoint;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-150 group
        ${selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
        }`}
    >
      {/* Radio indicator */}
      <div className={`flex-shrink-0 mt-[3px] w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all
        ${selected ? "border-primary bg-primary" : "border-muted-foreground/40 group-hover:border-primary/60"}`}
      >
        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[0.9375rem] font-medium leading-snug ${selected ? "text-primary" : "text-foreground"}`}>
            {kp.name}
          </span>
          {kp.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.7rem] font-semibold leading-none">
              <Tag size={9} strokeWidth={2.5} />
              {kp.tag}
            </span>
          )}
        </div>
        <p className="text-[0.8125rem] text-muted-foreground mt-0.5 leading-snug">{kp.summary}</p>
      </div>
    </button>
  );
}

/* ─── Section wrapper ─── */
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-[0.75rem] font-semibold text-muted-foreground uppercase tracking-wider pl-0.5">
        {label}
      </div>
      {children}
    </div>
  );
}

/* ─── Main page ─── */
export default function SelectPage() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState<Subject>("computer");
  const [materials, setMaterials] = useState<MaterialNode[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("");
  const [selectedChapterId, setSelectedChapterId] = useState<string>("");
  const [selectedKpId, setSelectedKpId] = useState<string>("");
  const [greetingText, setGreetingText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  /* ── Derived values ── */
  const selectedMaterial = materials.find((m) => m.material_id === selectedMaterialId);
  const chapters = selectedMaterial?.chapters ?? [];
  const selectedChapter = chapters.find((c) => c.chapter_id === selectedChapterId);
  const kps = selectedChapter?.knowledge_points ?? [];
  const selectedKp = kps.find((k) => k.kp_id === selectedKpId);

  const materialOptions: DropdownOption[] =
    materials.length === 0
      ? [{ value: "", label: "暂无教材", disabled: true }]
      : materials.map((m) => ({ value: m.material_id, label: m.title }));

  const chapterOptions: DropdownOption[] =
    !selectedMaterial
      ? []
      : chapters.length === 0
        ? [{ value: "", label: "暂无章节", disabled: true }]
        : chapters.map((c) => ({ value: c.chapter_id, label: c.title }));

  const showChapters = !!selectedMaterialId;
  const showKps = !!selectedChapterId;

  /* ── Load subject tree (mock) ── */
  async function loadTree(subj: Subject) {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300)); // simulate network
    try {
      const data = MOCK_TREE[subj];
      setMaterials(data);
      // auto-select first material
      const firstMat = data[0];
      if (firstMat) {
        setSelectedMaterialId(firstMat.material_id);
        const firstCh = firstMat.chapters[0];
        if (firstCh) {
          setSelectedChapterId(firstCh.chapter_id);
          const firstKp = firstCh.knowledge_points[0];
          if (firstKp) {
            setSelectedKpId(firstKp.kp_id);
            loadGreeting(firstKp.kp_id);
          } else {
            setSelectedKpId("");
          }
        } else {
          setSelectedChapterId("");
          setSelectedKpId("");
        }
      } else {
        setSelectedMaterialId("");
        setSelectedChapterId("");
        setSelectedKpId("");
      }
    } catch {
      toast.error("加载数据失败，请重新切换选项");
    } finally {
      setLoading(false);
    }
  }

  async function loadGreeting(kpId: string) {
    await new Promise((r) => setTimeout(r, 200));
    const text = MOCK_GREETING[kpId];
    if (text) setGreetingText(text);
  }

  /* ── Init ── */
  useEffect(() => {
    loadTree("computer");
  }, []);

  /* ── Handlers ── */
  function handleSubjectChange(v: string) {
    const s = v as Subject;
    setSubject(s);
    setSelectedMaterialId("");
    setSelectedChapterId("");
    setSelectedKpId("");
    setGreetingText("");
    loadTree(s);
  }

  function handleMaterialChange(v: string) {
    setSelectedMaterialId(v);
    setSelectedChapterId("");
    setSelectedKpId("");
    setGreetingText("");
    const mat = materials.find((m) => m.material_id === v);
    const firstCh = mat?.chapters[0];
    if (firstCh) {
      setSelectedChapterId(firstCh.chapter_id);
      const firstKp = firstCh.knowledge_points[0];
      if (firstKp) {
        setSelectedKpId(firstKp.kp_id);
        loadGreeting(firstKp.kp_id);
      }
    }
  }

  function handleChapterChange(v: string) {
    setSelectedChapterId(v);
    setSelectedKpId("");
    setGreetingText("");
    const ch = chapters.find((c) => c.chapter_id === v);
    const firstKp = ch?.knowledge_points[0];
    if (firstKp) {
      setSelectedKpId(firstKp.kp_id);
      loadGreeting(firstKp.kp_id);
    }
  }

  function handleKpSelect(kpId: string) {
    setSelectedKpId(kpId);
    loadGreeting(kpId);
  }

  function handleStart() {
    if (!selectedKpId) return;
    navigate(
      `/?kp_id=${selectedKpId}&material_id=${selectedMaterialId}&chapter_id=${selectedChapterId}&subject=${subject}`
    );
  }

  const canStart = !!selectedKpId;

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
    >
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center px-6">
        <h1 className="text-[0.9375rem] font-semibold text-foreground flex-1">选择知识点开始费曼学习</h1>
        <UserMenu />
      </header>

      <main className="flex-1 flex flex-col max-w-xl w-full mx-auto px-4 py-8 gap-0">
        {/* Cascade selectors */}
        <div className="flex flex-col gap-0">

          {/* ── Subject ── */}
          <CascadeRow step={1} label="科目" last={false}>
            <Dropdown
              value={subject}
              options={(Object.keys(SUBJECT_LABELS) as Subject[]).map((s) => ({
                value: s,
                label: SUBJECT_LABELS[s],
              }))}
              onChange={handleSubjectChange}
              icon={Layers}
            />
          </CascadeRow>

          {/* ── Material ── */}
          <CascadeRow step={2} label="教材" last={false}>
            <Dropdown
              value={selectedMaterialId}
              options={materialOptions}
              onChange={handleMaterialChange}
              placeholder="请选择教材"
              disabled={materials.length === 0 || loading}
              icon={FileText}
            />
          </CascadeRow>

          {/* ── Chapter ── */}
          <CascadeRow step={3} label="章节" last={false}>
            {showChapters ? (
              <Dropdown
                value={selectedChapterId}
                options={chapterOptions}
                onChange={handleChapterChange}
                placeholder="请选择章节"
                disabled={chapterOptions.length === 0 || (chapterOptions[0]?.disabled ?? false)}
                icon={BookOpen}
              />
            ) : (
              <div className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground text-[0.9rem] opacity-50 cursor-not-allowed select-none flex items-center gap-2.5">
                <BookOpen size={15} strokeWidth={1.8} />
                请先选择教材
              </div>
            )}
          </CascadeRow>

          {/* ── Knowledge points ── */}
          <CascadeRow step={4} label="知识点" last={true}>
            {!showKps ? (
              <div className="w-full px-4 py-3 rounded-xl border border-border bg-muted text-muted-foreground text-[0.9rem] opacity-50 select-none flex items-center gap-2.5">
                <Tag size={15} strokeWidth={1.8} />
                请先选择章节
              </div>
            ) : kps.length === 0 ? (
              <div className="w-full px-4 py-4 rounded-xl border border-border bg-card text-muted-foreground text-[0.875rem] text-center leading-relaxed">
                当前章节暂无知识点，请前往<button
                  onClick={() => navigate("/upload")}
                  className="text-primary underline underline-offset-2 mx-0.5"
                >教材管理</button>页面新增
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {kps.map((kp) => (
                  <KpCard
                    key={kp.kp_id}
                    kp={kp}
                    selected={selectedKpId === kp.kp_id}
                    onClick={() => handleKpSelect(kp.kp_id)}
                  />
                ))}
              </div>
            )}
          </CascadeRow>
        </div>

        {/* Greeting preview */}
        {greetingText && selectedKp && (
          <div className="mt-6 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3.5 flex gap-3 items-start">
            <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center mt-0.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="5" y="8" width="14" height="10" rx="2" fill="#2563EB" />
                <rect x="9" y="11" width="2" height="2" rx="0.5" fill="#fff" />
                <rect x="13" y="11" width="2" height="2" rx="0.5" fill="#fff" />
                <rect x="10.5" y="5" width="3" height="3" rx="1" fill="#2563EB" />
                <circle cx="12" cy="4.5" r="1" fill="#60A5FA" />
              </svg>
            </div>
            <div>
              <div className="text-[0.75rem] font-semibold text-blue-600 mb-1 uppercase tracking-wider">引导语预览</div>
              <p className="text-[0.875rem] text-blue-900 leading-relaxed">{greetingText}</p>
            </div>
          </div>
        )}
      </main>

      {/* Sticky footer CTA */}
      <div className="sticky bottom-0 bg-card border-t border-border px-4 py-4">
        <div className="max-w-xl mx-auto">
          <button
            onClick={handleStart}
            disabled={!canStart}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[1rem] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              ${canStart
                ? "bg-primary text-primary-foreground hover:bg-blue-700 active:scale-[0.99] shadow-sm shadow-primary/20"
                : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            开始费曼讲解
            <ArrowRight size={18} strokeWidth={2.5} className={canStart ? "text-white" : "text-muted-foreground"} />
          </button>
          {!canStart && (
            <p className="text-center text-[0.8125rem] text-muted-foreground mt-2">请先选择一个知识点</p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Cascade row with connector line ─── */
function CascadeRow({
  step,
  label,
  last,
  children,
}: {
  step: number;
  label: string;
  last: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      {/* Step indicator column */}
      <div className="flex flex-col items-center flex-shrink-0 w-8 pt-3">
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-[0.7rem] font-bold text-white leading-none">{step}</span>
        </div>
        {!last && <div className="flex-1 w-px bg-border mt-1 mb-1 min-h-[1.5rem]" />}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${last ? "pb-0" : "pb-5"}`}>
        <div className="text-[0.8125rem] font-semibold text-muted-foreground mb-2 pt-1.5">{label}</div>
        {children}
      </div>
    </div>
  );
}
