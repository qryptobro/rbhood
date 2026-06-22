"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Signal {
  id: number; time: number; symbol: string; category: string; tf: string;
  action: string; entry: number; sl: number; tp: number; rr: number; winrate: number; trades: number; expectancy: number | null;
  status: string; resultR: number | null;
}
interface Stats { total: number; open: number; expired: number; wins: number; losses: number; winrate: number | null; totalR: number }
interface Cfg { minWinrate: number; minTrades: number }

const STATUS_STYLE: Record<string, { c: string; bg: string; label: string }> = {
  open:    { c: "#F59E0B", bg: "#F59E0B15", label: "Открыт" },
  win:     { c: "#02B365", bg: "#02B36515", label: "TP ✓" },
  loss:    { c: "#EF4444", bg: "#EF444415", label: "SL ✗" },
  expired: { c: "#666",    bg: "#ffffff08", label: "Истёк" },
};
const TF_LABEL: Record<string, string> = { "5m": "Скальп 5m", "15m": "День 15m", "4h": "Свинг 4h" };

export default function SignalsPage() {
  const [data, setData] = useState<{ stats: Stats; items: Signal[]; config: Cfg } | null>(null);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("all");
  const [minWr, setMinWr] = useState("");
  const [minTr, setMinTr] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = () => {
    const token = localStorage.getItem("rbhood-token");
    fetch(`${API}/api/signals`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(async r => { if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; } const d = await r.json(); setData(d); setMinWr(String(d.config?.minWinrate ?? 60)); setMinTr(String(d.config?.minTrades ?? 15)); })
      .catch(() => setErr("Сервер недоступен"));
  };
  useEffect(() => { load(); }, []);

  const saveConfig = async () => {
    const token = localStorage.getItem("rbhood-token");
    await fetch(`${API}/api/signals/config`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ minWinrate: Number(minWr), minTrades: Number(minTr) }) });
    setSavedMsg("Сохранено"); setTimeout(() => setSavedMsg(""), 2000); load();
  };

  const items = (data?.items || []).filter(s => filter === "all" || s.status === filter);
  const fmt = (n: number) => n == null ? "—" : (n > 100 ? n.toFixed(2) : n.toFixed(n > 1 ? 4 : 6));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Сигналы</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Автогенерация по расписанию · только винрейт ≥ {data?.config?.minWinrate ?? 60}% · реальные исходы по MT5</p>
      </div>
      {err && <div className="font-exo text-sm text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-xl px-4 py-3">{err}</div>}

      {/* Настройки порога */}
      <div className="rounded-2xl border border-[#1a1a1a] p-4 flex flex-wrap items-end gap-4" style={{ background: "#111" }}>
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Мин. винрейт бэктеста, %</div>
          <input value={minWr} onChange={e => setMinWr(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric"
            className="w-32 bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors" />
        </div>
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Мин. сделок в бэктесте</div>
          <input value={minTr} onChange={e => setMinTr(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric"
            className="w-32 bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors" />
        </div>
        <button onClick={saveConfig} className="px-5 py-2.5 rounded-xl font-exo font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>Сохранить</button>
        {savedMsg && <span className="font-exo text-xs text-[#02B365]">{savedMsg}</span>}
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Реальный винрейт</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: data.stats.winrate != null && data.stats.winrate >= 55 ? "#02B365" : "#F59E0B" }}>{data.stats.winrate == null ? "—" : data.stats.winrate + "%"}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">P&L (в R)</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: data.stats.totalR >= 0 ? "#02B365" : "#EF4444" }}>{data.stats.totalR > 0 ? "+" : ""}{data.stats.totalR}R</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Выиграно / Проиграно</div>
            <div className="font-orbitron font-bold text-2xl text-white">{data.stats.wins}/{data.stats.losses}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Открытых</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: "#F59E0B" }}>{data.stats.open}</div>
          </div>
          <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">Всего сигналов</div>
            <div className="font-orbitron font-bold text-2xl text-white">{data.stats.total}</div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {["all","open","win","loss","expired"].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold uppercase tracking-wider transition-all ${filter===s?"text-white border border-[#02B365]":"text-[#444] border border-[#1a1a1a] hover:text-white"}`}
            style={filter===s?{background:"#02B36515"}:{background:"#111"}}>
            {s === "all" ? "Все" : STATUS_STYLE[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#1a1a1a] overflow-x-auto" style={{ background: "#111" }}>
        <div className="grid grid-cols-[1fr_1fr_0.8fr_1fr_1fr_1fr_0.6fr_0.8fr_0.7fr_1fr] gap-3 px-4 py-2.5 border-b border-[#181818] min-w-[900px]" style={{ background: "#0d0d0d" }}>
          {["Актив","ТФ","Тип","Вход","SL","TP","RR","Винрейт","Мат.ож","Статус"].map((h,i) => (
            <span key={i} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414] min-w-[900px]">
          {items.map(s => {
            const st = STATUS_STYLE[s.status] || STATUS_STYLE.open;
            const buy = s.action === "BUY_LIMIT";
            return (
              <div key={s.id} className="grid grid-cols-[1fr_1fr_0.8fr_1fr_1fr_1fr_0.6fr_0.8fr_0.7fr_1fr] gap-3 items-center px-4 py-2.5">
                <span className="font-orbitron text-sm font-bold text-white truncate">{s.symbol}</span>
                <span className="font-exo text-xs text-[#888]">{TF_LABEL[s.tf] || s.tf}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded w-fit" style={{ color: buy ? "#02B365" : "#EF4444", background: (buy ? "#02B365" : "#EF4444") + "18" }}>{buy ? "BUY" : "SELL"}</span>
                <span className="font-mono text-xs text-white">{fmt(s.entry)}</span>
                <span className="font-mono text-xs text-[#EF4444]">{fmt(s.sl)}</span>
                <span className="font-mono text-xs text-[#02B365]">{fmt(s.tp)}</span>
                <span className="font-mono text-xs text-[#6366F1]">1:{s.rr}</span>
                <span className="font-mono text-[11px] text-[#888]">{s.winrate}% <span className="text-[#444]">/{s.trades}</span></span>
                <span className="font-mono text-[11px]" style={{ color: (s.expectancy ?? 0) > 0 ? "#02B365" : "#EF4444" }}>{s.expectancy == null ? "—" : `${s.expectancy > 0 ? "+" : ""}${s.expectancy}R`}</span>
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded w-fit" style={{ color: st.c, background: st.bg }}>{st.label}{s.resultR != null && s.status !== "open" ? ` ${s.resultR > 0 ? "+" : ""}${s.resultR}R` : ""}</span>
              </div>
            );
          })}
          {items.length === 0 && !err && (
            <div className="px-5 py-10 text-center font-exo text-sm text-[#444]">Сигналов пока нет — генератор соберёт их в течение часа (только с винрейтом ≥ 60%).</div>
          )}
        </div>
      </div>
    </div>
  );
}
