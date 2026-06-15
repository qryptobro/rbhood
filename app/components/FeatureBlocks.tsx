"use client";
import { motion } from "framer-motion";
import { useI18n } from "./i18n";

// ─── Мокап 1: чеклист анализа + TP-пилюли ─────────────────────────────────────
function MockChecklist() {
  const items = ["Анализ графика", "Вероятные сценарии", "Fibonacci", "RSI Score"];
  return (
    <div className="absolute inset-0 grid grid-cols-2">
      {/* left checklist */}
      <div className="flex flex-col justify-center gap-4 pl-7">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <span className="font-exo text-[15px] text-[#cfcfcf]">{it}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        ))}
      </div>
      {/* right TP pills */}
      <div className="flex flex-col justify-center gap-3 pr-4 relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 60% 50%, rgba(2,179,101,0.10), transparent 70%)" }} />
        {[176, 356].map((v, i) => (
          <div key={i} className="relative flex items-center gap-2 rounded-2xl border border-[#1f1f1f] px-4 py-3" style={{ background: "#141414" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="font-orbitron font-bold text-white text-base">TP1 : +{v}$</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Мокап 2: профиль-анализ + рекомендация ───────────────────────────────────
function MockProfile() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-6">
      <div className="w-full rounded-xl border border-[#1d1d1d] px-4 py-2.5 flex items-center gap-2" style={{ background: "#121212" }}>
        <span className="font-orbitron text-xs text-[#777]">BTCUSD</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <span className="font-mono-custom text-[10px] text-[#444]">Вчера · 15:05</span>
      </div>
      <div className="inline-flex items-center gap-2.5 rounded-full px-6 py-3" style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 0 28px rgba(2,179,101,0.5)" }}>
        <motion.svg animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.2-8.5"/></motion.svg>
        <span className="font-exo font-bold text-white text-sm">Анализ профиля…</span>
      </div>
      <div className="w-full rounded-xl border border-[#1d1d1d] p-3 flex items-center gap-2.5" style={{ background: "#121212" }}>
        <div className="w-8 h-8 rounded-lg bg-[#02B36515] border border-[#02B36525] flex items-center justify-center text-[#02B365] text-sm">✦</div>
        <div className="flex-1">
          <div className="font-exo text-xs font-bold text-white">Рекомендации</div>
          <div className="font-mono-custom text-[10px] text-[#555]">Профиль: Скальпер</div>
        </div>
        <span className="font-mono-custom text-[10px] text-[#444]">⌕ Scalper</span>
      </div>
    </div>
  );
}

// ─── Мокап 3: WhatsApp-чат ────────────────────────────────────────────────────
function MockChat() {
  return (
    <div className="absolute inset-0 flex flex-col justify-center gap-3 px-6">
      <div className="self-start max-w-[80%] rounded-2xl rounded-bl-md px-4 py-2.5" style={{ background: "#1c1c1c" }}>
        <span className="font-exo text-sm text-[#e0e0e0]">Отлично, не буду сомневаться! 🙌</span>
      </div>
      <div className="self-end flex items-end gap-2 max-w-[85%]">
        <div className="rounded-2xl rounded-br-md px-4 py-2.5" style={{ background: "#1c1c1c" }}>
          <span className="font-exo text-sm text-[#e0e0e0]">В какие дни и время ты свободен?</span>
        </div>
        <img src="https://i.pravatar.cc/40?img=12" alt="" className="w-8 h-8 rounded-full border border-[#2a2a2a]" />
      </div>
    </div>
  );
}

// ─── Мокап 4: график уверенности + уровни ─────────────────────────────────────
function MockConfidence() {
  return (
    <div className="absolute inset-0 grid grid-cols-[1.4fr_1fr]">
      {/* chart */}
      <div className="relative">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 220 180" preserveAspectRatio="none">
          <defs>
            <linearGradient id="fbgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#02B365" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#02B365" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d="M0,140 L70,60 L120,95 L220,40 L220,180 L0,180 Z" fill="url(#fbgrad)" />
          <path d="M0,140 L70,60 L120,95 L220,40" fill="none" stroke="#02B365" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute left-[24%] top-[22%] flex items-center gap-1 rounded-xl border border-[#1f1f1f] px-2.5 py-1" style={{ background: "#141414" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="font-orbitron text-xs font-bold text-white">+257$</span>
        </div>
        <div className="absolute left-[52%] top-[52%] flex items-center gap-1 rounded-xl border border-[#1f1f1f] px-2.5 py-1" style={{ background: "#141414" }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
          <span className="font-orbitron text-xs font-bold text-white">+115$</span>
        </div>
      </div>
      {/* levels */}
      <div className="flex flex-col justify-center gap-2.5 pr-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[#1d1d1d] px-3 py-2" style={{ background: "#121212" }}>
            <div className="font-orbitron text-base font-bold text-white">4228</div>
            <div className="font-mono-custom text-[9px] text-[#555]">Стоп-лосс</div>
          </div>
          <div className="rounded-xl border border-[#1d1d1d] px-3 py-2" style={{ background: "#121212" }}>
            <div className="font-orbitron text-base font-bold text-white">4250</div>
            <div className="font-mono-custom text-[9px] text-[#555]">Тейк-профит</div>
          </div>
        </div>
        {["Объяснение", "Технический анализ"].map((r, i) => (
          <div key={i} className="rounded-xl border border-[#1d1d1d] px-3 py-2 flex items-center gap-2" style={{ background: "#121212" }}>
            <div className="w-5 h-5 rounded-md bg-[#02B36515] flex items-center justify-center text-[#02B365] text-[10px]">+</div>
            <span className="font-exo text-[11px] text-[#888]">{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKS = [<MockChecklist key="1" />, <MockProfile key="2" />, <MockChat key="3" />, <MockConfidence key="4" />];

function FeatureCard({ i }: { i: number }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: (i % 2) * 0.1 }}
      className="relative rounded-3xl border border-[#1a1a1a] overflow-hidden h-[420px]"
      style={{ background: "#0c0c0c" }}
    >
      {/* мокап сверху */}
      <div className="absolute inset-0 bottom-[140px]">
        {MOCKS[i]}
      </div>
      {/* текст снизу с градиентом */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-20"
        style={{ background: "linear-gradient(to top, #0c0c0c 55%, transparent)" }}>
        <h3 className="font-exo font-bold text-white text-lg mb-1.5 leading-snug">{t[`fb${i + 1}_title`]}</h3>
        <p className="font-exo text-sm text-[#777] leading-relaxed">{t[`fb${i + 1}_desc`]}</p>
      </div>
    </motion.div>
  );
}

export default function FeatureBlocks() {
  const { t } = useI18n();
  return (
    <section className="py-24 px-6" style={{ background: "#080808" }}>
      <div className="max-w-6xl mx-auto">
        {/* header */}
        <div className="text-center mb-14">
          <div className="inline-block font-mono-custom text-[10px] uppercase tracking-widest text-[#02B365] mb-4">
            [ {t["fb_sec_tag"]} ]
          </div>
          <h2 className="font-orbitron font-bold text-white mx-auto mb-4"
            style={{ fontSize: "clamp(26px, 3.4vw, 44px)", letterSpacing: "-0.5px", lineHeight: 1.2, maxWidth: 640 }}>
            {t["fb_sec_title"]}
          </h2>
          <p className="font-exo text-[#666] mx-auto" style={{ fontSize: "clamp(14px, 1.4vw, 17px)", maxWidth: 480 }}>
            {t["fb_sec_sub"]}
          </p>
        </div>

        {/* 2×2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1, 2, 3].map(i => <FeatureCard key={i} i={i} />)}
        </div>
      </div>
    </section>
  );
}
