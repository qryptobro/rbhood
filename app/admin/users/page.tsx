"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DbUser { id: number; name: string; email: string; plan: string; role: string; active: boolean; createdAt: string }

const PLAN_COLORS: Record<string, string> = { FREE: "#4A90D9", MONTHLY: "#02B365", LIFETIME: "#F59E0B" };
const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: "#02B365", bg: "#02B36515", label: "Активен" },
  expired: { color: "#EF4444", bg: "#EF444415", label: "Отключён" },
};
const PLANS = ["FREE", "MONTHLY", "LIFETIME"];
const PLAN_LABEL: Record<string, string> = { FREE: "Нет доступа", MONTHLY: "Monthly", LIFETIME: "Lifetime" };

// ─── Модалка управления пользователем ──────────────────────────────────────────
function ManageModal({
  user, onClose, onPatch, onDelete,
}: {
  user: DbUser;
  onClose: () => void;
  onPatch: (data: Partial<DbUser>) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [plan, setPlan] = useState(user.plan);
  const [admin, setAdmin] = useState(user.role === "ADMIN");
  const [active, setActive] = useState(user.active);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    await onPatch({ plan, role: admin ? "ADMIN" : "USER", active });
    setBusy(false);
    onClose();
  };

  const del = async () => {
    if (!confirm(`Удалить пользователя ${user.email}?`)) return;
    setBusy(true);
    await onDelete();
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-[#222] p-6 space-y-5" style={{ background: "#111" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="font-orbitron font-bold text-white truncate">{user.name}</div>
            <div className="font-mono text-[11px] text-[#555] truncate">{user.email}</div>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Доступ к дашборду (тариф) */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Доступ к дашборду (тариф)</div>
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(p => (
              <button key={p} onClick={() => setPlan(p)}
                className="py-2.5 rounded-xl font-exo text-xs font-semibold transition-all border"
                style={plan === p
                  ? { background: (PLAN_COLORS[p]) + "20", color: PLAN_COLORS[p], borderColor: PLAN_COLORS[p] + "60" }
                  : { background: "#161616", color: "#666", borderColor: "#1e1e1e" }}>
                {PLAN_LABEL[p]}
              </button>
            ))}
          </div>
          <div className="font-mono text-[10px] text-[#444] mt-1.5">FREE = нет доступа к дашборду. Monthly / Lifetime = доступ открыт.</div>
        </div>

        {/* Роль админа */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-exo text-sm text-white">Доступ в админку</div>
            <div className="font-mono text-[10px] text-[#444]">Роль ADMIN — полный доступ к /admin</div>
          </div>
          <button onClick={() => setAdmin(v => !v)} className="relative rounded-full transition-all flex-shrink-0"
            style={{ background: admin ? "#02B365" : "#1e1e1e", padding: "2px", width: 44, height: 24 }}>
            <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ transform: admin ? "translateX(20px)" : "translateX(0px)" }} />
          </button>
        </div>

        {/* Активность */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-exo text-sm text-white">Аккаунт активен</div>
            <div className="font-mono text-[10px] text-[#444]">Отключённый не сможет войти</div>
          </div>
          <button onClick={() => setActive(v => !v)} className="relative rounded-full transition-all flex-shrink-0"
            style={{ background: active ? "#02B365" : "#1e1e1e", padding: "2px", width: 44, height: 24 }}>
            <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ transform: active ? "translateX(20px)" : "translateX(0px)" }} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={del} disabled={busy}
            className="px-4 py-2.5 rounded-xl font-exo font-bold text-sm text-[#EF4444] border border-[#EF444430] hover:bg-[#EF444410] transition-all disabled:opacity-40">
            Удалить
          </button>
          <button onClick={save} disabled={busy}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
            {busy ? "…" : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Страница ───────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState<DbUser[]>([]);
  const [err, setErr] = useState("");
  const [manage, setManage] = useState<DbUser | null>(null);

  const token = () => localStorage.getItem("rbhood-token");

  const load = () => {
    fetch(`${API}/api/users`, { headers: token() ? { Authorization: `Bearer ${token()}` } : {} })
      .then(async r => {
        if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; }
        setUsers(await r.json());
      })
      .catch(() => setErr("Сервер недоступен"));
  };
  useEffect(() => { load(); }, []);

  const patchUser = async (id: number, data: Partial<DbUser>) => {
    try {
      const r = await fetch(`${API}/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify(data),
      });
      if (!r.ok) { alert("Не удалось сохранить"); return; }
      const updated = await r.json();
      setUsers(us => us.map(u => u.id === id ? { ...u, ...updated } : u));
    } catch { alert("Сервер недоступен"); }
  };

  const deleteUser = async (id: number) => {
    try {
      const r = await fetch(`${API}/api/users/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
      if (!r.ok) { alert("Не удалось удалить"); return; }
      setUsers(us => us.filter(u => u.id !== id));
    } catch { alert("Сервер недоступен"); }
  };

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const match = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const status = u.active ? "active" : "expired";
    const st = filter === "all" || status === filter;
    return match && st;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {manage && (
        <ManageModal
          user={manage}
          onClose={() => setManage(null)}
          onPatch={(data) => patchUser(manage.id, data)}
          onDelete={() => deleteUser(manage.id)}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Пользователи</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{users.length} зарегистрировано</p>
        </div>
      </div>
      {err && <div className="font-exo text-sm text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-xl px-4 py-3">{err}</div>}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1a1a1a] flex-1 min-w-[200px]" style={{ background: "#111" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по имени или email..."
            className="bg-transparent flex-1 font-exo text-sm text-white outline-none placeholder:text-[#333]" />
        </div>
        {["all","active","expired"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-2 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${filter===s?"text-white border border-[#02B365]":"text-[#444] border border-[#1a1a1a] hover:text-white hover:border-[#333]"}`}
            style={filter===s?{background:"#02B36515"}:{background:"#111"}}>
            {s === "all" ? "Все" : STATUS[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 border-b border-[#181818]">
          {["Имя","Email","Тариф","Статус","Регистрация",""].map((h, i) => (
            <span key={i} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {filtered.map(u => {
            const st = STATUS[u.active ? "active" : "expired"];
            return (
              <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-exo font-bold text-xs text-white"
                    style={{ background: "#1a1a1a", border: "1px solid #222" }}>{(u.name || "?")[0].toUpperCase()}</div>
                  <span className="font-exo text-sm text-white truncate">{u.name}{u.role === "ADMIN" && <span className="ml-2 font-mono text-[8px] text-[#02B365]">ADMIN</span>}</span>
                </div>
                <span className="font-mono text-[11px] text-[#555] truncate">{u.email}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md w-fit"
                  style={{ color: PLAN_COLORS[u.plan] ?? "#666", background: (PLAN_COLORS[u.plan] ?? "#666") + "15" }}>
                  {u.plan}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md w-fit"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
                <span className="font-mono text-[11px] text-[#555]">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
                <button onClick={() => setManage(u)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white hover:bg-[#1e1e1e] transition-all justify-self-end"
                  title="Управление">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                  </svg>
                </button>
              </div>
            );
          })}
          {filtered.length === 0 && !err && (
            <div className="px-5 py-10 text-center font-exo text-sm text-[#444]">Пользователей пока нет</div>
          )}
        </div>
      </div>
    </div>
  );
}
