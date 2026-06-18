"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Row { code: string; partner: string; sales: number; revenue: number; commission: number; paidOut: number; owed: number }
interface Data { rows: Row[]; totals: { sales: number; revenue: number; commission: number; owed: number } }

const fmtKzt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

export default function ReferralsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    const token = localStorage.getItem("rbhood-token");
    fetch(`${API}/api/referrals`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => {
        if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; }
        setData(await r.json());
      })
      .catch(() => setErr("Сервер недоступен"));
  };
  useEffect(() => { load(); }, []);

  const payout = async (code: string) => {
    if (!confirm(`Отметить комиссию по коду ${code} как выплаченную?`)) return;
    const token = localStorage.getItem("rbhood-token");
    try {
      const r = await fetch(`${API}/api/referrals/${encodeURIComponent(code)}/payout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) load();
    } catch { /* ignore */ }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Партнёры</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Комиссии партнёров по реферальным промокодам</p>
      </div>
      {err && <div className="font-exo text-sm text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-xl px-4 py-3">{err}</div>}

      {/* Сводка */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Продаж по кодам</div>
            <div className="font-orbitron font-bold text-white text-2xl">{data.totals.sales}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Оборот</div>
            <div className="font-orbitron font-bold text-white text-2xl">{fmtKzt(data.totals.revenue)}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Комиссия всего</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: "#02B365" }}>{fmtKzt(data.totals.commission)}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">К выплате</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: "#F59E0B" }}>{fmtKzt(data.totals.owed)}</div>
          </div>
        </div>
      )}

      {/* Таблица */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="grid grid-cols-[1.4fr_1.4fr_0.7fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 border-b border-[#181818]" style={{ background: "#0d0d0d" }}>
          {["Код","Партнёр","Продаж","Оборот","Комиссия","К выплате",""].map((h, i) => (
            <span key={i} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {(data?.rows || []).map(r => (
            <div key={r.code} className="grid grid-cols-[1.4fr_1.4fr_0.7fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
              <span className="font-mono font-bold text-white tracking-wider truncate">{r.code}</span>
              <span className="font-exo text-sm text-[#aaa] truncate">{r.partner || "—"}</span>
              <span className="font-orbitron text-sm font-bold text-white">{r.sales}</span>
              <span className="font-exo text-sm text-[#888]">{fmtKzt(r.revenue)}</span>
              <span className="font-orbitron text-sm font-bold" style={{ color: "#02B365" }}>{fmtKzt(r.commission)}</span>
              <span className="font-orbitron text-sm font-bold" style={{ color: r.owed > 0 ? "#F59E0B" : "#555" }}>{fmtKzt(r.owed)}</span>
              <button onClick={() => payout(r.code)} disabled={r.owed <= 0}
                className="px-3 py-1.5 rounded-lg font-exo text-xs font-bold transition-all disabled:opacity-30"
                style={{ background: r.owed > 0 ? "#02B36518" : "#1a1a1a", color: r.owed > 0 ? "#02B365" : "#555", border: "1px solid " + (r.owed > 0 ? "#02B36540" : "#222") }}>
                Выплатил
              </button>
            </div>
          ))}
          {(!data || data.rows.length === 0) && !err && (
            <div className="px-5 py-10 text-center font-exo text-sm text-[#444]">Пока нет продаж по партнёрским кодам</div>
          )}
        </div>
      </div>
    </div>
  );
}
