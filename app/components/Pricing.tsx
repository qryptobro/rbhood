"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

// Доступ сейчас бесплатный — выдаётся вручную через менеджера в Telegram.
const MANAGER_TG = "https://t.me/rbhoodai_support?text=" + encodeURIComponent("Хочу бесплатный доступ к платформе");

const L = {
  ru: {
    title: "Доступ сейчас бесплатный",
    sub: "Чтобы получить полный доступ к платформе — просто напишите менеджеру.",
    subPaywall: "Ваш доступ ограничен. Напишите менеджеру — откроем полный доступ бесплатно.",
    badge: "[ БЕСПЛАТНО ]", btn: "Написать менеджеру", included: "Что входит:",
  },
  kz: {
    title: "Қазір қолжетімділік тегін",
    sub: "Платформаға толық қолжетімділік алу үшін — менеджерге жазыңыз.",
    subPaywall: "Қолжетімділігіңіз шектеулі. Менеджерге жазыңыз — толық қолжетімділік тегін ашамыз.",
    badge: "[ ТЕГІН ]", btn: "Менеджерге жазу", included: "Не кіреді:",
  },
  en: {
    title: "Access is now free",
    sub: "To get full access to the platform — just message our manager.",
    subPaywall: "Your access is limited. Message our manager — we'll open full access for free.",
    badge: "[ FREE ]", btn: "Message manager", included: "What's included:",
  },
};

export default function Pricing({ paywall = false }: { paywall?: boolean }) {
  const { t, lang } = useI18n();
  const { ref, inView } = useReveal();
  const tt = L[lang] || L.ru;
  const features = [t["plan1_f1"], t["plan1_f2"], t["plan1_f3"], t["plan1_f4"], t["plan1_f5"]].filter(Boolean);

  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden" style={{ background: "#080808" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(2,179,101,0.06) 0%, transparent 65%)" }} />

      <div className="max-w-lg mx-auto relative z-10" ref={ref}>
        <div className="text-center mb-10">
          <SectionLabel text={t["price_label"]} />
          <h2 className="font-orbitron font-bold text-white" style={{ fontSize: "clamp(22px, 3.2vw, 42px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {tt.title}
          </h2>
          <p className="text-[#555] text-base mt-4 font-exo max-w-md mx-auto">{paywall ? tt.subPaywall : tt.sub}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="rounded-2xl p-8 border relative overflow-hidden"
          style={{
            background: "radial-gradient(140% 100% at 50% -10%, rgba(2,179,101,0.1) 0%, #0d0d0d 55%)",
            boxShadow: "0 0 60px rgba(2,179,101,0.08), 0 0 0 1px rgba(2,179,101,0.12)",
            borderColor: "rgba(2,179,101,0.2)",
          }}
        >
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: "linear-gradient(90deg, transparent, #02B365, transparent)" }} />

          <div className="text-center mb-6">
            <span className="font-mono text-[11px] font-bold px-3 py-1 rounded border tracking-widest"
              style={{ color: "#02B365", borderColor: "#02B36540", background: "#02B36510" }}>
              {tt.badge}
            </span>
          </div>

          {/* CTA — написать менеджеру */}
          <a href={MANAGER_TG} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-exo font-semibold text-[15px] text-white transition-all duration-200 mb-8 hover:opacity-90 hover:-translate-y-px"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 20px rgba(2,179,101,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
            {tt.btn}
          </a>

          {/* Что входит */}
          <div className="font-exo text-sm text-[#555] mb-4">{tt.included}</div>
          <ul className="flex flex-col gap-3">
            {features.map((f, j) => (
              <li key={j} className="flex items-start gap-3 text-sm font-exo" style={{ color: "#A1A1AA" }}>
                <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {f}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
