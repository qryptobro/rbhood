"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../components/i18n";
import { ASSET_ICONS } from "./components/AssetIcons";
import { useStore } from "../../store/useStore";
import { useHistory } from "./context/HistoryContext";

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

// ─── API types ────────────────────────────────────────────────────────────────
interface TradingPlanEntry {
  action: string;
  entryMin: number | null;
  entryMax: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  confidence: number;
}

interface APIResponse {
  symbol: string;
  category: string;
  currentPrice: number;
  priceChange24h: number;
  stability: number;
  rsi: number;
  economicContext: string;
  vol24h: number;
  vol7d: number;
  vol1m: number;
  rsiHistory: number[];
  priceHistory: number[];
  tradingPlan: { scalper: TradingPlanEntry; dayTrader: TradingPlanEntry; swingTrader: TradingPlanEntry };
  technicalAnalysis: string;
  probableScenarios: string | { Bullish?: string; Bearish?: string; [key: string]: string | undefined };
  explanation: string;
  overallSignal?: string;
  calendar: unknown[];
  news: { title: string; url: string; sentiment?: string; time?: string }[];
  charts: { scalper: string | null; dayTrader: string | null; swingTrader: string | null } | null;
  updatedAt: string;
}

function fmtVol(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchAnalysis(symbol: string, category: string, lang: string): Promise<APIResponse> {
  const res = await fetch(`${API_URL}/api/analysis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol, category, lang }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

function apiToResult(api: APIResponse, asset: Asset, t: Record<string, string>): AnalysisResult {
  const signal: Signal =
    api.overallSignal === "BUY" ? "BUY" : api.overallSignal === "SELL" ? "SELL" : "HOLD";
  const score = Math.round(
    signal === "BUY"  ? 55 + api.stability * 3 :
    signal === "SELL" ? 55 + api.stability * 3 : 50
  );
  const plan = api.tradingPlan.dayTrader;
  const cp = api.currentPrice ?? 0;
  const priceStr = cp.toFixed(cp > 100 ? 2 : cp > 1 ? 4 : 6);
  const fmt = (n: number | null) => n == null ? "—" : n.toFixed(api.currentPrice > 100 ? 2 : api.currentPrice > 1 ? 4 : 6);

  return {
    ticker: asset.symbol,
    signal,
    score,
    price: priceStr,
    change: `${api.priceChange24h >= 0 ? "+" : ""}${api.priceChange24h.toFixed(2)}%`,
    changePositive: api.priceChange24h >= 0,
    summary: api.technicalAnalysis,
    targets: [
      { label: t["db_entry"],   price: `${fmt(plan.entryMin)} – ${fmt(plan.entryMax)}`, color: "#A1A1AA" },
      { label: t["db_target1"], price: fmt(plan.takeProfit),  color: "#02B365" },
      { label: t["db_stop"],    price: fmt(plan.stopLoss),    color: "#EF4444" },
      { label: "Объём 24h",     price: fmtVol(api.vol24h),   color: "#6366F1" },
    ],
    scenarios: [
      { label: t["db_bull"],    prob: signal === "BUY"  ? 60 : 25, color: "#02B365" },
      { label: t["db_neutral"], prob: 100 - Math.abs(api.rsi - 50) * 2, color: "#F59E0B" },
      { label: t["db_bear"],    prob: signal === "SELL" ? 60 : 25, color: "#EF4444" },
    ],
    indicators: [
      { name: "RSI (14)",     value: api.rsi.toFixed(1),    status: api.rsi < 40 ? "bull" : api.rsi > 65 ? "bear" : "neutral" },
      { name: "Stability",    value: `${api.stability}/10`, status: api.stability >= 7 ? "bull" : api.stability >= 4 ? "neutral" : "bear" },
      { name: "Context",      value: api.economicContext,   status: api.economicContext === "Bullish" ? "bull" : api.economicContext === "Bearish" ? "bear" : "neutral" },
      { name: "Vol 7d",       value: fmtVol(api.vol7d),    status: "neutral" },
      { name: "Vol 1m",       value: fmtVol(api.vol1m),    status: "neutral" },
      { name: "Confidence",   value: `${plan.confidence}%`, status: plan.confidence >= 70 ? "bull" : plan.confidence >= 50 ? "neutral" : "bear" },
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
  const { t, lang } = useI18n();
  const { tools } = useStore();
  const { pushHistory } = useHistory();
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
  const [apiData, setApiData] = useState<APIResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [planTab, setPlanTab] = useState<"scalper" | "dayTrader" | "swingTrader">("dayTrader");

  const TAB_LABELS: Record<Tab, string> = {
    forex: t["db_tab_forex"],
    crypto: t["db_tab_crypto"],
    stocks: t["db_tab_stocks"],
  };

  const analyze = async (asset: Asset) => {
    setSelected(asset);
    setScanning(true);
    setResult(null);
    setApiData(null);
    setApiError(null);
    try {
      const data = await fetchAnalysis(asset.symbol, tab, lang);
      setApiData(data);
      const mapped = apiToResult(data, asset, t);
      setResult(mapped);
      pushHistory({
        ticker: asset.symbol,
        signal: mapped.signal,
        time: new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setScanning(false);
    }
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

      {/* Error */}
      {!scanning && apiError && selected && (
        <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-20 gap-4">
          <div className="font-exo text-[#EF4444] text-sm">Ошибка: {apiError}</div>
          <button onClick={() => { setSelected(null); setApiError(null); }}
            className="font-exo text-xs text-[#444] hover:text-white border border-[#1a1a1a] px-4 py-2 rounded-xl transition-all">
            Назад
          </button>
        </motion.div>
      )}

      {/* Result */}
      {!scanning && result && selected && (
        <motion.div key={result.ticker} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} className="px-6 py-8 max-w-3xl mx-auto">

          {/* Header card */}
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
              {apiData?.explanation && (
                <p className="font-exo text-xs text-[#444] mt-2 leading-relaxed">{apiData.explanation}</p>
              )}
            </div>
          </div>

          {/* Charts — 3 таймфрейма */}
          {apiData?.charts && (
            <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden mb-4">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]" style={{ background: "#111" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#02B365]" />
                  <span className="font-mono text-[10px] text-[#333] uppercase tracking-widest">FxPro · {selected?.symbol}</span>
                </div>
                <div className="flex gap-1">
                  {(["scalper", "dayTrader", "swingTrader"] as const).map((pt) => {
                    const label = pt === "scalper" ? "5m" : pt === "dayTrader" ? "15m" : "4h";
                    return (
                      <button key={pt} onClick={() => setPlanTab(pt)}
                        className="px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold transition-all"
                        style={{ background: planTab === pt ? "#02B365" : "#1a1a1a", color: planTab === pt ? "#fff" : "#444" }}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {apiData.charts[planTab] ? (
                <img
                  src={`data:image/png;base64,${apiData.charts[planTab]}`}
                  alt={`${selected?.symbol} ${planTab} chart`}
                  className="w-full block"
                />
              ) : (
                <div className="flex items-center justify-center h-32 font-exo text-xs text-[#333]">График недоступен</div>
              )}
            </div>
          )}

          {/* Indicators + Scenarios + Levels */}
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

          {/* Trading Plan (Scalper / Day / Swing) */}
          {apiData?.tradingPlan && (
            <div className="rounded-2xl border border-[#1a1a1a] p-5 mb-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">Торговый план</div>
              <div className="flex gap-1 mb-4">
                {(["scalper", "dayTrader", "swingTrader"] as const).map(pt => (
                  <button key={pt} onClick={() => setPlanTab(pt)}
                    className="px-4 py-1.5 rounded-xl text-xs font-exo font-bold transition-all"
                    style={{ background: planTab === pt ? "#02B365" : "#161616", color: planTab === pt ? "#fff" : "#444" }}>
                    {pt === "scalper" ? "Скальпер" : pt === "dayTrader" ? "Дей-трейдер" : "Свинг"}
                  </button>
                ))}
              </div>
              {(() => {
                const p = apiData.tradingPlan[planTab];
                const isLong = p.action.includes("BUY");
                const actionColor = isLong ? "#02B365" : p.action === "WAIT" ? "#F59E0B" : "#EF4444";
                const fmt = (n: number | null) => n == null ? "—" : n.toFixed(result.price.includes(".") ? result.price.split(".")[1].length : 2);
                return (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-[#1e1e1e] p-3" style={{ background: "#161616" }}>
                      <div className="font-mono text-[9px] text-[#333] mb-1">СИГНАЛ</div>
                      <div className="font-orbitron text-sm font-bold" style={{ color: actionColor }}>{p.action.replace("_", " ")}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e1e] p-3" style={{ background: "#161616" }}>
                      <div className="font-mono text-[9px] text-[#333] mb-1">ВХОД</div>
                      <div className="font-mono text-xs text-white">{fmt(p.entryMin)} – {fmt(p.entryMax)}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e1e] p-3" style={{ background: "#161616" }}>
                      <div className="font-mono text-[9px] text-[#EF4444] mb-1">СТОП-ЛОСС</div>
                      <div className="font-mono text-xs text-[#EF4444]">{fmt(p.stopLoss)}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e1e] p-3" style={{ background: "#161616" }}>
                      <div className="font-mono text-[9px] text-[#02B365] mb-1">ТЕЙК-ПРОФИТ</div>
                      <div className="font-mono text-xs text-[#02B365]">{fmt(p.takeProfit)}</div>
                    </div>
                    <div className="rounded-xl border border-[#1e1e1e] p-3 md:col-span-2" style={{ background: "#161616" }}>
                      <div className="font-mono text-[9px] text-[#333] mb-1">УВЕРЕННОСТЬ</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[#222] overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${p.confidence}%` }} transition={{ duration: 0.8 }}
                            className="h-full rounded-full"
                            style={{ background: p.confidence >= 70 ? "#02B365" : p.confidence >= 50 ? "#F59E0B" : "#EF4444" }} />
                        </div>
                        <span className="font-mono text-xs text-white">{p.confidence}%</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Probable scenarios text */}
          {apiData?.probableScenarios && (
            <div className="rounded-2xl border border-[#1a1a1a] p-5 mb-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-2">Вероятные сценарии</div>
              {typeof apiData.probableScenarios === "string" ? (
                <p className="font-exo text-sm text-[#555] leading-relaxed">{apiData.probableScenarios}</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {Object.entries(apiData.probableScenarios).map(([key, val]) => (
                    <div key={key} className="flex gap-2">
                      <span className="font-mono text-[10px] font-bold flex-shrink-0 mt-0.5"
                        style={{ color: key === "Bullish" ? "#02B365" : key === "Bearish" ? "#EF4444" : "#F59E0B" }}>
                        {key.toUpperCase()}:
                      </span>
                      <span className="font-exo text-sm text-[#555] leading-relaxed">{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* News */}
          {apiData?.news && apiData.news.length > 0 && (
            <div className="rounded-2xl border border-[#1a1a1a] p-5 mb-4" style={{ background: "#111" }}>
              <div className="font-mono text-[10px] text-[#333] uppercase tracking-widest mb-3">Новости</div>
              <div className="flex flex-col gap-2">
                {apiData.news.slice(0, 5).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-start gap-2 p-2.5 rounded-xl border border-[#1e1e1e] hover:border-[#333] transition-all"
                    style={{ background: "#161616" }}>
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                      style={{ background: n.sentiment === "Bullish" ? "#02B365" : n.sentiment === "Bearish" ? "#EF4444" : "#444" }} />
                    <span className="font-exo text-xs text-[#555] leading-snug">{n.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          <button onClick={() => { setSelected(null); setResult(null); setApiData(null); }}
            className="font-exo text-xs text-[#444] hover:text-white border border-[#1a1a1a] hover:border-[#333] px-4 py-2 rounded-xl transition-all">
            {t["db_back"]}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
