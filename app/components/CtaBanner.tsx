"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

export default function CtaBanner() {
  const { t } = useI18n();
  const { ref, inView } = useReveal();

  return (
    <section className="py-28 px-6 relative overflow-hidden text-center"
      style={{ background: "#0A0A0A" }}>
      {/* grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: "linear-gradient(#ffffff04 1px, transparent 1px), linear-gradient(90deg, #ffffff04 1px, transparent 1px)",
        backgroundSize: "60px 60px",
      }} />
      {/* glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[300px] rounded-full"
          style={{ background: "radial-gradient(ellipse, #02B36512 0%, transparent 70%)" }} />
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px"
        style={{ background: "linear-gradient(90deg, transparent, #02B36540, transparent)" }} />

      <div className="max-w-3xl mx-auto relative z-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="flex justify-center mb-6">
            <SectionLabel text={t["cta_label"]} />
          </div>
          <h2 className="font-orbitron font-bold text-white mb-5"
            style={{ fontSize: "clamp(24px, 4vw, 52px)", letterSpacing: "-0.5px", lineHeight: 1.15, textShadow: "0 0 60px rgba(2,179,101,0.2)" }}>
            {t["cta_title"]}
          </h2>
          <p className="text-[#555] text-base leading-relaxed mb-10 font-exo max-w-md mx-auto">{t["cta_sub"]}</p>
          <div className="p-1 rounded-2xl inline-block" style={{ background: "#02B3651A" }}>
            <a href="#pricing"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl font-bold text-base text-white cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 font-exo"
              style={{
                background: "linear-gradient(90deg,#02B365,#19BB74)",
                boxShadow: "0 4px 20px #1BF29426, 0 8px 40px #02B36520, inset 0 0 4px 0.25px #FFFFFF26, inset 0 1px 0 #FFFFFF40",
              }}>
              {t["cta_btn"]}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
