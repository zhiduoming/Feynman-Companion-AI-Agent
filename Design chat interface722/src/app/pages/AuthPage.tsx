import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Toaster, toast } from "sonner";
import { saveAuth, isLoggedIn, mockLogin, mockRegister } from "../lib/auth";

/* ─── Types ─── */
type Tab = "login" | "register";

interface FieldError {
  username?: string;
  password?: string;
  confirm?: string;
}

/* ─── Validation ─── */
const USERNAME_RE = /^[a-zA-Z0-9]+$/;

function filterUsername(v: string) {
  return v.replace(/[^a-zA-Z0-9]/g, "");
}

function validateUsername(v: string): string | undefined {
  if (!v) return "用户名不能为空";
  if (!USERNAME_RE.test(v) || v.length < 4 || v.length > 16)
    return "用户名长度需 4–16 位，仅支持字母数字";
}

function validatePassword(v: string): string | undefined {
  if (!v) return "密码不能为空";
  if (v.length < 6) return "密码长度不能少于 6 位";
}

function validateConfirm(pw: string, confirm: string): string | undefined {
  if (!confirm) return "密码不能为空";
  if (pw !== confirm) return "两次输入的密码不一致";
}

/* ─── Input component ─── */
function FormInput({
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  right,
  autoComplete,
}: {
  type: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder: string;
  error?: string;
  right?: React.ReactNode;
  autoComplete?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className={`flex items-center rounded-xl border bg-background transition-all duration-150 ring-0
          ${error ? "border-red-400 focus-within:ring-2 focus-within:ring-red-200" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-ring"}`}
      >
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="flex-1 px-4 py-3 text-[0.9375rem] text-foreground placeholder:text-muted-foreground bg-transparent outline-none rounded-xl"
        />
        {right && <div className="pr-3">{right}</div>}
      </div>
      {error && (
        <div className="flex items-center gap-1.5 px-1">
          <AlertCircle size={12} className="text-red-500 flex-shrink-0" strokeWidth={2} />
          <span className="text-[0.78rem] text-red-500 leading-none">{error}</span>
        </div>
      )}
    </div>
  );
}

/* ─── Eye toggle ─── */
function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="text-muted-foreground hover:text-foreground transition-colors p-0.5 focus-visible:outline-none"
      aria-label={show ? "隐藏密码" : "显示密码"}
    >
      {show ? <EyeOff size={17} strokeWidth={1.8} /> : <Eye size={17} strokeWidth={1.8} />}
    </button>
  );
}

/* ─── Main page ─── */
export default function AuthPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("login");

  // Login form state
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginErrors, setLoginErrors] = useState<FieldError>({});
  const [loginApiError, setLoginApiError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regErrors, setRegErrors] = useState<FieldError>({});
  const [regApiError, setRegApiError] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) navigate("/upload", { replace: true });
  }, []);

  /* ── Tab switch ── */
  function switchTab(t: Tab) {
    setTab(t);
    // clear all form state
    setLoginUsername(""); setLoginPassword(""); setLoginShowPw(false);
    setLoginErrors({}); setLoginApiError("");
    setRegUsername(""); setRegPassword(""); setRegConfirm("");
    setRegShowPw(false); setRegShowConfirm(false);
    setRegErrors({}); setRegApiError("");
  }

  /* ── Login ── */
  function loginCanSubmit() {
    return loginUsername.trim() !== "" && loginPassword !== "";
  }

  function validateLoginLocally(): FieldError {
    return {
      username: validateUsername(loginUsername),
      password: validatePassword(loginPassword),
    };
  }

  async function handleLogin() {
    if (loginLoading) return;
    const errs = validateLoginLocally();
    if (errs.username || errs.password) {
      setLoginErrors(errs);
      return;
    }
    setLoginErrors({});
    setLoginApiError("");
    setLoginLoading(true);
    try {
      const { token, userId } = await mockLogin(loginUsername, loginPassword);
      saveAuth(token, userId, loginUsername);
      toast.success("登录成功");
      navigate("/upload", { replace: true });
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status === 401 || err?.status === 400) {
        setLoginApiError("用户名或密码错误");
      } else {
        toast.error("网络异常，请稍后重试");
      }
    } finally {
      setLoginLoading(false);
    }
  }

  /* ── Register ── */
  function regCanSubmit() {
    return regUsername !== "" && regPassword !== "" && regConfirm !== "" && regPassword === regConfirm;
  }

  function validateRegLocally(): FieldError {
    return {
      username: validateUsername(regUsername),
      password: validatePassword(regPassword),
      confirm: validateConfirm(regPassword, regConfirm),
    };
  }

  async function handleRegister() {
    if (regLoading) return;
    const errs = validateRegLocally();
    if (errs.username || errs.password || errs.confirm) {
      setRegErrors(errs);
      return;
    }
    setRegErrors({});
    setRegApiError("");
    setRegLoading(true);
    try {
      const { userId } = await mockRegister(regUsername);
      toast.success("注册成功，自动登录中…");
      // auto-login
      const { token } = await mockLogin(regUsername, regPassword).catch(() => ({
        token: `mock-token-${Date.now()}`,
      }));
      saveAuth(token as string, userId, regUsername);
      navigate("/upload", { replace: true });
    } catch (e: unknown) {
      const err = e as { status?: number };
      if (err?.status === 400) {
        setRegApiError("该用户名已被占用，请更换用户名");
      } else {
        toast.error("网络异常，请稍后重试");
      }
    } finally {
      setRegLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        fontFamily: "'Noto Sans SC', 'Inter', sans-serif",
        background: "linear-gradient(160deg, #f8f9fc 0%, #eef1f7 100%)",
      }}
    >
      <Toaster position="top-center" richColors />

      {/* Top-left logo */}
      <div className="fixed top-0 left-0 px-6 h-14 flex items-center z-20">
        <button
          onClick={() => navigate("/upload")}
          className="text-[0.9375rem] font-semibold text-foreground hover:text-primary transition-colors"
        >
          费曼伴学
        </button>
      </div>

      {/* Centered card */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div
          className="bg-white rounded-[12px] w-full"
          style={{
            maxWidth: 420,
            padding: "40px 32px",
            boxShadow: "0 4px 32px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <h1 className="text-[1.5rem] font-bold text-foreground leading-tight mb-1.5">费曼伴学</h1>
            <p className="text-[0.875rem] text-muted-foreground leading-relaxed">
              登录你的学习账号，保存教材与讲解记录
            </p>
          </div>

          {/* Tab bar */}
          <div className="relative flex border-b border-border mb-6">
            <div
              className="absolute bottom-0 left-0 h-[2px] w-1/2 bg-primary transition-transform duration-200 ease-out"
              style={{ transform: tab === "login" ? "translateX(0%)" : "translateX(100%)" }}
            />
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className={`flex-1 pb-3 text-[0.9rem] font-semibold transition-colors duration-150 focus-visible:outline-none
                  ${tab === t ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                {t === "login" ? "登录" : "注册"}
              </button>
            ))}
          </div>

          {/* ── Login form ── */}
          {tab === "login" && (
            <div className="flex flex-col gap-4">
              <FormInput
                type="text"
                value={loginUsername}
                onChange={(v) => setLoginUsername(filterUsername(v))}
                onBlur={() => setLoginErrors((e) => ({ ...e, username: validateUsername(loginUsername) }))}
                placeholder="请输入用户名（4-16 位字母/数字）"
                error={loginErrors.username}
                autoComplete="username"
              />

              <FormInput
                type={loginShowPw ? "text" : "password"}
                value={loginPassword}
                onChange={(v) => setLoginPassword(v)}
                onBlur={() => setLoginErrors((e) => ({ ...e, password: validatePassword(loginPassword) }))}
                placeholder="请输入密码（最少 6 位）"
                error={loginErrors.password}
                autoComplete="current-password"
                right={<EyeToggle show={loginShowPw} onToggle={() => setLoginShowPw((s) => !s)} />}
              />

              {loginApiError && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[0.875rem] text-red-600">{loginApiError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLogin}
                disabled={!loginCanSubmit() || loginLoading}
                className={`mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[0.9375rem] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${loginCanSubmit() && !loginLoading
                    ? "bg-primary text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
              >
                {loginLoading && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
                {loginLoading ? "登录中" : "登录"}
              </button>

              <p className="text-center text-[0.8125rem] text-muted-foreground">
                还没有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchTab("register")}
                  className="text-primary font-medium hover:underline underline-offset-2"
                >
                  去注册
                </button>
              </p>

              {/* Dev hint */}
              <div className="mt-1 rounded-lg bg-muted/60 border border-border px-3.5 py-2.5 text-[0.78rem] text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">测试账号</span>　teststudent / 123456
              </div>
            </div>
          )}

          {/* ── Register form ── */}
          {tab === "register" && (
            <div className="flex flex-col gap-4">
              <FormInput
                type="text"
                value={regUsername}
                onChange={(v) => setRegUsername(filterUsername(v))}
                onBlur={() => setRegErrors((e) => ({ ...e, username: validateUsername(regUsername) }))}
                placeholder="设置用户名（4-16 位字母/数字）"
                error={regErrors.username}
                autoComplete="username"
              />

              <FormInput
                type={regShowPw ? "text" : "password"}
                value={regPassword}
                onChange={(v) => setRegPassword(v)}
                onBlur={() => setRegErrors((e) => ({ ...e, password: validatePassword(regPassword) }))}
                placeholder="设置密码（至少 6 位）"
                error={regErrors.password}
                autoComplete="new-password"
                right={<EyeToggle show={regShowPw} onToggle={() => setRegShowPw((s) => !s)} />}
              />

              <FormInput
                type={regShowConfirm ? "text" : "password"}
                value={regConfirm}
                onChange={(v) => setRegConfirm(v)}
                onBlur={() => setRegErrors((e) => ({ ...e, confirm: validateConfirm(regPassword, regConfirm) }))}
                placeholder="再次输入密码"
                error={regErrors.confirm}
                autoComplete="new-password"
                right={<EyeToggle show={regShowConfirm} onToggle={() => setRegShowConfirm((s) => !s)} />}
              />

              {regApiError && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" strokeWidth={2} />
                  <span className="text-[0.875rem] text-red-600">{regApiError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleRegister}
                disabled={!regCanSubmit() || regLoading}
                className={`mt-1 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[0.9375rem] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  ${regCanSubmit() && !regLoading
                    ? "bg-primary text-white hover:bg-blue-700 active:scale-[0.99] shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
              >
                {regLoading && <Loader2 size={16} strokeWidth={2} className="animate-spin" />}
                {regLoading ? "注册中" : "注册"}
              </button>

              <p className="text-center text-[0.8125rem] text-muted-foreground">
                已有账号？{" "}
                <button
                  type="button"
                  onClick={() => switchTab("login")}
                  className="text-primary font-medium hover:underline underline-offset-2"
                >
                  去登录
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
