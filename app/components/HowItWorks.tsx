"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import { useI18n } from "./i18n";

const stepIcons = [
  <svg key="1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  <svg key="2" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  <svg key="3" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>,
];

export default function HowItWorks() {
  const { t } = useI18n();
  const { ref, inView } = useReveal();

  const steps = [
    { title: t["step1_title"], desc: t["step1_desc"], icon: stepIcons[0] },
    { title: t["step2_title"], desc: t["step2_desc"], icon: stepIcons[1] },
    { title: t["step3_title"], desc: t["step3_desc"], icon: stepIcons[2] },
  ];

  return (
    <section id="how" className="py-24 px-6 relative overflow-hidden" style={{ background: "#F5F5F5" }}>
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* header */}
        <div className="text-center mb-8">
          <div className="inline-block font-mono-custom text-[10px] uppercase tracking-widest text-[#02B365] mb-4">
            [ {t["how_label"]} ]
          </div>
          <h2 className="font-orbitron font-bold text-[#0A0A0A] mx-auto mb-4"
            style={{ fontSize: "clamp(26px, 3.4vw, 44px)", letterSpacing: "-0.5px", lineHeight: 1.15, maxWidth: 620 }}>
            {t["how_title"]}
          </h2>
          <p className="text-[#777] font-exo mx-auto" style={{ fontSize: "clamp(14px, 1.4vw, 17px)", maxWidth: 460 }}>
            {t["how_sub"]}
          </p>
        </div>

        {/* CTA */}
        <div className="flex justify-center mb-12">
          <a href="#pricing"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-bold text-white text-sm font-exo transition-all hover:opacity-90 hover:-translate-y-0.5"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 24px rgba(2,179,101,0.35)" }}>
            {t["nav_cta"]}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>

        {/* mockup with colorful glow */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative max-w-[1000px] mx-auto mb-16"
        >
          {/* цветное свечение по краям (как у BullGPT) */}
          <div className="absolute -inset-3 rounded-[28px] blur-2xl opacity-50 pointer-events-none"
            style={{ background: "linear-gradient(105deg, #FF6B35 0%, #F59E0B 22%, #02B365 50%, #6366F1 75%, #A855F7 100%)" }} />
          <div className="relative rounded-2xl border border-[#1e1e1e] overflow-hidden"
            style={{ background: "#0d0d0d", boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 40px 80px rgba(0,0,0,0.6)" }}>
            <video src="/hero-mockup.mp4" autoPlay loop muted playsInline className="w-full h-auto block" />
          </div>
        </motion.div>

        {/* 3 steps */}
        <div className="grid md:grid-cols-3 gap-8 md:gap-10 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.12, ease: "easeOut" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border border-[#02B36530]"
                style={{ background: "#02B36512" }}>
                {step.icon}
              </div>
              <h3 className="font-exo font-bold text-[#0A0A0A] text-base mb-2">{i + 1}. {step.title}</h3>
              <p className="text-[#777] text-sm leading-relaxed font-exo">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
