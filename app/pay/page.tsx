"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Должно совпадать с PLAN_PRICES на бэкенде (тенге)
const PLANS: Record<string, { key: "MONTHLY" | "LIFETIME"; name: string; amount: number; period: string }> = {
  monthly: { key: "MONTHLY", name: "Monthly", amount: 19990, period: "в месяц" },
  lifetime: { key: "LIFETIME", name: "Lifetime", amount: 89990, period: "единоразово" },
};

const fmtKzt = (n: number) => n.toLocaleString("ru-RU") + " ₸";

function Checkout() {
  const router = useRouter();
  const params = useSearchParams();
  const planParam = (params.get("plan") || "monthly").toLowerCase();
  const plan = PLANS[planParam] || PLANS.monthly;

  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<"form" | "waiting" | "paid">("form");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Только для залогиненных
  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) { router.replace("/login"); return; }
  }, [router]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const startPolling = (id: number | string) => {
    const token = localStorage.getItem("rbhood-token");
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const r = await fetch(`${API}/api/payments/${id}/status?plan=${plan.key}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await r.json();
        if (d.status === "paid") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStage("paid");
          // обновим кэш юзера и уведём в дашборд
          try {
            const u = JSON.parse(localStorage.getItem("rbhood-user") || "{}");
            u.plan = plan.key;
            localStorage.setItem("rbhood-user", JSON.stringify(u));
          } catch { /* ignore */ }
          setTimeout(() => router.replace("/dashboard"), 1400);
        } else if (["cancelled", "expired", "error"].includes(d.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStage("form");
          setError("Платёж отменён или истёк. Попробуйте ещё раз.");
        }
      } catch { /* сеть — продолжаем опрос */ }
      if (tries > 60) { if (pollRef.current) clearInterval(pollRef.current); } // ~3 мин
    }, 3000);
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) { setError("Введите номер телефона Kaspi"); return; }
    setError(""); setLoading(true);
    try {
      const token = localStorage.getItem("rbhood-token");
      const r = await fetch(`${API}/api/payments/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: plan.key, phone }),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.error || "Не удалось создать счёт"); return; }
      setStage("waiting");
      startPolling(d.id);
    } catch {
      setError("Платёжный сервис недоступен. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Exo 2', sans-serif" }}>
      {/* Header */}
      <div className="max-w-[520px] mx-auto px-5 h-14 flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-[#888] hover:text-white transition-colors text-sm font-exo">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Назад
        </button>
        <div className="flex items-center gap-1.5 text-[#666] text-xs font-exo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Защищённая оплата
        </div>
      </div>

      <div className="max-w-[520px] mx-auto px-5 pb-16">
        <div className="rounded-2xl border border-[#1a1a1a] p-6 md:p-7" style={{ background: "#0d0d0d" }}>

          {stage === "paid" ? (
            <div className="py-10 text-center">
              <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "#02B36518", border: "1px solid #02B36540" }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 className="font-orbitron font-bold text-white text-xl mb-2">Оплата прошла</h2>
              <p className="font-exo text-sm text-[#666]">Открываем дашборд…</p>
            </div>
          ) : (
          <form onSubmit={pay}>
            {/* Payment method */}
            <div className="font-exo font-semibold text-sm text-white mb-2.5">Способ оплаты</div>
            <div className="rounded-xl border border-[#02B36540] overflow-hidden mb-4" style={{ background: "#0a1410" }}>
              <div className="flex items-center gap-3 px-4 h-14 border-b border-[#15241c]">
                <span className="w-4 h-4 rounded-full border-2 border-[#02B365] flex items-center justify-center flex-shrink-0">
                  <span className="w-2 h-2 rounded-full bg-[#02B365]" />
                </span>
                <img src="/kaspi.svg" alt="Kaspi.kz" className="h-5 w-auto" />
                <span className="font-exo text-sm text-[#999]">Оплата через приложение Kaspi.kz</span>
              </div>
              <div className="p-4">
                <label className="font-exo text-xs text-[#888] block mb-1.5">Введите свой номер для удалённой оплаты</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+7 (___) ___-__-__" inputMode="tel"
                  disabled={stage === "waiting"}
                  className="w-full h-12 px-3.5 rounded-lg border border-[#1e1e1e] bg-[#0d0d0d] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#444] disabled:opacity-60" />

                {/* Доступные виды оплаты Kaspi — выбираются в приложении */}
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {["Оплата", "Рассрочка 0%", "Kaspi Red"].map((m) => (
                    <span key={m} className="font-exo text-[11px] text-[#9ad5b8] px-2.5 py-1 rounded-full" style={{ background: "#02B3650d", border: "1px solid #02B36530" }}>{m}</span>
                  ))}
                </div>
                <p className="font-exo text-[11px] text-[#666] mt-2">Способ (оплата, рассрочка или Kaspi Red) вы выбираете в приложении Kaspi после получения счёта.</p>

                {stage === "waiting" && (
                  <div className="mt-3 flex items-start gap-2.5 rounded-lg px-3 py-2.5" style={{ background: "#02B3650d", border: "1px solid #02B36525" }}>
                    <svg className="animate-spin flex-shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    <span className="font-exo text-xs text-[#9ad5b8] leading-relaxed">Счёт отправлен в приложение <b className="text-white">Kaspi.kz</b> на номер {phone}. Откройте уведомление и подтвердите платёж — страница обновится сама.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Promo (декоративно, как на образце) */}
            <button type="button" className="w-full text-left rounded-xl border border-[#1a1a1a] bg-[#111] px-4 h-11 font-exo text-sm text-[#888] hover:text-white hover:border-[#262626] transition-colors mb-6">
              + Промокод
            </button>

            {/* Summary */}
            <div className="border-t border-[#1a1a1a] pt-5 mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="font-exo text-sm text-[#888]">{plan.name} · {plan.period}</span>
                <span className="font-exo text-sm text-white">{fmtKzt(plan.amount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-exo font-semibold text-white">К оплате сегодня</span>
                <span className="font-orbitron font-bold text-white text-lg">{fmtKzt(plan.amount)}</span>
              </div>
            </div>

            {error && (
              <div className="font-exo text-xs text-[#EF4444] bg-[#EF444410] border border-[#EF444425] rounded-lg px-3 py-2 mb-4">{error}</div>
            )}

            <button type="submit" disabled={loading || stage === "waiting"}
              className="w-full h-12 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0"
              style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 20px rgba(2,179,101,0.3)" }}>
              {stage === "waiting" ? "Ожидаем подтверждение…" : loading ? "…" : `Оплатить ${fmtKzt(plan.amount)}`}
            </button>

            <p className="text-center font-exo text-[11px] text-[#555] mt-4">
              Нажимая «Оплатить», вы соглашаетесь с условиями. Платёж обрабатывается через Kaspi.kz.
            </p>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={null}>
      <Checkout />
    </Suspense>
  );
}
