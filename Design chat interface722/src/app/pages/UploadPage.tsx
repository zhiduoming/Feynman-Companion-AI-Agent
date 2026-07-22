import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Upload,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { UserMenu } from "../components/UserMenu";

/* ─── Types ─── */
type Subject = "computer" | "math" | "politics";
type MaterialStatus = "parsing" | "chunking" | "extracting" | "generating" | "done" | "failed";

interface Material {
  id: string;
  name: string;
  status: MaterialStatus;
  step?: string;
  progress?: number;
  error?: string;
}

/* ─── Constants ─── */
const SUBJECT_LABELS: Record<Subject, string> = {
  computer: "计算机",
  math: "数学",
  politics: "政治",
};

const STEP_LABELS: Record<string, string> = {
  parsing: "解析中",
  chunking: "分块中",
  extracting: "抽取中",
  generating: "rubric生成中",
};

const PARSE_STEPS: Array<{ status: MaterialStatus; key: string; progress: number }> = [
  { status: "parsing", key: "parsing", progress: 20 },
  { status: "chunking", key: "chunking", progress: 45 },
  { status: "extracting", key: "extracting", progress: 70 },
  { status: "generating", key: "generating", progress: 88 },
];

const initialMaterials: Record<Subject, Material[]> = {
  computer: [
    { id: "m1", name: "数据结构教材.pdf", status: "generating", step: "generating", progress: 60 },
    { id: "m2", name: "操作系统教材.pdf", status: "done" },
  ],
  math: [],
  politics: [],
};

/* ─── Material item ─── */
function MaterialItem({
  material,
  onClick,
  onRetry,
}: {
  material: Material;
  onClick: () => void;
  onRetry: () => void;
}) {
  const isProcessing = ["parsing", "chunking", "extracting", "generating"].includes(material.status);
  const isDone = material.status === "done";
  const isFailed = material.status === "failed";

  return (
    <div
      onClick={isDone ? onClick : undefined}
      className={`flex items-center gap-3 bg-card border rounded-xl px-4 py-3.5 transition-all duration-150
        ${isDone
          ? "border-border cursor-pointer hover:border-primary/40 hover:shadow-sm hover:bg-blue-50/40"
          : "border-border cursor-default"
        }
      `}
    >
      <FileText
        size={18}
        className={`flex-shrink-0 ${isDone ? "text-primary/60" : "text-muted-foreground"}`}
        strokeWidth={1.8}
      />

      <div className="flex-1 min-w-0">
        <div className={`text-[0.9rem] font-medium truncate mb-1 ${isDone ? "text-foreground" : "text-foreground"}`}>
          {material.name}
        </div>

        {isProcessing && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] text-muted-foreground">
                {STEP_LABELS[material.step ?? ""] ?? material.step}
              </span>
              <span className="text-[0.8125rem] text-primary font-medium tabular-nums">
                {material.progress ?? 0}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-1.5 bg-primary rounded-full transition-all duration-700"
                style={{ width: `${material.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {isDone && (
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-green-500" strokeWidth={2.5} />
            <span className="text-[0.8125rem] text-green-600 font-medium">已完成 · 点击查看知识点</span>
          </div>
        )}

        {isFailed && (
          <div className="flex items-center gap-1.5">
            <AlertCircle size={13} className="text-red-500" strokeWidth={2} />
            <span className="text-[0.8125rem] text-red-600">{material.error ?? "解析失败"}</span>
          </div>
        )}
      </div>

      {isProcessing && (
        <Loader2 size={15} className="text-primary flex-shrink-0 animate-spin" strokeWidth={2} />
      )}

      {isFailed && (
        <button
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          className="flex-shrink-0 text-[0.8125rem] font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5 hover:bg-primary/5 transition-colors"
        >
          重试解析
        </button>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function UploadPage() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState<Subject>("computer");
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [materials, setMaterials] = useState<Record<Subject, Material[]>>(initialMaterials);
  const [uploadState, setUploadState] = useState<null | {
    progress: number;
    status: "uploading" | "error";
    errorMsg?: string;
    fileName?: string;
  }>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);
  const uploadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentMaterials = materials[subject];
  const isUploading = uploadState?.status === "uploading";

  /* ── Helpers ── */
  function updateMaterial(id: string, subj: Subject, patch: Partial<Material>) {
    setMaterials((prev) => ({
      ...prev,
      [subj]: prev[subj].map((m) => (m.id === id ? { ...m, ...patch } : m)),
    }));
  }

  function simulateParsing(id: string, subj: Subject) {
    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= PARSE_STEPS.length) {
        clearInterval(timer);
        updateMaterial(id, subj, { status: "done", step: undefined, progress: undefined });
        return;
      }
      const s = PARSE_STEPS[idx++];
      updateMaterial(id, subj, { status: s.status, step: s.key, progress: s.progress });
    }, 1800);
  }

  function validateAndUpload(file: File) {
    if (isUploading) return;
    const isPdf = file.name.toLowerCase().endsWith(".pdf") && file.type === "application/pdf";
    if (!isPdf) {
      toast.error("仅支持文字版PDF文件");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadState({ status: "error", progress: 0, fileName: file.name, errorMsg: "文件超过50MB大小限制" });
      return;
    }
    startUpload(file);
  }

  function startUpload(file: File) {
    setUploadState({ progress: 0, status: "uploading", fileName: file.name });
    let progress = 0;
    if (uploadTimerRef.current) clearInterval(uploadTimerRef.current);
    uploadTimerRef.current = setInterval(() => {
      progress = Math.min(100, progress + Math.random() * 14 + 6);
      if (progress >= 100) {
        clearInterval(uploadTimerRef.current!);
        setUploadState(null);
        const newId = `m${Date.now()}`;
        const newMaterial: Material = {
          id: newId,
          name: file.name,
          status: "parsing",
          step: "parsing",
          progress: 20,
        };
        setMaterials((prev) => ({
          ...prev,
          [subject]: [newMaterial, ...prev[subject]],
        }));
        simulateParsing(newId, subject);
      } else {
        setUploadState((prev) => (prev ? { ...prev, progress: Math.floor(progress) } : prev));
      }
    }, 280);
  }

  /* ── Drag handlers ── */
  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOver(true);
  }
  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    dragCounterRef.current = 0;
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) validateAndUpload(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) validateAndUpload(file);
    e.target.value = "";
  }

  function handleRetry(id: string) {
    updateMaterial(id, subject, { status: "parsing", step: "parsing", progress: 20, error: undefined });
    simulateParsing(id, subject);
  }

  function handleMaterialClick(m: Material) {
    if (m.status !== "done") return;
    navigate(`/knowledge?materialId=${m.id}&subject=${subject}&name=${encodeURIComponent(m.name)}`);
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col"
      style={{ fontFamily: "'Noto Sans SC', 'Inter', sans-serif" }}
    >
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-card border-b border-border h-14 flex items-center justify-between px-6">
        <span className="font-semibold text-foreground text-[0.9375rem]">费曼伴学</span>

        <div className="flex items-center gap-2">
          {/* Subject dropdown */}
        <div className="relative">
          <button
            onClick={() => setSubjectOpen((o) => !o)}
            onBlur={() => setTimeout(() => setSubjectOpen(false), 150)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[0.875rem] font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {SUBJECT_LABELS[subject]}
            <ChevronDown
              size={14}
              strokeWidth={2}
              className={`transition-transform duration-150 ${subjectOpen ? "rotate-180" : ""}`}
            />
          </button>
          {subjectOpen && (
            <div className="absolute right-0 mt-1.5 w-28 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-40">
              {(Object.keys(SUBJECT_LABELS) as Subject[]).map((s) => (
                <button
                  key={s}
                  onMouseDown={() => handleSubjectChange(s)}
                  className={`w-full text-left px-4 py-2.5 text-[0.875rem] transition-colors
                    ${s === subject
                      ? "bg-primary/8 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                    }`}
                >
                  {SUBJECT_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 flex flex-col gap-7">
        <h1 className="text-xl font-semibold text-foreground">上传教材PDF</h1>

        {/* Drop zone */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-4 min-h-[196px] select-none
            ${isUploading ? "pointer-events-none cursor-default" : "cursor-pointer"}
            ${dragOver
              ? "border-primary bg-blue-50 shadow-inner"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileInput}
          />

          {isUploading ? (
            <div className="flex flex-col items-center gap-3 px-10 w-full">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <FileText size={22} className="text-primary" strokeWidth={1.8} />
              </div>
              <div className="text-[0.875rem] text-muted-foreground truncate max-w-full px-4">
                {uploadState?.fileName}
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-primary rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${uploadState?.progress ?? 0}%` }}
                />
              </div>
              <div className="text-[0.9rem] text-primary font-semibold">
                文件上传中 {uploadState?.progress ?? 0}%
              </div>
            </div>
          ) : (
            <>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200
                  ${dragOver ? "bg-primary/15 scale-110" : "bg-muted"}`}
              >
                <Upload
                  size={24}
                  className={`transition-colors ${dragOver ? "text-primary" : "text-muted-foreground"}`}
                  strokeWidth={1.8}
                />
              </div>
              <div className="text-center">
                <div className="text-[0.9375rem] font-medium text-foreground mb-1">
                  拖拽教材PDF到此处 / 点击选择文件
                </div>
                <div className="text-[0.8125rem] text-muted-foreground">
                  仅支持文字版PDF文件，文件大小上限50MB
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload error banner */}
        {uploadState?.status === "error" && (
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-red-700 text-[0.875rem]">
              <AlertCircle size={15} strokeWidth={2} className="flex-shrink-0" />
              {uploadState.errorMsg}
            </div>
            <button
              onClick={() => {
                setUploadState(null);
                fileInputRef.current?.click();
              }}
              className="ml-4 flex-shrink-0 text-[0.8125rem] font-semibold text-red-700 underline underline-offset-2 hover:text-red-900"
            >
              重新上传
            </button>
          </div>
        )}

        {/* Materials list */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-[0.8125rem] font-semibold text-muted-foreground uppercase tracking-wider">
              已上传教材 · {SUBJECT_LABELS[subject]}
            </h2>
            {currentMaterials.length > 0 && (
              <span className="text-[0.75rem] text-muted-foreground">{currentMaterials.length} 份</span>
            )}
          </div>

          {currentMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-1">
                <FileText size={20} className="text-muted-foreground" strokeWidth={1.5} />
              </div>
              <p className="text-[0.9rem] text-muted-foreground text-center">
                暂无上传教材，请拖拽PDF文件上传
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {currentMaterials.map((m) => (
                <MaterialItem
                  key={m.id}
                  material={m}
                  onClick={() => handleMaterialClick(m)}
                  onRetry={() => handleRetry(m.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );

  function handleSubjectChange(s: Subject) {
    setSubject(s);
    setSubjectOpen(false);
  }
}
