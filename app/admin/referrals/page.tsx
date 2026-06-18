"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Row { code: string; partner: string; sales: number; revenue: number; commission: number; paidOut: number; owed: number }
interface Data { rows: Row[]; totals: { sales: number; revenue: number; commission: number; owed: number } }
interface Wd { id: number; userId: number; email: string; name: string; amount: number; card: string; status: string; requestedAt: number; paidAt: number | null }
interface Partner { code: string; name: string; email: string; createdAt: number; sales: number; commission: number }

const fmtKzt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

export default function ReferralsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [wds, setWds] = useState<Wd[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [err, setErr] = useState("");

  const load = () => {
    const token = localStorage.getItem("rbhood-token");
    const h: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${API}/api/referrals`, { headers: h })
      .then(async r => {
        if (!r.ok) { setErr(r.status === 403 ? "Доступ только для администратора" : "Не удалось загрузить"); return; }
        setData(await r.json());
      })
      .catch(() => setErr("Сервер недоступен"));
    fetch(`${API}/api/withdrawals`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setWds(d.items || []); })
      .catch(() => { /* ignore */ });
    fetch(`${API}/api/referrals/partners`, { headers: h })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPartners(d.items || []); })
      .catch(() => { /* ignore */ });
  };
  useEffect(() => { load(); }, []);

  const markPaid = async (id: number) => {
    if (!confirm("Отметить вывод как выплаченный?")) return;
    const token = localStorage.getItem("rbhood-token");
    try {
      const r = await fetch(`${API}/api/withdrawals/${id}/paid`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
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
            <div className="font-exo text-xs text-[#555] mb-1">Запросов на вывод</div>
            <div className="font-orbitron font-bold text-2xl" style={{ color: "#F59E0B" }}>{fmtKzt(wds.filter(w => w.status === "pending").reduce((s, w) => s + w.amount, 0))}</div>
          </div>
        </div>
      )}

      {/* Партнёры (создали промокод) */}
      <div>
        <div className="font-exo font-bold text-white text-sm mb-2">Партнёры <span className="font-mono text-[11px] text-[#555]">({partners.length})</span></div>
        <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
          <div className="grid grid-cols-[1.4fr_1.8fr_1fr_0.9fr_0.7fr_1fr] gap-3 px-5 py-2.5 border-b border-[#181818]" style={{ background: "#0d0d0d" }}>
            {["Имя","Email","Код","Создан","Продаж","Комиссия"].map((h, i) => (
              <span key={i} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-[#141414]">
            {partners.map(p => (
              <div key={p.code} className="grid grid-cols-[1.4fr_1.8fr_1fr_0.9fr_0.7fr_1fr] gap-3 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
                <span className="font-exo text-sm text-white truncate">{p.name || "—"}</span>
                <span className="font-mono text-[11px] text-[#888] truncate">{p.email}</span>
                <span className="font-mono font-bold text-[#02B365] tracking-wider truncate">{p.code}</span>
                <span className="font-mono text-[11px] text-[#555]">{new Date(p.createdAt).toLocaleDateString("ru-RU")}</span>
                <span className="font-orbitron text-sm font-bold text-white">{p.sales}</span>
                <span className="font-orbitron text-sm font-bold text-[#02B365]">{fmtKzt(p.commission)}</span>
              </div>
            ))}
            {partners.length === 0 && (
              <div className="px-5 py-8 text-center font-exo text-sm text-[#444]">Партнёры ещё не создавали промокоды</div>
            )}
          </div>
        </div>
      </div>

      {/* Запросы на вывод */}
      <div>
        <div className="font-exo font-bold text-white text-sm mb-2">Запросы на вывод {wds.filter(w => w.status === "pending").length > 0 && <span className="ml-1 font-mono text-[11px] text-[#F59E0B]">({wds.filter(w => w.status === "pending").length} новых)</span>}</div>
        <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
          {wds.length === 0 ? (
            <div className="px-5 py-8 text-center font-exo text-sm text-[#444]">Запросов на вывод нет</div>
          ) : (
            <div className="divide-y divide-[#141414]">
              {wds.map(w => (
                <div key={w.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex-1 min-w-0">
                    <div className="font-exo text-sm text-white truncate">{w.name} <span className="font-mono text-[11px] text-[#555]">{w.email}</span></div>
                    <div className="font-mono text-[11px] text-[#888]">карта: {w.card} · {new Date(w.requestedAt).toLocaleString("ru-RU")}</div>
                  </div>
                  <span className="font-orbitron font-bold text-white text-lg flex-shrink-0">{fmtKzt(w.amount)}</span>
                  {w.status === "paid" ? (
                    <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0" style={{ color: "#02B365", background: "#02B36515" }}>Выплачено</span>
                  ) : (
                    <button onClick={() => markPaid(w.id)}
                      className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 flex-shrink-0"
                      style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
                      Отметить выплату
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Таблица начислений по кодам */}
      <div className="font-exo font-bold text-white text-sm mb-[-8px]">Начисления по кодам</div>
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="grid grid-cols-[1.6fr_1.6fr_0.8fr_1fr_1fr] gap-3 px-5 py-2.5 border-b border-[#181818]" style={{ background: "#0d0d0d" }}>
          {["Код","Партнёр","Продаж","Оборот","Начислено"].map((h, i) => (
            <span key={i} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</span>
          ))}
        </div>
        <div className="divide-y divide-[#141414]">
          {(data?.rows || []).map(r => (
            <div key={r.code} className="grid grid-cols-[1.6fr_1.6fr_0.8fr_1fr_1fr] gap-3 items-center px-5 py-3 hover:bg-[#141414] transition-colors">
              <span className="font-mono font-bold text-white tracking-wider truncate">{r.code}</span>
              <span className="font-exo text-sm text-[#aaa] truncate">{r.partner || "—"}</span>
              <span className="font-orbitron text-sm font-bold text-white">{r.sales}</span>
              <span className="font-exo text-sm text-[#888]">{fmtKzt(r.revenue)}</span>
              <span className="font-orbitron text-sm font-bold" style={{ color: "#02B365" }}>{fmtKzt(r.commission)}</span>
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
