import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { LogOut, ChevronDown, User } from "lucide-react";
import { clearAuth, getUsername } from "../lib/auth";

export function UserMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const username = getUsername() ?? "用户";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleLogout() {
    clearAuth();
    navigate("/auth", { replace: true });
  }

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-[0.875rem] font-medium text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
          <User size={11} className="text-primary" strokeWidth={2.5} />
        </div>
        <span className="max-w-[80px] truncate">{username}</span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`text-muted-foreground transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-1.5 w-36 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-[0.875rem] text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} strokeWidth={2} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
