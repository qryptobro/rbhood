"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../components/i18n";
import { ASSET_ICONS } from "./components/AssetIcons";
import { useStore } from "../../store/useStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Signal = "BUY" | "SELL" | "HOLD";
type Tab = "forex" | "crypto" | "stocks";

interface Asset {
  symbol: string;
  name: string;
  price: string;
  change: string;
  up: boolean;
}

interface AnalysisResult {
  ticker: string;
  signal: Signal;
  score: number;
  price: string;
  change: string;
  changePositive: boolean;
  summary: string;
  targets: { label: string; price: string; color: string }[];
  scenarios: { label: string; prob: number; color: string }[];
  indicators: { name: string; value: string; status: "bull" | "bear" | "neutral" }[];
}

// ─── Assets data ──────────────────────────────────────────────────────────────
function rndChange(): { change: string; up: boolean } {
  const v = (Math.random() * 6 - 2).toFixed(2);
  const up = parseFloat(v) >= 0;
  return { change: `${up ? "+" : ""}${v}%`, up };
}

function rndPrice(base: number, decimals: number): string {
  const jitter = base * (1 + (Math.random() * 0.04 - 0.02));
  return jitter.toFixed(decimals);
}

const BASE_ASSETS: Record<Tab, Omit<Asset, "price" | "change" | "up">[]> = {
  forex: [
    { symbol: "XAUUSD", name: "Gold / Dollar"    },
    { symbol: "XAGUSD", name: "Silver / Dollar"  },
    { symbol: "EURUSD", name: "Euro / Dollar"    },
    { symbol: "GBPUSD", name: "Pound / Dollar"   },
    { symbol: "AUDJPY", name: "Aussie / Yen"     },
    { symbol: "USDJPY", name: "Dollar / Yen"     },
    { symbol: "AUDUSD", name: "Aussie / Dollar"  },
    { symbol: "USDCHF", name: "Dollar / Franc"   },
    { symbol: "NZDUSD", name: "Kiwi / Dollar"    },
    { symbol: "USDCAD", name: "Dollar / Loonie"  },
  ],
  crypto: [
    { symbol: "BTCUSDT",  name: "Bitcoin"    },
    { symbol: "ETHUSDT",  name: "Ethereum"   },
    { symbol: "SOLUSDT",  name: "Solana"     },
    { symbol: "BNBUSDT",  name: "BNB"        },
    { symbol: "XRPUSDT",  name: "Ripple"     },
    { symbol: "ADAUSDT",  name: "Cardano"    },
    { symbol: "DOGEUSDT", name: "Dogecoin"   },
    { symbol: "AVAXUSDT", name: "Avalanche"  },
    { symbol: "DOTUSDT",  name: "Polkadot"   },
    { symbol: "LINKUSDT", name: "Chainlink"  },
  ],
  stocks: [
    { symbol: "AAPL",  name: "Apple Inc."      },
    { symbol: "TSLA",  name: "Tesla Inc."      },
    { symbol: "NVDA",  name: "NVIDIA Corp."    },
    { symbol: "MSFT",  name: "Microsoft Corp." },
    { symbol: "GOOGL", name: "Alphabet Inc."   },
    { symbol: "AMZN",  name: "Amazon.com Inc." },
    { symbol: "META",  name: "Meta Platforms"  },
    { symbol: "NFLX",  name: "Netflix Inc."    },
    { symbol: "AMD",   name: "AMD Inc."        },
    { symbol: "SPY",   name: "S&P 500 ETF"     },
  ],
};

const FOREX_BASES:  number[] = [2341, 29.8,  1.084, 1.271, 98.4,  157.3, 0.655, 0.892, 0.601, 1.364];
const FOREX_DEC:   number[] = [2,    2,     4,     4,     2,     2,     4,     4,     4,     4    ];
const CRYPTO_BASES: number[] = [67800, 3240, 182,   604,   0.531, 0.442, 0.158, 37.8,  7.64,  14.2  ];
const CRYPTO_DEC:  number[] = [0,    0,     2,     2,     4,     4,     4,     2,     3,     2    ];
const STOCK_BASES:  number[] = [189,   177,   924,   415,   178,   198,   527,   648,   162,   538   ];
const STOCK_DEC:   number[] = [2,    2,     2,     2,     2,     2,     2,     2,     2,     2    ];

function buildAssets(): Record<Tab, Asset[]> {
  const make = (
    bases: number[], decimals: number[],
    items: Omit<Asset, "price" | "change" | "up">[]
  ): Asset[] => items.map((a, i) => ({ ...a, price: rndPrice(bases[i], decimals[i]), ...rndChange() }));

  return {
    forex:  make(FOREX_BASES,  FOREX_DEC,  BASE_ASSETS.forex),
    crypto: make(CRYPTO_BASES, CRYPTO_DEC, BASE_ASSETS.crypto),
    stocks: make(STOCK_BASES,  STOCK_DEC,  BASE_ASSETS.stocks),
  };
}

// ─── Market hours ─────────────────────────────────────────────────────────────
function isMarketOpen(tab: Tab): boolean {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 6=Sat
  const hour = now.getUTCHours();
  const min = now.getUTCMinutes();
  const timeMin = hour * 60 + min;

  if (tab === "crypto") return true; // 24/7

  if (tab === "forex") {
    // Forex: Mon 00:00 UTC – Fri 21:00 UTC (approx)
    if (day === 0) return false; // Sunday closed
    if (day === 6) return false; // Saturday closed
    if (day === 5 && timeMin >= 21 * 60) return false; // Friday after 21:00 UTC
    return true;
  }

  if (tab === "stocks") {
    // NYSE/NASDAQ: Mon–Fri 14:30–21:00 UTC
    if (day === 0 || day === 6) return false;
    return timeMin >= 14 * 60 + 30 && timeMin < 21 * 60;
  }

  return false;
}

// ─── Mock analysis ────────────────────────────────────────────────────────────
function generateAnalysis(asset: Asset, t: Record<string, string>): AnalysisResult {
  const s: Signal[] = ["BUY", "SELL", "HOLD"];
  const signal = s[asset.symbol.charCodeAt(0) % 3];
  const score = 58 + (asset.symbol.charCodeAt(0) % 35);
  const p = parseFloat(asset.price.replace(/,/g, ""));
  return {
    ticker: asset.symbol,
    signal,
    score,
    price: asset.price,
    change: asset.change,
    changePositive: asset.up,
    summary:
      signal === "BUY"
        ? `${asset.symbol} demonstrates strong upward momentum. RSI at 58 — room to grow. MACD crossed signal line upward. Support level held at key zone.`
        : signal === "SELL"
        ? `${asset.symbol} is forming a bearish pattern. Support breakdown confirmed by volume. Stochastic in overbought zone. Recommend taking profit.`
        : `${asset.symbol} is trading in consolidation. No clear trend — wait for range breakout. Volumes reduced. Recommend observing.`,
    targets: [
      { label: t["db_entry"],   price: asset.price,            color: "#A1A1AA" },
      { label: t["db_target1"], price: (p * 1.05).toFixed(2),  color: "#02B365" },
      { label: t["db_target2"], price: (p * 1.10).toFixed(2),  color: "#02B365" },
      { label: t["db_stop"],    price: (p * 0.97).toFixed(2),  color: "#EF4444" },
    ],
    scenarios: [
      { label: t["db_bull"],    prob: signal === "BUY"  ? 65 : 20, color: "#02B365" },
      { label: t["db_neutral"], prob: signal === "HOLD" ? 55 : 20, color: "#F59E0B" },
      { label: t["db_bear"],    prob: signal === "SELL" ? 65 : 15, color: "#EF4444" },
    ],
    indicators: [
      { name: "RSI (14)",   value: signal === "BUY" ? "58.4" : "71.2",                status: signal === "SELL" ? "bear" : "bull" },
      { name: "MACD",       value: signal === "BUY" ? "+124" : "-89",                 status: signal === "BUY"  ? "bull" : "bear" },
      { name: "MA 50/200",  value: signal === "BUY" ? "Golden Cross" : "Death Cross", status: signal === "BUY"  ? "bull" : "bear" },
      { name: "Volume",     value: "Above avg",                                        status: "bull" },
      { name: "Bollinger",  value: signal === "BUY" ? "Near lower band" : "Near upper", status: signal === "BUY" ? "bull" : "bear" },
      { name: "Stochastic", value: signal === "SELL" ? "82 / 78" : "42 / 38",         status: signal === "SELL" ? "bear" : "neutral" },
    ],
  };
}

// ─── Signal badge ─────────────────────────────────────────────────────────────
function SignalBadge({ signal, large }: { signal: Signal; large?: boolean }) {
  const c: Record<Signal, { bg: string; text: string }> = {
    BUY:  { bg: "#02B36520", text: "#02B365" },
    SELL: { bg: "#EF444420", text: "#EF4444" },
    HOLD: { bg: "#F59E0B20", text: "#F59E0B" },
  };
  return (
    <span className={`font-orbitron font-bold inline-flex items-center justify-center rounded-xl border ${large ? "px-5 py-1.5 text-xl" : "px-2.5 py-0.5 text-[10px]"}`}
      style={{ background: c[signal].bg, color: c[signal].text, borderColor: c[signal].text + "40" }}>
      {signal}
    </span>
  );
}

// ─── Scanning loader ──────────────────────────────────────────────────────────
function ScanningLoader({ ticker }: { ticker: string }) {
  const [step, setStep] = useState(0);
  const steps = ["Загрузка данных...", "Анализ индикаторов...", "Поиск паттернов...", "Оценка риска...", "Генерация сигнала..."];
  useEffect(() => {
    const id = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 600);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="relative">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
          className="w-14 h-14 rounded-full border-2 border-transparent"
          style={{ borderTopColor: "#02B365", borderRightColor: "#02B36530" }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-orbitron text-[9px] font-bold text-[#02B365]">{ticker.slice(0, 6)}</span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 font-mono text-xs"
            style={{ color: i < step ? "#02B365" : i === step ? "#fff" : "#2a2a2a" }}>
            {i < step
              ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              : i === step
              ? <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="w-2.5 h-2.5 rounded-full bg-[#02B365]" />
              : <div className="w-2.5 h-2.5 rounded-full border border-[#222]" />}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { t } = useI18n();
  const { tools } = useStore();
  const [tab, setTab] = useState<Tab>("forex");
  const [selected, setSelected] = useState<Asset | null>(null);
  const [ASSETS, setASSETS] = useState<Record<Tab, Asset[]> | null>(null);
  useEffect(() => { setASSETS(buildAssets()); }, []);

  // Фильтруем активы по активным инструментам из store
  const TAB_MAP: Record<Tab, string> = { forex: "Форекс", crypto: "Крипто", stocks: "Акции" };
  const activeSymbols = useMemo(() =>
    new Set(tools.filter(t => t.active).map(t => t.symbol)),
    [tools]
  );
  const filteredAssets = useMemo(() => {
    if (!ASSETS) return null;
    return {
      forex:  ASSETS.forex.filter(a => activeSymbols.has(a.symbol)),
      crypto: ASSETS.crypto.filter(a => activeSymbols.has(a.symbol)),
      stocks: ASSETS.stocks.filter(a => activeSymbols.has(a.symbol)),
    };
  }, [ASSETS, activeSymbols]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const TAB_LABELS: Record<Tab, string> = {
    forex: t["db_tab_forex"],
    crypto: t["db_tab_crypto"],
    stocks: t["db_tab_stocks"],
  };

  const analyze = (asset: Asset) => {
    setSelected(asset);
    setScanning(true);
    setResult(null);
    setTimeout(() => {
      setResult(generateAnalysis(asset, t));
      setScanning(false);
    }, 3200);
  };

  return (
    <AnimatePresence mode="wait">
      {/* Asset picker */}
      {!selected && !scanning && (
        <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -8 }}
          className="flex flex-col items-center px-6 pt-14 pb-10">
          <h1 className="font-exo font-bold text-white text-2xl mb-1.5">{t["db_title"]}</h1>
          <p className="font-exo text-sm text-[#444] mb-8">{t["db_sub"]}</p>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-2xl border border-[#1a1a1a] mb-6" style={{ background: "#111" }}>
            {(["forex", "crypto", "stocks"] as Tab[]).map(tabKey => (
              <button key={tabKey} onClick={() => setTab(tabKey)}
                className="relative px-6 py-2 rounded-xl font-exo font-bold text-sm transition-all duration-200"
                style={{ color: tab === tabKey ? "#fff" : "#444" }}>
                {tab === tabKey && (
                  <motion.div layoutId="tab-bg" className="absolute inset-0 rounded-xl"
                    style={{ background: "#02B365" }} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{TAB_LABELS[tabKey]}</span>
              </button>
            ))}
          </div>

          {/* Instruments header */}
          <div className="w-full max-w-2xl flex items-center justify-between mb-2">
            <span className="font-mono text-[11px] text-[#333] uppercase tracking-widest">Инструменты</span>
            <span className="font-mono text-[11px] text-[#333]">{filteredAssets ? filteredAssets[tab].length : 0}</span>
          </div>

          {/* Asset grid */}
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
            className="w-full max-w-2xl grid grid-cols-2 gap-3">
            {(filteredAssets ? filteredAssets[tab] : []).map(asset => {
              const open = isMarketOpen(tab);
              const toolIcon = tools.find(t => t.symbol === asset.symbol)?.icon;
              return (
              <button key={asset.symbol}
                onClick={() => open && analyze(asset)}
                disabled={!open}
                className={`flex flex-col p-4 rounded-2xl border text-left transition-all duration-150 group ${open ? "border-[#1e1e1e] hover:border-[#02B36540] cursor-pointer" : "border-[#161616] cursor-not-allowed opacity-60"}`}
                style={{ background: "#161616" }}>
                {/* Top row: icon + change badge */}
                <div className="flex items-center justify-between mb-4">
                  {toolIcon ? (
                    <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center rounded-full overflow-hidden" style={{ background: "#1f1f1f" }}>
                      <img src={toolIcon} alt={asset.symbol} className="w-full h-full object-contain" />
                    </div>
                  ) : ASSET_ICONS[asset.symbol] ? (
                    <div className="w-11 h-11 flex-shrink-0 flex items-center justify-center">
                      {ASSET_ICONS[asset.symbol]}
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-orbitron font-bold text-[11px] text-white border border-[#2a2a2a]"
                      style={{ background: "#1f1f1f" }}>
                      {asset.symbol.slice(0, 3)}
                    </div>
                  )}
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg"
                    style={{ color: asset.up ? "#02B365" : "#EF4444", background: asset.up ? "#02B36515" : "#EF444415" }}>
                    {asset.change}
                  </span>
                </div>

                {/* Symbol + name */}
                <div className="mb-4">
                  <div className="font-orbitron text-base font-bold text-white group-hover:text-[#02B365] transition-colors">{asset.symbol}</div>
                  <div className="font-exo text-xs text-[#444] mt-0.5">{asset.name}</div>
                </div>

                {/* Bottom: market status */}
                <div className="border-t border-[#222] pt-3 flex items-center gap-1.5">
                  {open ? (
                    <>
                      <div className="w-1.5 h-1.5 rounded-full bg-[#02B365]" />
                      <span className="font-exo text-xs text-[#555]">Нажмите, чтобы открыть</span>
                    </>
                  ) : (
                    <>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.8" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      <span className="font-exo text-xs text-[#444]">Рынок закрыт</span>
                    </>
                  )}
                </div>
              </button>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* Scanning */}
      {scanning && selected && (
        <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <ScanningLoader ticker={selected.symbol} />
        </motion.div>
      )}

      {/* Result */}
      {!scanning && result && selected && (
        <motion.div key={result.ticker} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} className="px-6 py-8 max-w-3xl mx-auto">

          <div className="rounded-2xl border border-[#1a1a1a] p-6 mb-4" style={{ background: "#111" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-orbitron text-xl font-bold text-white">{result.ticker}</span>
                  <SignalBadge signal={result.signal} large />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg text-white">{result.price}</span>
                  <span className="font-mono text-sm font-bold" style={{ color: result.changePositive ? "#02B365" : "#EF4444" }}>{result.change}</span>
                </div>
                <div className="font-exo text-xs text-[#333] mt-0.5">{selected.name}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest">{t["db_score"]}</div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.9, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: result.score >= 70 ? "#02B365" : result.score >= 50 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <span className="font-orbitron text-base font-bold text-white">{result.score}/100</span>
                </div>
              </div>
            </div>
            <div className="border-t border-[#161616] pt-4">
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-1.5">{t["db_summary"]}</div>
              <p className="font-exo text-sm text-[#666] leading-relaxed">{result.summary}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">{t["db_levels"]}</div>
              {result.targets.map(tgt => (
                <div key={tgt.label} className="flex items-center justify-between mb-2">
                  <span className="font-exo text-xs text-[#444]">{tgt.label}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: tgt.color }}>{tgt.price}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">{t["db_scenarios"]}</div>
              {result.scenarios.map(sc => (
                <div key={sc.label} className="mb-2.5">
                  <div className="flex justify-between mb-1">
                    <span className="font-exo text-xs" style={{ color: sc.color }}>{sc.label}</span>
                    <span className="font-mono text-xs" style={{ color: sc.color }}>{sc.prob}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1a1a1a] overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${sc.prob}%` }} transition={{ duration: 0.7, ease: "easeOut" }}
                      className="h-full rounded-full" style={{ background: sc.color }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">{t["db_indicators"]}</div>
              {result.indicators.map(ind => (
                <div key={ind.name} className="flex items-center justify-between mb-1.5">
                  <span className="font-exo text-[11px] text-[#444] truncate">{ind.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-[11px] text-white">{ind.value}</span>
                    <div className="w-1.5 h-1.5 rounded-full"
                      style={{ background: ind.status === "bull" ? "#02B365" : ind.status === "bear" ? "#EF4444" : "#F59E0B" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setSelected(null); setResult(null); }}
            className="font-exo text-xs text-[#444] hover:text-white border border-[#1a1a1a] hover:border-[#333] px-4 py-2 rounded-xl transition-all">
            {t["db_back"]}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
