"use client";
import { useState } from "react";

const USERS: { id: number; name: string; email: string; plan: string; status: string; reg: string; signals: number }[] = [];

const PLAN_COLORS: Record<string, string> = { Pro: "#02B365", Elite: "#F59E0B", Starter: "#4A90D9" };
const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  active:  { color: "#02B365", bg: "#02B36515", label: "Активен" },
  expired: { color: "#EF4444", bg: "#EF444415", label: "Истёк"   },
};

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    const match = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const st = filter === "all" || u.status === filter;
    return match && st;
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Пользователи</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{USERS.length} зарегистрировано</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить
        </button>
      </div>

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
          {["Имя","Email","Тариф","Статус","Сигналы",""].map(h => (
            <span key={h} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {filtered.map(u => {
            const st = STATUS[u.status];
            return (
              <div key={u.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-exo font-bold text-xs text-white"
                    style={{ background: "#1a1a1a", border: "1px solid #222" }}>{u.name[0]}</div>
                  <span className="font-exo text-sm text-white truncate">{u.name}</span>
                </div>
                <span className="font-mono text-[11px] text-[#555] truncate">{u.email}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md w-fit"
                  style={{ color: PLAN_COLORS[u.plan] ?? "#666", background: (PLAN_COLORS[u.plan] ?? "#666") + "15" }}>
                  {u.plan}
                </span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md w-fit"
                  style={{ color: st.color, background: st.bg }}>{st.label}</span>
                <span className="font-orbitron text-sm font-bold text-white">{u.signals}</span>
                <button className="w-7 h-7 flex items-center justify-center rounded-lg text-[#333] hover:text-white hover:bg-[#1e1e1e] transition-all">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
