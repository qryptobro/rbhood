"use client";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useI18n, Lang } from "./i18n";

const AVATARS = ["АБ","НС","ДҚ","МӘ","ЗТ"];

export default function Nav() {
  const { t, lang, setLang } = useI18n();
  const langs: Lang[] = ["ru", "kz", "en"];
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(8,8,8,0)", "rgba(8,8,8,0.96)"]);
  const border = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(30,30,30,1)"]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center px-6"
      style={{ backgroundColor: bg, borderBottom: "1px solid", borderColor: border, backdropFilter: "blur(20px)" }}
    >
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0">
          <div style={{ width: 30, height: 26, overflow: "hidden", flexShrink: 0, marginTop: "-4px" }}>
            <img src="/logo.svg" alt="" width={30} height={45} style={{ display: "block" }} />
          </div>
          <span className="font-orbitron font-bold text-[17px] tracking-wider text-white lowercase leading-none" style={{ lineHeight: 1 }}>
            rbhood <span className="text-[#02B365]">ai</span>
          </span>
        </a>

        <div />

        {/* Right */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Language dropdown */}
          <div className="relative" ref={dropRef}>
            <button
              onClick={() => setOpen(v => !v)}
              className="flex items-center gap-2 bg-[#111] border border-[#1e1e1e] rounded-xl px-3 py-2 cursor-pointer hover:border-[#2a2a2a] transition-all duration-200 min-h-[38px]"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <span className="font-mono-custom text-[12px] font-bold text-white uppercase">{lang}</span>
              <motion.svg
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9"/>
              </motion.svg>
            </button>

            <AnimatePresence>
              {open && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full right-0 mt-2 rounded-xl border border-[#1e1e1e] overflow-hidden z-50"
                  style={{ background: "#111", minWidth: 120, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}
                >
                  {langs.map((l) => (
                    <button key={l}
                      onClick={() => { setLang(l); setOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors duration-150 ${
                        lang === l ? "bg-[#02B36515] text-[#02B365]" : "text-[#777] hover:bg-[#161616] hover:text-white"
                      }`}
                    >
                      <span className="font-mono-custom text-[11px] font-bold uppercase">{l}</span>
                      <span className="font-exo text-xs text-[#444]">
                        {l === "ru" ? "Русский" : l === "kz" ? "Қазақша" : "English"}
                      </span>
                      {lang === l && (
                        <svg className="ml-auto" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <a href="/register"
            className="hidden md:inline-flex items-center min-h-[38px] px-5 rounded-xl text-xs font-bold text-white cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-px font-exo tracking-wide"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.3)" }}>
            {t["nav_cta"]}
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
