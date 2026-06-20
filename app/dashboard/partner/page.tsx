"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const fmtKzt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

interface CodeInfo { code: string; discount: string; commission: number }
interface Stat { code: string; sales: number; revenue: number; commission: number }
interface Withdrawal { id: number; amount: number; card: string; status: string; requestedAt: number; paidAt: number | null }
interface CodeConfig { discount: number; commission: number; maxPerUser: number; canCreate: boolean }
interface Me {
  isPartner: boolean; minWithdraw: number;
  codeConfig: CodeConfig;
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
  const [newCode, setNewCode] = useState("");
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [codeBusy, setCodeBusy] = useState(false);

  const createCode = async () => {
    if (!newCode.trim()) return;
    setCodeMsg(null); setCodeBusy(true);
    try {
      const token = localStorage.getItem("rbhood-token");
      const r = await fetch(`${API}/api/partner/code`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: newCode.trim() }),
      });
      const d = await r.json();
      if (!r.ok) { setCodeMsg({ ok: false, text: d.error || "Ошибка" }); return; }
      setMe(d); setNewCode("");
      setCodeMsg({ ok: true, text: "Промокод создан" });
    } catch { setCodeMsg({ ok: false, text: "Сервер недоступен" }); }
    finally { setCodeBusy(false); }
  };

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

  return (
    <div className="px-6 md:px-8 py-10 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-exo font-bold text-white text-2xl mb-1">Партнёрский кабинет</h1>
        <p className="font-exo text-sm text-[#444]">Создайте промокод, приводите клиентов и получайте комиссию</p>
      </div>

      {!me.isPartner && (
        <div className="rounded-2xl border border-[#02B36530] p-4 font-exo text-sm text-[#9ad5b8]" style={{ background: "#02B3650d" }}>
          Создайте свой промокод ниже и начните зарабатывать. Условия фиксированы: клиент получает <b className="text-white">−{me.codeConfig.discount}%</b>, вы — <b className="text-white">{me.codeConfig.commission}%</b> комиссии с каждой оплаты.
        </div>
      )}

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

        {/* Создать код */}
        {me.codeConfig.canCreate && (
          <div className="mb-4">
            <div className="flex gap-2">
              <input value={newCode} onChange={e => { setNewCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "")); setCodeMsg(null); }}
                placeholder="ВАШ КОД (напр. NURLAN)" maxLength={20}
                className="flex-1 h-11 px-3.5 rounded-xl border border-[#1e1e1e] bg-[#0d0d0d] text-white text-sm font-mono tracking-wider outline-none focus:border-[#02B365] transition-colors placeholder:text-[#444] placeholder:font-exo placeholder:tracking-normal" />
              <button onClick={createCode} disabled={codeBusy || !newCode.trim()}
                className="px-5 h-11 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
                style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
                {codeBusy ? "…" : "Создать"}
              </button>
            </div>
            <div className="font-mono text-[10px] text-[#555] mt-1.5">
              Условия фиксированы: скидка клиенту −{me.codeConfig.discount}%, ваша комиссия {me.codeConfig.commission}%.
            </div>
            {codeMsg && <div className="font-exo text-xs mt-1.5" style={{ color: codeMsg.ok ? "#02B365" : "#EF4444" }}>{codeMsg.text}</div>}
          </div>
        )}

        <div className="space-y-2">
          {me.codes.length === 0 && <div className="font-exo text-sm text-[#444] py-2">У вас пока нет промокодов — создайте первый выше.</div>}
          {me.codes.map(c => {
            const stat = me.stats.find(s => s.code === c.code);
            const base = typeof window !== "undefined" ? window.location.origin : "https://ai.rbhood.kz";
            const link = `${base}/?ref=${c.code}`;
            return (
              <div key={c.code} className="rounded-xl border border-[#1a1a1a] px-4 py-3 space-y-2.5" style={{ background: "#161616" }}>
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono font-bold text-white tracking-wider">{c.code}</div>
                    <div className="font-exo text-[11px] text-[#555]">Скидка клиенту {c.discount} · ваша комиссия {c.commission}%</div>
                  </div>
                  <div className="text-right">
                    <div className="font-orbitron text-sm font-bold text-[#02B365]">{stat?.sales ?? 0} продаж</div>
                    <div className="font-exo text-[11px] text-[#555]">{fmtKzt(stat?.commission ?? 0)}</div>
                  </div>
                </div>
                {/* Реф-ссылка */}
                <div className="flex items-center gap-2 rounded-lg border border-[#222] px-3 py-2" style={{ background: "#0d0d0d" }}>
                  <span className="font-mono text-[11px] text-[#9ad5b8] truncate flex-1">{link}</span>
                  <button onClick={() => copy(link)} className="flex items-center gap-1 px-2 py-1 rounded-md font-exo text-[11px] font-bold text-white" style={{ background: "#02B36520", color: "#02B365" }} title="Скопировать ссылку">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Копировать
                  </button>
                </div>
                <div className="font-exo text-[10px] text-[#555]">Делитесь ссылкой — промокод применится автоматически на оплате.</div>
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
