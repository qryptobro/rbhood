"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useI18n } from "../../components/i18n";
import { useStore } from "../../../store/useStore";

function useCountdown() {
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const calc = () => {
      const now = new Date();
      const next = new Date();
      next.setHours(24, 0, 0, 0);
      const diff = Math.floor((next.getTime() - now.getTime()) / 1000);
      setTimeLeft({
        h: Math.floor(diff / 3600),
        m: Math.floor((diff % 3600) / 60),
        s: diff % 60,
      });
    };
    calc();
    const id = setInterval(calc, 1000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
}

// Резервный список, пока админ не импортировал реальных трейдеров
const MOCK_TRADERS = [
  { rank: 1,  name: "AlphaTrader_KZ", country: "🇰🇿", volume: "$4,820,000", days: 180 },
  { rank: 2,  name: "BullRunner99",   country: "🇷🇺", volume: "$3,650,000", days: 142 },
  { rank: 3,  name: "SilentProfit",   country: "🇩🇪", volume: "$2,910,000", days: 210 },
  { rank: 4,  name: "CryptoFX_Pro",   country: "🇺🇸", volume: "$2,340,000", days: 98  },
  { rank: 5,  name: "GoldDigger_FX",  country: "🇰🇿", volume: "$1,980,000", days: 165 },
  { rank: 6,  name: "TrendMaster",    country: "🇺🇦", volume: "$1,720,000", days: 87  },
  { rank: 7,  name: "NightScalper",   country: "🇷🇺", volume: "$1,540,000", days: 220 },
  { rank: 8,  name: "ForexWizard",    country: "🇬🇧", volume: "$1,280,000", days: 130 },
  { rank: 9,  name: "AI_Trader_01",   country: "🇰🇿", volume: "$980,000",   days: 75  },
  { rank: 10, name: "PipHunter",      country: "🇹🇷", volume: "$760,000",   days: 195 },
  { rank: 11, name: "ScalpKing",      country: "🇷🇺", volume: "$640,000",   days: 88  },
  { rank: 12, name: "FxNinja_KZ",     country: "🇰🇿", volume: "$590,000",   days: 102 },
  { rank: 13, name: "WaveRider",      country: "🇩🇪", volume: "$520,000",   days: 145 },
  { rank: 14, name: "DeltaForce_FX",  country: "🇺🇸", volume: "$480,000",   days: 67  },
  { rank: 15, name: "TurboScalper",   country: "🇺🇦", volume: "$430,000",   days: 93  },
  { rank: 16, name: "QuantTrader",    country: "🇬🇧", volume: "$390,000",   days: 118 },
  { rank: 17, name: "MoonSignal",     country: "🇰🇿", volume: "$350,000",   days: 54  },
  { rank: 18, name: "IronHands_FX",   country: "🇷🇺", volume: "$310,000",   days: 170 },
  { rank: 19, name: "PrecisionPip",   country: "🇩🇪", volume: "$270,000",   days: 83  },
  { rank: 20, name: "ZenTrader",      country: "🇹🇷", volume: "$240,000",   days: 136 },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return { color: "#FFD700", icon: "🥇" };
  if (rank === 2) return { color: "#C0C0C0", icon: "🥈" };
  if (rank === 3) return { color: "#CD7F32", icon: "🥉" };
  return { color: "#444", icon: `#${rank}` };
};

const PAGE_SIZE = 10;

export default function TradersPage() {
  const { t } = useI18n();
  const { h, m, s } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, "0");
  const [showAll, setShowAll] = useState(false);

  // Реальные трейдеры из админки; если пусто — резервный список
  const stored = useStore(s => s.topTraders);
  const TRADERS = stored.length > 0
    ? stored.map((tr, i) => ({ rank: i + 1, name: tr.name, country: tr.country, volume: tr.volume, days: tr.days }))
    : MOCK_TRADERS;

  const visible = showAll ? TRADERS : TRADERS.slice(0, PAGE_SIZE);
  return (
    <div className="px-4 md:px-8 py-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
        <div>
          <h1 className="font-exo font-bold text-white text-2xl mb-1">{t["td_title"]}</h1>
          <p className="font-exo text-sm text-[#444]">{t["td_sub"]}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#02B365] animate-pulse" />
            <span className="font-mono text-[11px] text-[#02B365]">{t["td_live"]}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#1a1a1a]" style={{ background: "#111" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span className="font-mono text-[11px] text-[#444]">{t["td_update_in"]}</span>
            <div className="flex items-center gap-1">
              {[pad(h), pad(m), pad(s)].map((val, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className="font-orbitron text-xs font-bold text-white bg-[#1a1a1a] py-0.5 rounded-md text-center tabular-nums" style={{ width: 28, display: "inline-block" }}>{val}</span>
                  {i < 2 && <span className="font-mono text-xs text-[#333]">:</span>}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA banner */}
      <div className="rounded-2xl border border-[#02B36530] p-5 mb-6 flex items-center justify-between gap-4 flex-wrap"
        style={{ background: "linear-gradient(135deg, #02B36510 0%, #02B36505 100%)" }}>
        <div>
          <div className="font-exo font-bold text-white text-sm mb-1">
            {t["td_banner_title"]}
          </div>
          <div className="font-exo text-xs text-[#555] max-w-md">
            {t["td_banner_pre"]} <span className="text-[#02B365] font-bold">FxPro</span> {t["td_banner_post"]}
          </div>
        </div>
        <a href="#" target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 h-10 px-6 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 16px rgba(2,179,101,0.3)" }}>
          {t["td_create"]}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        {/* Table header */}
        <div className="grid grid-cols-[26px_1fr_auto] md:grid-cols-[48px_1fr_140px] gap-2 md:gap-3 px-3 md:px-5 py-3 border-b border-[#1a1a1a]"
          style={{ background: "#0d0d0d" }}>
          {["#", t["td_col_trader"], t["td_col_volume"]].map(h => (
            <div key={h} className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{h}</div>
          ))}
        </div>

        {/* Rows */}
        {visible.map((trader, i) => {
          const rs = rankStyle(trader.rank);
          return (
            <motion.div key={trader.rank}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.04 }}
              className="grid grid-cols-[26px_1fr_auto] md:grid-cols-[48px_1fr_140px] gap-2 md:gap-3 px-3 md:px-5 py-3.5 border-b border-[#111] hover:bg-[#141414] transition-colors items-center"
            >
              {/* Rank */}
              <div className="font-orbitron text-sm font-bold" style={{ color: rs.color }}>
                {trader.rank <= 3 ? rs.icon : `#${trader.rank}`}
              </div>

              {/* Name */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-orbitron text-xs font-bold text-white flex-shrink-0"
                  style={{ background: `hsl(${trader.rank * 37}, 50%, 25%)`, border: "1px solid rgba(255,255,255,0.08)" }}>
                  {trader.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="font-exo text-sm font-semibold text-white truncate">{trader.name}</div>
                  <div className="font-mono text-[10px] text-[#333] whitespace-nowrap">{trader.country} · {trader.days} {t["td_days"]}</div>
                </div>
              </div>

              {/* Volume */}
              <div className="font-orbitron text-xs md:text-sm font-bold whitespace-nowrap text-right md:text-left" style={{ color: "#02B365" }}>{trader.volume}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Show more */}
      {!showAll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAll(true)}
          className="w-full mt-1 py-3 rounded-b-2xl font-exo text-sm text-[#444] hover:text-white border border-t-0 border-[#1a1a1a] hover:bg-[#141414] transition-all flex items-center justify-center gap-2"
          style={{ background: "#111" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          {t["td_more"]}
        </motion.button>
      )}
      {showAll && (
        <button
          onClick={() => setShowAll(false)}
          className="w-full mt-1 py-3 rounded-b-2xl font-exo text-sm text-[#444] hover:text-white border border-t-0 border-[#1a1a1a] hover:bg-[#141414] transition-all flex items-center justify-center gap-2"
          style={{ background: "#111" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
          {t["td_collapse"]}
        </button>
      )}

      {/* Bottom CTA */}
      <div className="mt-6 rounded-2xl border border-[#1a1a1a] p-6 flex flex-col items-center text-center gap-4"
        style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-base">{t["td_bottom_title"]}</div>
        <div className="font-exo text-sm text-[#444] max-w-sm">
          {t["td_bottom_pre"]} <span className="text-white font-semibold">FxPro</span> {t["td_bottom_post"]}
        </div>
        <a href="#" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 h-10 px-8 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 16px rgba(2,179,101,0.3)" }}>
          {t["td_create_fxpro"]}
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  );
}
