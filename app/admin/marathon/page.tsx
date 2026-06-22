"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Cfg { minWinrate: number; minTrades: number; minExpectancy: number; riskPct: number; maxConcurrent: number; start: number; target: number; market: string; tfs: string[] }
interface Trade { symbol: string; tf: string; action: string; status: string; pnl: number; closedAt: number }
interface Active { symbol: string; tf: string; action: string; entry: number; sl: number; tp: number; lot: number; riskUsd: number; winrate: number; filled: boolean }
interface State { deposit: number; status: string; actives: Active[]; trades: Trade[]; config: Cfg; configured: boolean }

const fmt = (n: number) => "$" + (n ?? 0).toFixed(2);

export default function MarathonPage() {
  const [s, setS] = useState<State | null>(null);
  const [err, setErr] = useState("");
  const [cfg, setCfg] = useState<Cfg | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const token = () => localStorage.getItem("rbhood-token");
  const load = () => {
    fetch(`${API}/api/marathon`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(async r => { if (!r.ok) { setErr(r.status === 403 ? "Только для админа" : "Ошибка"); return; } const d = await r.json(); setS(d); setCfg(d.config); })
      .catch(() => setErr("Сервер недоступен"));
  };
  useEffect(() => { load(); const id = setInterval(load, 20000); return () => clearInterval(id); }, []);

  const post = async (path: string, body?: unknown) => {
    await fetch(`${API}/api/marathon/${path}`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` }, body: body ? JSON.stringify(body) : undefined });
    load();
  };
  const saveConfig = async () => { if (!cfg) return; await post("config", cfg); setSavedMsg("Сохранено"); setTimeout(() => setSavedMsg(""), 2000); };

  if (err) return <div className="p-6 max-w-4xl mx-auto"><div className="font-exo text-sm text-[#EF4444]">{err}</div></div>;
  if (!s || !cfg) return <div className="p-6 max-w-4xl mx-auto"><div className="font-exo text-sm text-[#444]">Загрузка…</div></div>;

  const progress = Math.min(100, Math.round(((s.deposit - cfg.start) / (cfg.target - cfg.start)) * 100));
  const toggleTf = (tf: string) => setCfg({ ...cfg, tfs: cfg.tfs.includes(tf) ? cfg.tfs.filter(t => t !== tf) : [...cfg.tfs, tf] });

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Марафон</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">Виртуальный депозит по сигналам в Telegram-группу</p>
        </div>
        <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded-lg" style={s.status === "running" ? { color: "#02B365", background: "#02B36515" } : { color: "#F59E0B", background: "#F59E0B15" }}>
          {s.status === "running" ? "● Идёт" : s.status === "done" ? "🎉 Завершён" : "⏸ Пауза"}
        </span>
      </div>

      {!s.configured && (
        <div className="font-exo text-sm text-[#F59E0B] bg-[#F59E0B10] border border-[#F59E0B25] rounded-xl px-4 py-3">
          Бот не настроен: добавь MARATHON_BOT_TOKEN и MARATHON_CHAT_ID в backend/.env и перезапусти rbhood-back.
        </div>
      )}

      {/* Депозит + прогресс */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-exo text-xs text-[#555] mb-1">Текущий депозит</div>
            <div className="font-orbitron font-bold text-3xl" style={{ color: "#02B365" }}>{fmt(s.deposit)}</div>
          </div>
          <div className="text-right font-exo text-sm text-[#555]">старт {fmt(cfg.start)} → цель {fmt(cfg.target)}</div>
        </div>
        <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.max(0, progress)}%`, background: "linear-gradient(90deg,#02B365,#19BB74)" }} />
        </div>
      </div>

      {/* Активные сделки */}
      {s.actives.length > 0 && (
        <div className="rounded-2xl border border-[#02B36530] p-5 space-y-2" style={{ background: "#02B3650a" }}>
          <div className="font-exo font-bold text-white text-sm">Активные сделки ({s.actives.length}/{cfg.maxConcurrent})</div>
          {s.actives.map((a, i) => (
            <div key={i} className="rounded-xl border border-[#1a1a1a] px-3 py-2" style={{ background: "#0d0d0d" }}>
              <div className="font-mono text-sm text-white">{a.symbol} · {a.action.replace("_", " ")} · {a.tf} {a.filled ? "· ▶ в рынке" : "· ⏳ ждёт входа"}</div>
              <div className="font-mono text-[11px] text-[#888] mt-0.5">Вход {a.entry} · SL {a.sl} · TP {a.tp} · лот {a.lot} · риск {fmt(a.riskUsd)} · WR {a.winrate}%</div>
            </div>
          ))}
        </div>
      )}

      {/* Управление */}
      <div className="flex flex-wrap gap-2">
        {s.status !== "running" && <button onClick={() => post("start")} className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>▶ Запустить</button>}
        {s.status === "running" && <button onClick={() => post("stop")} className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-white border border-[#F59E0B40]" style={{ background: "#F59E0B15", color: "#F59E0B" }}>⏸ Пауза</button>}
        <button onClick={() => { if (confirm("Сбросить марафон на старт?")) post("reset"); }} className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-[#EF4444] border border-[#EF444430]" style={{ background: "#EF444410" }}>↺ Сброс</button>
      </div>

      {/* Настройки */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5 space-y-4" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm">Настройки</div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { k: "minWinrate", l: "Мин. винрейт, %" },
            { k: "riskPct", l: "Риск на сделку, %" },
            { k: "maxConcurrent", l: "Сделок одновременно" },
            { k: "minTrades", l: "Мин. сделок в бэктесте" },
            { k: "minExpectancy", l: "Мин. мат.ож, R" },
            { k: "start", l: "Старт депозита, $" },
            { k: "target", l: "Цель, $" },
          ].map(f => (
            <div key={f.k}>
              <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">{f.l}</div>
              <input value={String((cfg as unknown as Record<string, number>)[f.k])} onChange={e => setCfg({ ...cfg, [f.k]: Number(e.target.value.replace(/[^\d.]/g, "")) || 0 })}
                className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors" />
            </div>
          ))}
          <div>
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Рынок</div>
            <div className="grid grid-cols-3 gap-1">
              {["crypto", "forex", "both"].map(m => (
                <button key={m} onClick={() => setCfg({ ...cfg, market: m })}
                  className="py-2 rounded-lg font-exo text-xs font-semibold transition-all border"
                  style={cfg.market === m ? { background: "#02B36518", color: "#02B365", borderColor: "#02B36540" } : { background: "#161616", color: "#666", borderColor: "#1e1e1e" }}>
                  {m === "crypto" ? "Крипта" : m === "forex" ? "Форекс" : "Оба"}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Таймфреймы</div>
          <div className="flex gap-2">
            {["5m", "15m"].map(tf => (
              <button key={tf} onClick={() => toggleTf(tf)}
                className="px-4 py-2 rounded-lg font-exo text-sm font-semibold transition-all border"
                style={cfg.tfs.includes(tf) ? { background: "#02B36518", color: "#02B365", borderColor: "#02B36540" } : { background: "#161616", color: "#666", borderColor: "#1e1e1e" }}>
                {tf === "5m" ? "Скальп 5m" : "Дей 15m"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={saveConfig} className="px-5 py-2.5 rounded-xl font-exo font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>Сохранить настройки</button>
          {savedMsg && <span className="font-exo text-xs text-[#02B365]">{savedMsg}</span>}
        </div>
      </div>

      {/* История сделок */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="px-5 py-2.5 border-b border-[#181818] font-exo font-bold text-white text-sm">История ({s.trades.length})</div>
        <div className="divide-y divide-[#141414] max-h-[400px] overflow-y-auto">
          {s.trades.slice().reverse().map((tr, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-2.5">
              <span className="font-mono text-sm text-white flex-1">{tr.symbol} · {tr.action.replace("_", " ")} · {tr.tf}</span>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded" style={tr.status === "win" ? { color: "#02B365", background: "#02B36515" } : tr.status === "loss" ? { color: "#EF4444", background: "#EF444415" } : { color: "#888", background: "#1a1a1a" }}>{tr.status === "win" ? "TP" : tr.status === "loss" ? "SL" : "—"}</span>
              <span className="font-orbitron text-sm font-bold" style={{ color: tr.pnl >= 0 ? "#02B365" : "#EF4444" }}>{tr.pnl >= 0 ? "+" : ""}{fmt(tr.pnl)}</span>
            </div>
          ))}
          {s.trades.length === 0 && <div className="px-5 py-8 text-center font-exo text-sm text-[#444]">Сделок пока нет</div>}
        </div>
      </div>
    </div>
  );
}
