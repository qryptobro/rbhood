"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

const stepIcons = [
  <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 0 1 10 10"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10" strokeOpacity="0.3"/></svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
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
    <section id="how" className="py-24 px-6 relative overflow-hidden"
      style={{ background: "#F5F5F5" }}>
      <div className="max-w-6xl mx-auto" ref={ref}>
        <SectionLabel text={t["how_label"]} dark={false} />
        <h2 className="font-orbitron font-bold mb-4 text-[#0A0A0A]" style={{ fontSize: "clamp(22px, 3.2vw, 42px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
          {t["how_title"]}
        </h2>
        <p className="text-[#777] text-base leading-relaxed mb-14 max-w-md font-exo">{t["how_sub"]}</p>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* connector line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.6%+16px)] right-[calc(16.6%+16px)] h-px"
            style={{ background: "linear-gradient(90deg, #02B365 0%, #02B36530 100%)" }} />

          {steps.map((step, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
              className="bg-white border border-[#E8E8E8] rounded-2xl p-8 relative hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 relative z-10"
                style={{ background: "linear-gradient(135deg,#02B365,#19BB74)", boxShadow: "0 8px 24px #02B36530" }}>
                {step.icon}
              </div>
              <div className="absolute top-5 right-5 font-mono-custom text-5xl font-bold text-[#F0F0F0] leading-none select-none">
                0{i + 1}
              </div>
              <h3 className="font-orbitron font-bold text-sm text-[#0A0A0A] mb-3">{step.title}</h3>
              <p className="text-[#777] text-sm leading-relaxed font-exo">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
