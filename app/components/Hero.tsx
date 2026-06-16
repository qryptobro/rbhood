"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { useI18n } from "./i18n";
import { useStore } from "../../store/useStore";

// Аватар: загруженное фото из админки; если нет — инициалы
function BadgeAvatar({ src, ini, bg, z }: { src: string; ini: string; bg: string; z: number }) {
  const [ok, setOk] = useState(true);
  return (
    <div className="w-7 h-7 rounded-full border-2 border-[#111] overflow-hidden flex items-center justify-center font-exo text-[9px] font-bold text-white"
      style={{ background: bg, zIndex: z }}>
      {ok && src
        ? <img src={src} alt="" className="w-full h-full object-cover" onError={() => setOk(false)} />
        : ini}
    </div>
  );
}

export default function Hero() {
  const { t } = useI18n();
  const heroAvatars = useStore(s => s.heroAvatars);
  const defaults = [
    { ini: "АБ", bg: "#0f5132" },
    { ini: "НС", bg: "#157347" },
    { ini: "ДҚ", bg: "#02B365" },
  ];
  const badgeAvatars = defaults.map((d, i) => ({ ...d, src: heroAvatars[i] || "" }));

  return (
    <section className="relative flex flex-col items-center justify-center text-center px-6 pt-32 pb-24 overflow-hidden"
      style={{ background: "#080808" }}>
      {/* grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }} />
      {/* top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(2,179,101,0.5), transparent)" }} />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(2,179,101,0.07) 0%, transparent 65%)" }} />

      <div className="w-full max-w-[900px] mx-auto relative z-10 px-4">
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-3 mb-8 rounded-full border border-[#2a2a2a] px-4 py-2"
          style={{ background: "#111" }}
        >
          <span className="font-mono-custom text-[#444] text-base">[</span>
          <div className="flex -space-x-2">
            {badgeAvatars.map((a, i) => (
              <BadgeAvatar key={i} src={a.src} ini={a.ini} bg={a.bg} z={3 - i} />
            ))}
          </div>
          <span className="font-mono-custom text-xs font-bold text-white uppercase tracking-widest">
            {t["hero_traders"]}
          </span>
          <span className="font-mono-custom text-[#444] text-base">]</span>
        </motion.div>

        {/* headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-orbitron font-bold text-white mb-6"
          style={{ fontSize: "clamp(34px, 5.5vw, 72px)", lineHeight: 1.08, letterSpacing: "-1.5px" }}
        >
          {t["hero_title_1"]}
          <br />
          <span style={{ color: "#02B365", textShadow: "0 0 50px rgba(2,179,101,0.4)" }}>
            {t["hero_title_accent"]}
          </span>{" "}
          {t["hero_title_2"].split("7").map((part, i, arr) => (
            i < arr.length - 1
              ? <span key={i}>{part}<span style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 800 }}>7</span></span>
              : <span key={i}>{part}</span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#666] leading-relaxed mb-5 font-exo mx-auto"
          style={{ fontSize: "clamp(15px, 1.4vw, 18px)", maxWidth: 480 }}
        >
          {t["hero_sub"]}
        </motion.p>

        {/* Trustpilot */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="flex items-center gap-3 px-5 py-2.5 rounded-full border border-[#222]" style={{ background: "#111" }}>
            {/* Stars */}
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="w-5 h-5 flex items-center justify-center rounded-sm" style={{ background: "#00B67A" }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l2.9 8.9H23l-7.4 5.4 2.8 8.7L12 19.6l-6.4 5.4 2.8-8.7L2 11h8.1z"/>
                  </svg>
                </div>
              ))}
            </div>
            <span className="font-exo font-bold text-white text-sm">4.5/5</span>
            <div className="w-px h-4 bg-[#2a2a2a]" />
            <span className="font-exo text-sm text-[#777]">Verified by</span>
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 flex items-center justify-center rounded-sm" style={{ background: "#00B67A" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2l2.9 8.9H23l-7.4 5.4 2.8 8.7L12 19.6l-6.4 5.4 2.8-8.7L2 11h8.1z"/>
                </svg>
              </div>
              <span className="font-exo font-bold text-white text-sm">Trustpilot</span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col items-center gap-3"
        >
          <a href="/register"
            className="inline-flex items-center gap-2.5 px-10 py-4 rounded-2xl font-bold text-white text-base font-exo cursor-pointer transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(90deg,#02B365,#19BB74)",
              boxShadow: "0 4px 30px rgba(2,179,101,0.35), 0 0 0 1px rgba(2,179,101,0.2)",
            }}>
            {t["hero_cta"]}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
          <p className="font-exo text-[#444] text-sm">{t["hero_note"]}</p>
        </motion.div>
      </div>

      {/* Mockup video */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[1200px] mx-auto mt-12 md:mt-20 px-4 md:px-12"
      >
        <div className="rounded-2xl border border-[#1e1e1e] overflow-hidden"
          style={{ background: "#0d0d0d", boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6)" }}>
          <video
            src="/hero-mockup.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto block"
          />
        </div>

        {/* Bottom glow */}
        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-32 pointer-events-none"
          style={{ background: "radial-gradient(ellipse, rgba(2,179,101,0.08) 0%, transparent 70%)" }} />
      </motion.div>

      {/* bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #080808)" }} />
    </section>
  );
}
