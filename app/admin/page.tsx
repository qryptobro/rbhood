"use client";
import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
interface DbUser { id: number; name: string; email: string; plan: string; active: boolean; createdAt: string }
const PLAN_C: Record<string, string> = { FREE: "#4A90D9", MONTHLY: "#02B365", LIFETIME: "#F59E0B" };

const STATS = [
  { label: "Пользователи",     value: "0",  delta: "",  up: true,  icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" },
  { label: "Активные планы",   value: "0",  delta: "",  up: true,  icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { label: "Выручка (мес.)",   value: "$0", delta: "",  up: true,  icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { label: "Новых сегодня",    value: "0",  delta: "",  up: true,  icon: "M22 12h-4l-3 9L9 3l-3 9H2" },
];

const ALL_MONTHS = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const ALL_VALUES = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export default function AdminDashboard() {
  const [period, setPeriod] = useState<"3м"|"6м"|"12м">("6м");
  const count = period === "3м" ? 3 : period === "6м" ? 6 : 12;
  const months = ALL_MONTHS.slice(-count);
  const values = ALL_VALUES.slice(-count);

  const [users, setUsers] = useState<DbUser[]>([]);
  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    fetch(`${API}/api/users`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r => r.ok ? r.json() : [])
      .then(setUsers)
      .catch(() => {});
  }, []);

  const today = new Date().toDateString();
  const stats = [
    { ...STATS[0], value: String(users.length) },
    { ...STATS[1], value: String(users.filter(u => u.plan !== "FREE").length) },
    { ...STATS[2], value: STATS[2].value },
    { ...STATS[3], value: String(users.filter(u => new Date(u.createdAt).toDateString() === today).length) },
  ];
  const recent = users.slice(0, 5);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Дашборд</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Обзор платформы · rbhood ai admin</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#161616" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.icon} />
                </svg>
              </div>
              {s.delta && (
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-lg"
                  style={{ color: s.up ? "#02B365" : "#EF4444", background: s.up ? "#02B36515" : "#EF444415" }}>
                  {s.delta}
                </span>
              )}
            </div>
            <div className="font-orbitron font-bold text-xl text-white">{s.value}</div>
            <div className="font-exo text-xs text-[#444] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue chart placeholder */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-exo font-bold text-white text-sm">Выручка по месяцам</div>
            <div className="font-mono text-[10px] text-[#333] mt-0.5">2026 · USD</div>
          </div>
          <div className="flex gap-2">
            {(["3м","6м","12м"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`font-mono text-[10px] px-2.5 py-1 rounded-lg transition-colors ${period===p?"text-white border border-[#02B365]":"text-[#444] hover:text-white border border-transparent"}`}
                style={period===p?{background:"#02B36515"}:{}}>{p}</button>
            ))}
          </div>
        </div>
        {/* Bar chart */}
        <div className="flex items-end gap-1.5 h-28">
          {values.map((v,i) => (
            <div key={i} className="flex-1 rounded-t-md transition-all duration-300" style={{ height: `${v}%`, background: i===values.length-1?"#02B365":"#1a1a1a" }} />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {months.map(m => (
            <span key={m} className="flex-1 text-center font-mono text-[8px] text-[#333]">{m}</span>
          ))}
        </div>
      </div>

      {/* Recent users */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#181818]">
          <div className="font-exo font-bold text-white text-sm">Последние пользователи</div>
          <a href="/admin/users" className="font-mono text-[10px] text-[#02B365] hover:underline">Все →</a>
        </div>
        <div className="divide-y divide-[#141414]">
          {recent.map(u => (
            <div key={u.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#141414] transition-colors">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center font-exo font-bold text-xs text-white"
                style={{ background: "#1a1a1a", border: "1px solid #222" }}>
                {(u.name || "?")[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-exo text-sm font-semibold text-white truncate">{u.name}</div>
                <div className="font-mono text-[10px] text-[#444] truncate">{u.email}</div>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0"
                style={{ color: PLAN_C[u.plan] ?? "#666", background: (PLAN_C[u.plan] ?? "#666") + "15" }}>
                {u.plan}
              </span>
              <span className="font-mono text-[10px] text-[#333] flex-shrink-0 hidden lg:block">{new Date(u.createdAt).toLocaleDateString("ru-RU")}</span>
            </div>
          ))}
          {recent.length === 0 && (
            <div className="px-5 py-8 text-center font-exo text-sm text-[#444]">Пользователей пока нет</div>
          )}
        </div>
      </div>
    </div>
  );
}
