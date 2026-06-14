"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import { useI18n } from "./i18n";

function MockAnalysis() {
  return (
    <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden" style={{ background: "#0d0d0d" }}>
      <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#02B365] animate-pulse" style={{ boxShadow: "0 0 6px #02B365" }} />
          <span className="font-mono-custom text-xs text-[#555] uppercase tracking-widest">rbhood ai · анализ</span>
        </div>
        <span className="font-mono-custom text-[10px] text-[#333]">live</span>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#02B36515] border border-[#02B36525] flex items-center justify-center font-orbitron text-sm font-bold text-[#02B365]">BTC</div>
          <div>
            <div className="font-orbitron text-sm font-bold text-white">Bitcoin</div>
            <div className="font-mono-custom text-xs text-[#444]">NYSE · Крипто</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-orbitron text-lg font-bold text-[#02B365]">BUY</div>
            <div className="font-mono-custom text-xs text-[#02B365]">+4.2%</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[{ l: "AI Score", v: "87/100", c: "white" }, { l: "Тренд", v: "Восход", c: "#02B365" }, { l: "Риск", v: "Низкий", c: "#F59E0B" }].map((item, i) => (
            <div key={i} className="bg-[#111] rounded-xl p-3 text-center border border-[#1a1a1a]">
              <div className="font-mono-custom text-[9px] text-[#444] uppercase mb-1.5">{item.l}</div>
              <div className="font-orbitron text-sm font-bold" style={{ color: item.c }}>{item.v}</div>
            </div>
          ))}
        </div>
        <div className="bg-[#02B36508] border border-[#02B36520] rounded-xl p-4">
          <div className="font-mono-custom text-[10px] text-[#02B365] uppercase tracking-widest mb-2">Рекомендация</div>
          <div className="font-exo text-sm text-[#888] leading-relaxed">Сильный восходящий тренд. Вход в диапазоне $41 200–$41 800. Целевой уровень: $47 000.</div>
        </div>
      </div>
    </div>
  );
}

function MockAdapt() {
  const items = [
    { label: "Стиль торговли", value: "Среднесрочный", pct: 72 },
    { label: "Риск-профиль", value: "Умеренный", pct: 55 },
    { label: "Точность сигналов", value: "88%", pct: 88 },
  ];
  return (
    <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden" style={{ background: "#0d0d0d" }}>
      <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#02B36515] border border-[#02B36525] flex items-center justify-center font-orbitron text-xs font-bold text-[#02B365]">АБ</div>
        <div>
          <div className="font-exo text-sm text-white font-semibold">Айбек Байжанов</div>
          <div className="font-mono-custom text-[10px] text-[#444]">Профиль обновлён · 47 анализов</div>
        </div>
      </div>
      <div className="p-5 flex flex-col gap-4">
        {items.map((item, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1.5">
              <span className="font-exo text-xs text-[#555]">{item.label}</span>
              <span className="font-orbitron text-xs font-bold text-white">{item.value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#111] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${item.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}
              />
            </div>
          </div>
        ))}
        <div className="mt-1 bg-[#111] border border-[#1a1a1a] rounded-xl p-3 flex items-start gap-2.5">
          <span className="text-[#02B365] text-base">✦</span>
          <p className="font-exo text-xs text-[#666] leading-relaxed">ИИ выявил, что ты лучше торгуешь в утренние сессии. Новые сигналы оптимизированы под тебя.</p>
        </div>
      </div>
    </div>
  );
}

function MockConfidence() {
  const scenarios = [
    { label: "Сценарий A — рост", prob: 68, color: "#02B365", target: "+18%" },
    { label: "Сценарий B — боковик", prob: 24, color: "#F59E0B", target: "±3%" },
    { label: "Сценарий C — снижение", prob: 8, color: "#EF4444", target: "-7%" },
  ];
  return (
    <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden" style={{ background: "#0d0d0d" }}>
      <div className="px-5 py-3.5 border-b border-[#1a1a1a]">
        <span className="font-mono-custom text-xs text-[#555] uppercase tracking-widest">Сценарии · NVDA</span>
      </div>
      <div className="p-5 flex flex-col gap-3.5">
        {scenarios.map((s, i) => (
          <div key={i} className="rounded-xl border border-[#1a1a1a] p-4" style={{ background: `${s.color}08` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-exo text-sm text-[#888]">{s.label}</span>
              <div className="flex items-center gap-3">
                <span className="font-orbitron text-sm font-bold" style={{ color: s.color }}>{s.target}</span>
                <span className="font-orbitron text-base font-bold text-white">{s.prob}%</span>
              </div>
            </div>
            <div className="h-1 rounded-full bg-[#111] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${s.prob}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: "easeOut" }}
                className="h-full rounded-full"
                style={{ background: s.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockPortfolio() {
  const assets = [
    { ticker: "BTC", name: "Bitcoin", pct: 38, change: "+4.2%", color: "#02B365" },
    { ticker: "NVDA", name: "NVIDIA", pct: 27, change: "+3.7%", color: "#02B365" },
    { ticker: "AAPL", name: "Apple", pct: 21, change: "+1.1%", color: "#F59E0B" },
    { ticker: "TSLA", name: "Tesla", pct: 14, change: "-2.3%", color: "#EF4444" },
  ];
  return (
    <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden" style={{ background: "#0d0d0d" }}>
      <div className="px-5 py-3.5 border-b border-[#1a1a1a] flex justify-between items-center">
        <span className="font-mono-custom text-xs text-[#555] uppercase tracking-widest">Портфель</span>
        <span className="font-orbitron text-sm font-bold text-[#02B365]">+12.4% этот месяц</span>
      </div>
      <div className="p-5 flex flex-col gap-2.5">
        {assets.map((a, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono-custom text-[10px] font-bold shrink-0"
              style={{ background: `${a.color}15`, color: a.color, border: `1px solid ${a.color}25` }}>
              {a.ticker.slice(0,2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="font-exo text-sm text-white">{a.name}</span>
                <span className="font-mono-custom text-xs" style={{ color: a.color }}>{a.change}</span>
              </div>
              <div className="h-1 rounded-full bg-[#111] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${a.pct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: a.color }}
                />
              </div>
            </div>
            <span className="font-orbitron text-xs text-[#444] shrink-0">{a.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const MOCKS = [<MockAnalysis key="1"/>, <MockAdapt key="2"/>, <MockConfidence key="3"/>, <MockPortfolio key="4"/>];

function Block({ i, titleKey, descKey, bullets }: { i: number; titleKey: string; descKey: string; bullets: string[] }) {
  const { t } = useI18n();
  const { ref, inView } = useReveal();
  const isLight = i % 2 !== 0;
  const reverse = i % 2 !== 0;

  return (
    <section
      className="py-24 px-6"
      style={{ background: isLight ? "#F5F5F5" : "#080808" }}
    >
      <div className="max-w-6xl mx-auto" ref={ref}>
        <div className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? "lg:flex-row-reverse" : ""}`}
          style={{ direction: reverse ? "rtl" : "ltr" }}>
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? 24 : -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ direction: "ltr" }}
          >
            <div className={`inline-block font-mono-custom text-[10px] uppercase tracking-widest px-3 py-1 rounded-full border mb-6 ${
              isLight ? "text-[#02B365] border-[#02B36530] bg-[#02B36508]" : "text-[#02B365] border-[#02B36525] bg-[#02B36510]"
            }`}>
              {t[`fb${i+1}_tag`]}
            </div>
            <h2 className={`font-orbitron font-bold mb-5 ${isLight ? "text-[#0A0A0A]" : "text-white"}`}
              style={{ fontSize: "clamp(22px, 2.8vw, 38px)", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
              {t[`fb${i+1}_title`]}
            </h2>
            <p className={`leading-relaxed mb-8 font-exo ${isLight ? "text-[#666]" : "text-[#555]"}`}
              style={{ fontSize: "clamp(14px, 1.5vw, 17px)" }}>
              {t[`fb${i+1}_desc`]}
            </p>
            <ul className="flex flex-col gap-3">
              {bullets.map((b, bi) => (
                <li key={bi} className={`flex items-start gap-3 font-exo text-sm ${isLight ? "text-[#444]" : "text-[#555]"}`}>
                  <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {b}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Mock UI */}
          <motion.div
            initial={{ opacity: 0, x: reverse ? -24 : 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            style={{ direction: "ltr" }}
          >
            {MOCKS[i]}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default function FeatureBlocks() {
  const { t } = useI18n();

  const blocks = [
    {
      bullets: [t["fb1_b1"], t["fb1_b2"], t["fb1_b3"]],
    },
    {
      bullets: [t["fb2_b1"], t["fb2_b2"], t["fb2_b3"]],
    },
    {
      bullets: [t["fb3_b1"], t["fb3_b2"], t["fb3_b3"]],
    },
    {
      bullets: [t["fb4_b1"], t["fb4_b2"], t["fb4_b3"]],
    },
  ];

  return (
    <>
      {blocks.map((block, i) => (
        <Block
          key={i}
          i={i}
          titleKey={`fb${i+1}_title`}
          descKey={`fb${i+1}_desc`}
          bullets={block.bullets}
        />
      ))}
    </>
  );
}
