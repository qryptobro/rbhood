"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface DbUser { id: number; name: string; email: string; plan: string; role: string; active: boolean; createdAt: string }

const PLAN_COLORS: Record<string, string> = { FREE: "#4A90D9", MONTHLY: "#02B365", LIFETIME: "#F59E0B" };
const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: "#02B365", bg: "#02B36515", label: "Активен" },
  expired: { color: "#EF4444", bg: "#EF444415", label: "Отключён" },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [users, setUsers] = useState<DbUser[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    fetch(`${API}/api/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => {
        if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; }
        setUsers(await r.json());
      })
      .catch(() => setErr("Сервер недоступен"));
  }, []);

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const match = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const status = u.active ? "active" : "expired";
    const st = filter === "all" || status === filter;
    return match && st;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
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
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 border-b border-[#181818]">
          {["Имя","Email","Тариф","Статус","Регистрация"].map(h => (
            <span key={h} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {filtered.map(u => {
            const st = STATUS[u.active ? "active" : "expired"];
            return (
              <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
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
