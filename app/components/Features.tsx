"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

const icons = [
  <svg key="1" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  <svg key="2" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  <svg key="3" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,
  <svg key="4" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  <svg key="5" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.5 9.5c.5-1 1.5-1.5 2.5-1.5 1.7 0 3 1.1 3 2.5 0 1.3-1 2-2 2.5C12 13.5 12 14 12 15"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>,
];

export default function Features() {
  const { t } = useI18n();
  const { ref, inView } = useReveal();

  const cards = [
    { tag: t["feat1_tag"], title: t["feat1_title"], desc: t["feat1_desc"], span: "md:col-span-7", icon: icons[0] },
    { tag: t["feat2_tag"], title: t["feat2_title"], desc: t["feat2_desc"], span: "md:col-span-5", icon: icons[1] },
    { tag: t["feat3_tag"], title: t["feat3_title"], desc: t["feat3_desc"], span: "md:col-span-4", icon: icons[2] },
    { tag: t["feat4_tag"], title: t["feat4_title"], desc: t["feat4_desc"], span: "md:col-span-4", icon: icons[3] },
    { tag: t["feat5_tag"], title: t["feat5_title"], desc: t["feat5_desc"], span: "md:col-span-4", icon: icons[4] },
  ];

  return (
    <section id="features" className="py-24 px-6 relative overflow-hidden"
      style={{ background: "#080808" }}>
      {/* subtle grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      <div className="max-w-6xl mx-auto relative z-10" ref={ref}>
        <SectionLabel text={t["feat_label"]} />
        <h2 className="font-orbitron font-bold mb-4 text-white" style={{ fontSize: "clamp(22px, 3.2vw, 42px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
          {t["feat_title"]}
        </h2>
        <p className="text-[#444] text-base leading-relaxed mb-14 max-w-md font-exo">{t["feat_sub"]}</p>

        <div className="grid md:grid-cols-12 gap-3">
          {cards.map((card, i) => (
            <motion.div key={i} className={`${card.span} col-span-12`}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07, ease: "easeOut" }}
            >
              <div className="h-full rounded-2xl p-7 border border-[#151515] relative overflow-hidden group transition-all duration-300 hover:border-[#02B36525] hover:-translate-y-1 cursor-default"
                style={{ background: "linear-gradient(135deg, rgba(18,18,18,0.9) 0%, rgba(12,12,12,0.9) 100%)", backdropFilter: "blur(8px)" }}>
                {/* animated glow on hover */}
                <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "linear-gradient(90deg, transparent, #02B365, transparent)" }} />
                <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(2,179,101,0.06) 0%, transparent 70%)", transform: "translate(30%, 30%)" }} />

                <span className="inline-block text-[#02B365] font-mono-custom text-[10px] border border-[#02B36520] bg-[#02B3650c] rounded-full px-3 py-1 mb-5 tracking-widest">
                  {card.tag}
                </span>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 border border-[#1e1e1e] group-hover:border-[#02B36530] transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(2,179,101,0.12)]"
                  style={{ background: "linear-gradient(135deg, #161616, #111)" }}>
                  {card.icon}
                </div>
                <h3 className="font-orbitron font-bold text-sm text-white mb-2.5 group-hover:text-[#e8e8e8] transition-colors duration-300" style={{ letterSpacing: "-0.3px" }}>{card.title}</h3>
                <p className="text-[#444] text-sm leading-relaxed font-exo group-hover:text-[#666] transition-colors duration-300">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
