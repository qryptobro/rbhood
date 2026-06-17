"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Row { id: number; name: string; email: string; plan: string; requests: number; cost: number }
interface Data { costPerRequest: number; totalRequests: number; totalCost: number; rows: Row[] }

const PLAN_COLORS: Record<string, string> = { FREE: "#4A90D9", MONTHLY: "#02B365", LIFETIME: "#F59E0B" };
const fmtUsd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });

export default function AnalyticsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    fetch(`${API}/api/analytics`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => {
        if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; }
        setData(await r.json());
      })
      .catch(() => setErr("Сервер недоступен"));
  }, []);

  const rows = (data?.rows || []).filter(r => {
    const q = search.toLowerCase();
    return !q || r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Аналитика</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Расход по запросам анализа · {data ? fmtUsd(data.costPerRequest) : "$0.001"} за запрос</p>
      </div>
      {err && <div className="font-exo text-sm text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-xl px-4 py-3">{err}</div>}

      {/* Сводка */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Всего запросов</div>
            <div className="font-orbitron font-bold text-white text-2xl">{data.totalRequests.toLocaleString("ru-RU")}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Общий расход</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: "#02B365" }}>{fmtUsd(data.totalCost)}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Цена запроса</div>
            <div className="font-orbitron font-bold text-white text-2xl">{fmtUsd(data.costPerRequest)}</div>
          </div>
        </div>
      )}

      {/* Поиск */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1a1a1a] max-w-md" style={{ background: "#111" }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск по имени или email..."
          className="bg-transparent flex-1 font-exo text-sm text-white outline-none placeholder:text-[#333]" />
      </div>

      {/* Таблица */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-5 py-2.5 border-b border-[#181818]" style={{ background: "#0d0d0d" }}>
          {["Имя","Email","Тариф","Запросы","Расход"].map(h => (
            <span key={h} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {rows.map(r => (
            <div key={r.id} className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center font-exo font-bold text-xs text-white" style={{ background: "#1a1a1a", border: "1px solid #222" }}>{(r.name || "?")[0].toUpperCase()}</div>
                <span className="font-exo text-sm text-white truncate">{r.name}</span>
              </div>
              <span className="font-mono text-[11px] text-[#555] truncate">{r.email}</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md w-fit" style={{ color: PLAN_COLORS[r.plan] ?? "#666", background: (PLAN_COLORS[r.plan] ?? "#666") + "15" }}>{r.plan}</span>
              <span className="font-orbitron text-sm font-bold text-white">{r.requests.toLocaleString("ru-RU")}</span>
              <span className="font-orbitron text-sm font-bold" style={{ color: "#02B365" }}>{fmtUsd(r.cost)}</span>
            </div>
          ))}
          {rows.length === 0 && !err && (
            <div className="px-5 py-10 text-center font-exo text-sm text-[#444]">Пока нет данных по запросам</div>
          )}
        </div>
      </div>
    </div>
  );
}
