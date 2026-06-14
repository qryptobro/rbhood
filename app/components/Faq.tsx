"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

export default function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<number | null>(null);

  const items = [
    { q: t.faq1_q, a: t.faq1_a },
    { q: t.faq2_q, a: t.faq2_a },
    { q: t.faq3_q, a: t.faq3_a },
    { q: t.faq4_q, a: t.faq4_a },
    { q: t.faq5_q, a: t.faq5_a },
  ];

  return (
    <section id="faq" className="py-24 px-8 bg-[#F4F4F5]">
      <div className="max-w-6xl mx-auto grid md:grid-cols-5 gap-20 items-start">
        {/* left */}
        <div className="md:col-span-2">
          <SectionLabel text={t.faq_label} dark={false} />
          <h2 className="font-orbitron font-bold text-[#0A0A0A] mb-4" style={{ fontSize: "clamp(22px, 3vw, 38px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {t.faq_title}
          </h2>
          <p className="text-[#6B6B6B] text-sm leading-relaxed mb-8 font-exo">{t.faq_sub}</p>
          <a
            href="mailto:support@rbhood.ai"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm text-white cursor-pointer transition-all duration-150 hover:opacity-90 hover:-translate-y-px font-exo"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 19px #1BF29426" }}
          >
            {t.faq_contact}
          </a>
        </div>

        {/* right */}
        <div className="md:col-span-3 flex flex-col">
          {items.map((item, i) => (
            <div key={i} className="border-b border-[#E5E5E5]">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex justify-between items-center py-5 text-left cursor-pointer group"
                aria-expanded={open === i}
              >
                <span className={`font-semibold text-base font-exo transition-colors duration-150 ${open === i ? "text-[#02B365]" : "text-[#0A0A0A] group-hover:text-[#02B365]"}`}>
                  {item.q}
                </span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors duration-150 ${open === i ? "bg-[#02B365] text-white" : "bg-[#F0F0F0] text-[#6B6B6B]"}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    key="answer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-[#6B6B6B] leading-relaxed pb-5 font-exo">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
