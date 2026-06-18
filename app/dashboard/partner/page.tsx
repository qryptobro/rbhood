"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const fmtKzt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

interface CodeInfo { code: string; discount: string; commission: number }
interface Stat { code: string; sales: number; revenue: number; commission: number }
interface Withdrawal { id: number; amount: number; card: string; status: string; requestedAt: number; paidAt: number | null }
interface Me {
  isPartner: boolean; minWithdraw: number;
  codes: CodeInfo[]; stats: Stat[];
  earned: number; paid: number; pending: number; available: number;
  withdrawals: Withdrawal[];
}

export default function PartnerPage() {
  const [me, setMe] = useState<Me | null>(null);
  const [err, setErr] = useState("");
  const [amount, setAmount] = useState("");
  const [card, setCard] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) return;
    fetch(`${API}/api/partner/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => { if (!r.ok) { setErr("Не удалось загрузить"); return; } setMe(await r.json()); })
      .catch(() => setErr("Сервер недоступен"));
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    setMsg(null); setBusy(true);
    try {
      const token = localStorage.getItem("rbhood-token");
      const r = await fetch(`${API}/api/partner/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: Number(amount), card }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ ok: false, text: d.error || "Ошибка" }); return; }
      setMsg({ ok: true, text: "Запрос на вывод отправлен" });
      setAmount(""); setCard("");
      load();
    } catch { setMsg({ ok: false, text: "Сервер недоступен" }); }
    finally { setBusy(false); }
  };

  const copy = (text: string) => { try { navigator.clipboard.writeText(text); } catch { /* ignore */ } };

  if (err) return <div className="px-8 py-10 max-w-3xl mx-auto"><div className="font-exo text-sm text-[#EF4444]">{err}</div></div>;
  if (!me) return <div className="px-8 py-10 max-w-3xl mx-auto"><div className="font-exo text-sm text-[#444]">Загрузка…</div></div>;

  if (!me.isPartner) {
    return (
      <div className="px-6 md:px-8 py-10 max-w-2xl mx-auto">
        <h1 className="font-exo font-bold text-white text-2xl mb-2">Партнёрская программа</h1>
        <div className="rounded-2xl border border-[#1a1a1a] p-8 text-center mt-4" style={{ background: "#111" }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 mx-auto border border-[#1e1e1e]" style={{ background: "#161616" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <div className="font-exo font-bold text-white text-lg mb-1">Станьте партнёром</div>
          <p className="font-exo text-sm text-[#666] mb-5 max-w-md mx-auto">Приводите клиентов по своему промокоду и получайте комиссию с каждой оплаты. Чтобы подключиться — напишите в поддержку по партнёрству <span className="text-[#02B365]">@rbhoodai</span>.</p>
          <a href="https://t.me/rbhoodai" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-exo font-bold text-sm text-white" style={{ background: "linear-gradient(90deg,#229ED9,#2AABEE)" }}>
            Стать партнёром
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-8 py-10 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-exo font-bold text-white text-2xl mb-1">Партнёрский кабинет</h1>
        <p className="font-exo text-sm text-[#444]">Ваша статистика и вывод средств</p>
      </div>

      {/* Карточки */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Заработано", v: me.earned, c: "#fff" },
          { l: "Доступно", v: me.available, c: "#02B365" },
          { l: "В ожидании", v: me.pending, c: "#F59E0B" },
          { l: "Выплачено", v: me.paid, c: "#888" },
        ].map(x => (
          <div key={x.l} className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
            <div className="font-exo text-xs text-[#555] mb-1">{x.l}</div>
            <div className="font-orbitron font-bold text-xl" style={{ color: x.c }}>{fmtKzt(x.v)}</div>
          </div>
        ))}
      </div>

      {/* Промокоды */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm mb-3">Ваши промокоды</div>
        <div className="space-y-2">
          {me.codes.map(c => {
            const stat = me.stats.find(s => s.code === c.code);
            return (
              <div key={c.code} className="flex items-center gap-3 rounded-xl border border-[#1a1a1a] px-4 py-3" style={{ background: "#161616" }}>
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-bold text-white tracking-wider">{c.code}</div>
                  <div className="font-exo text-[11px] text-[#555]">Скидка клиенту {c.discount} · ваша комиссия {c.commission}%</div>
                </div>
                <div className="text-right">
                  <div className="font-orbitron text-sm font-bold text-[#02B365]">{stat?.sales ?? 0} продаж</div>
                  <div className="font-exo text-[11px] text-[#555]">{fmtKzt(stat?.commission ?? 0)}</div>
                </div>
                <button onClick={() => copy(c.code)} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white hover:bg-[#1e1e1e] transition-all" title="Скопировать код">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Вывод средств */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm mb-1">Вывод средств</div>
        <p className="font-exo text-[11px] text-[#555] mb-4">Доступно к выводу: <span className="text-[#02B365] font-bold">{fmtKzt(me.available)}</span> · минимум {fmtKzt(me.minWithdraw)}</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Сумма, ₸</div>
            <input value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder={String(me.minWithdraw)}
              className="w-full h-11 px-3.5 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
          </div>
          <div>
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Номер карты</div>
            <input value={card} onChange={e => setCard(e.target.value)} inputMode="numeric" placeholder="4400 0000 0000 0000"
              className="w-full h-11 px-3.5 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
          </div>
        </div>
        {msg && <div className="font-exo text-xs mt-3" style={{ color: msg.ok ? "#02B365" : "#EF4444" }}>{msg.text}</div>}
        <button onClick={submit} disabled={busy || me.available < me.minWithdraw}
          className="mt-4 h-10 px-6 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
          {busy ? "…" : "Запросить вывод"}
        </button>
      </div>

      {/* История выводов */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm mb-3">История выводов</div>
        {me.withdrawals.length === 0 ? (
          <div className="font-exo text-sm text-[#444] py-4 text-center">Выводов пока нет</div>
        ) : (
          <div className="space-y-2">
            {me.withdrawals.map(w => (
              <div key={w.id} className="flex items-center gap-3 rounded-xl border border-[#1a1a1a] px-4 py-2.5" style={{ background: "#161616" }}>
                <div className="flex-1 min-w-0">
                  <div className="font-orbitron font-bold text-white">{fmtKzt(w.amount)}</div>
                  <div className="font-mono text-[10px] text-[#555]">карта •••• {w.card.replace(/\D/g, "").slice(-4)} · {new Date(w.requestedAt).toLocaleDateString("ru-RU")}</div>
                </div>
                <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg"
                  style={w.status === "paid" ? { color: "#02B365", background: "#02B36515" } : { color: "#F59E0B", background: "#F59E0B15" }}>
                  {w.status === "paid" ? "Выплачено" : "В обработке"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
