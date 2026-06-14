"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../../components/i18n";

function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const items: { icon: string; label: string; href: string }[] = [
    { icon: "M12 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z", label: "Мой аккаунт", href: "/dashboard/account" },
    { icon: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71", label: "Брокеры", href: "/dashboard/brokers" },
    { icon: "M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c3 3 9 3 12 0v-5", label: "Обучение", href: "/dashboard/training" },
    { icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", label: "Топ Трейдеры", href: "/dashboard/traders" },
  ];

  return (
    <div className="relative border-t border-[#181818]" ref={ref}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-2 right-2 mb-2 rounded-2xl border border-[#1e1e1e] overflow-hidden z-50"
            style={{ background: "#111", boxShadow: "0 -8px 32px rgba(0,0,0,0.6)" }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]">
              <div className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden border border-[#2a2a2a]">
                <img src="https://i.pravatar.cc/36?img=12" alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <div className="font-exo text-sm font-bold text-white truncate">IAMD OFFICIAL</div>
                <div className="font-mono text-[10px] text-[#444] truncate">daukenzhebaev697@gmail.com</div>
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span className="font-exo text-sm text-[#333]">Стать партнёром</span>
            </div>
            {items.map(item => (
              <a key={item.label} href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#161616] transition-colors group"
                onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-white transition-colors">
                  <path d={item.icon}/>
                </svg>
                <span className="font-exo text-sm text-[#888] group-hover:text-white transition-colors">{item.label}</span>
              </a>
            ))}
            <div className="border-t border-[#1a1a1a]">
              <button className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#EF444410] transition-colors group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="group-hover:stroke-[#EF4444] transition-colors">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="font-exo text-sm text-[#888] group-hover:text-[#EF4444] transition-colors">Выйти</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(v => !v)}
        className="w-full px-3 py-3 flex items-center gap-2.5 hover:bg-[#161616] transition-colors">
        <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden border border-[#2a2a2a]">
          <img src="https://i.pravatar.cc/28?img=12" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0 flex-1 text-left">
          <div className="font-exo text-[11px] font-bold text-white truncate">IAMD OFFICIAL</div>
          <div className="font-mono text-[9px] text-[#333] truncate">daukenzhebaev697@gmail.com</div>
        </div>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0">
          <polyline points="6 9 12 15 18 9"/>
        </motion.svg>
      </button>
    </div>
  );
}

interface SidebarProps {
  history: { id: number; ticker: string; signal: "BUY"|"SELL"|"HOLD"; time: string }[];
  onDeleteHistory: (id: number) => void;
}

const sigColor = { BUY: "#02B365", SELL: "#EF4444", HOLD: "#F59E0B" };

export default function Sidebar({ history, onDeleteHistory }: SidebarProps) {
  const { t } = useI18n();

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col border-r border-[#181818] overflow-hidden h-full" style={{ background: "#111" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-[14px] border-b border-[#181818]">
        <div style={{ width: 28, height: 24, overflow: "hidden", flexShrink: 0, marginTop: "-3px" }}>
          <img src="/logo.svg" alt="" width={28} height={42} style={{ display: "block" }} />
        </div>
        <span className="font-orbitron font-bold text-[14px] tracking-wider text-white lowercase leading-none whitespace-nowrap">
          rbhood <span style={{ color: "#02B365" }}>ai</span>
        </span>
      </div>

      {/* New analysis */}
      <div className="px-3 pt-3 pb-2">
        <a href="/dashboard"
          className="w-full flex items-center justify-center gap-2 h-9 rounded-xl font-exo font-bold text-xs text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.25)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          {t["db_new"]}
        </a>
      </div>

      {/* History */}
      <div className="flex-1 overflow-y-auto px-3 pt-1">
        <div className="font-mono text-[10px] text-[#2a2a2a] uppercase tracking-widest mb-2 px-1">{t["db_history"]}</div>
        {history.length === 0 && (
          <div className="font-exo text-[11px] text-[#222] px-1">{t["db_no_history"]}</div>
        )}
        {history.map(h => (
          <div key={h.id} className="flex items-center gap-1 px-2 py-2.5 rounded-lg hover:bg-[#161616] cursor-pointer group transition-colors">
            <div className="flex-1 min-w-0">
              <div className="font-exo text-sm font-semibold text-white group-hover:text-[#02B365] transition-colors mb-0.5 truncate">{h.ticker}</div>
              <div className="flex items-center gap-1.5 text-[#444]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span className="font-exo text-[11px]">just now · {h.time}</span>
              </div>
            </div>
            <button
              onClick={() => onDeleteHistory(h.id)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 hover:bg-[#EF444420] text-[#444] hover:text-[#EF4444] transition-all"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <UserMenu />
    </aside>
  );
}
