"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "../components/i18n";
import { ASSET_ICONS } from "./components/AssetIcons";
import { useStore } from "../../store/useStore";
import { useHistory } from "./context/HistoryContext";
import CandleChart, { type Candle } from "./components/CandleChart";
import Sparkline from "./components/Sparkline";

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

// Базовые карточки с плейсхолдером (реальные цифры подгружаются из /api/quotes)
function buildAssets(): Record<Tab, Asset[]> {
  const make = (items: Omit<Asset, "price" | "change" | "up">[]): Asset[] =>
    items.map(a => ({ ...a, price: "—", change: "…", up: true }));
  return {
    forex:  make(BASE_ASSETS.forex),
    crypto: make(BASE_ASSETS.crypto),
    stocks: make(BASE_ASSETS.stocks),
  };
}

// Тянем реальные котировки из бэкенда (24ч-изменение из дневных свечей MT5)
const QUOTES_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
async function fetchQuotes(symbols: string[]): Promise<Record<string, { price: number; change: number; up: boolean } | null>> {
  const res = await fetch(`${QUOTES_API}/api/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbols }),
  });
  if (!res.ok) return {};
  const data = await res.json();
  return data.quotes || {};
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
  volumeHistory: number[];
  tradingPlan: { scalper: TradingPlanEntry; dayTrader: TradingPlanEntry; swingTrader: TradingPlanEntry };
  technicalAnalysis: string;
  probableScenarios: string | { Bullish?: string; Bearish?: string; [key: string]: string | undefined };
  explanation: string;
  overallSignal?: string;
  calendar: { impact?: string; date?: string; title?: string; description?: string; source?: string }[];
  news: { title: string; url: string; sentiment?: string; time?: string }[];
  candlesByTf: {
    scalper: Candle[] | null;
    dayTrader: Candle[] | null;
    swingTrader: Candle[] | null;
  } | null;
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

// ─── Section heading (заголовок секции со стрелкой) ───────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4 mt-2">
      <h2 className="font-exo font-bold text-white text-lg">{children}</h2>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
      </svg>
    </div>
  );
}

// ─── Key-figure card (карточка с заголовком, значением, спарклайном, описанием) ─
function FigureCard({ title, value, valueColor = "#fff", data, color, desc }: {
  title: string; value: string; valueColor?: string; data: number[]; color: string; desc: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden flex flex-col" style={{ background: "#121212" }}>
      <div className="flex items-start justify-between px-5 pt-4">
        <span className="font-exo text-sm text-[#999]">{title}</span>
        <span className="font-orbitron text-base font-bold" style={{ color: valueColor }}>{value}</span>
      </div>
      <div className="px-1 pt-2">
        <Sparkline data={data} color={color} height={90} />
      </div>
      <div className="px-5 py-3 border-t border-[#171717]">
        <span className="font-exo text-[11px] text-[#555] leading-snug">{desc}</span>
      </div>
    </div>
  );
}

// ─── Plan card (большое значение + подпись) ───────────────────────────────────
function PlanCard({ value, label, color = "#fff" }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-[#1a1a1a] px-5 py-5 flex flex-col justify-between min-h-[110px]" style={{ background: "#121212" }}>
      <span className="font-orbitron text-2xl md:text-[26px] font-bold leading-tight break-words" style={{ color }}>{value}</span>
      <span className="font-exo text-xs text-[#555] mt-3">{label}</span>
    </div>
  );
}

// ─── Accordion (раскрывающийся блок) ──────────────────────────────────────────
function Accordion({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden mb-3" style={{ background: "#121212" }}>
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#02B36515" }}>{icon}</div>
        <span className="font-exo font-bold text-white text-sm flex-1">{title}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }} className="overflow-hidden">
            <div className="px-5 pb-4 pt-0 font-exo text-sm text-[#888] leading-relaxed border-t border-[#171717]">
              <div className="pt-3">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
  useEffect(() => {
    const base = buildAssets();
    setASSETS(base);
    // подгружаем реальные котировки из MT5
    const allSymbols = [...base.forex, ...base.crypto, ...base.stocks].map(a => a.symbol);
    fetchQuotes(allSymbols).then(quotes => {
      setASSETS(prev => {
        if (!prev) return prev;
        const apply = (arr: Asset[]): Asset[] => arr.map(a => {
          const q = quotes[a.symbol];
          if (!q) return a;
          return {
            ...a,
            price: q.price.toString(),
            change: `${q.change >= 0 ? "+" : ""}${q.change.toFixed(2)}%`,
            up: q.up,
          };
        });
        return { forex: apply(prev.forex), crypto: apply(prev.crypto), stocks: apply(prev.stocks) };
      });
    }).catch(() => {});
  }, []);

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

  // При смене языка — пере-запускаем анализ, чтобы AI-текст пришёл на новом языке
  const prevLang = useRef(lang);
  useEffect(() => {
    if (prevLang.current === lang) return;
    prevLang.current = lang;
    if (selected && (apiData || apiError)) {
      analyze(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

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

      {/* Result — redesign */}
      {!scanning && result && selected && apiData && (() => {
        const topColor = result.changePositive ? "#02B365" : "#EF4444";
        const cp = apiData.currentPrice ?? 0;
        const dec = cp > 100 ? 2 : cp > 1 ? 4 : 6;
        const pf = (n: number | null) => n == null ? "—" : n.toFixed(dec);
        const plan = apiData.tradingPlan[planTab];
        const planActionColor = plan.action.includes("BUY") ? "#02B365" : plan.action === "WAIT" ? "#F59E0B" : "#EF4444";
        const headerIcon = tools.find(tt => tt.symbol === selected.symbol)?.icon;
        const ctxColor = apiData.economicContext === "Bullish" ? "#02B365" : apiData.economicContext === "Bearish" ? "#EF4444" : "#F59E0B";

        return (
        <motion.div key={result.ticker} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }} className="px-6 py-8 max-w-5xl mx-auto">

          {/* ─── HEADER: иконка + имя + крупная цена ─── */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="flex items-center gap-3 mb-4">
              {headerIcon ? (
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center" style={{ background: "#1f1f1f" }}>
                  <img src={headerIcon} alt="" className="w-full h-full object-contain" />
                </div>
              ) : ASSET_ICONS[selected.symbol] ? (
                <div className="w-14 h-14 flex items-center justify-center">{ASSET_ICONS[selected.symbol]}</div>
              ) : (
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-orbitron font-bold text-white border border-[#2a2a2a]" style={{ background: "#1f1f1f" }}>
                  {selected.symbol.slice(0, 3)}
                </div>
              )}
              <div className="text-left">
                <div className="font-mono text-[11px] text-[#555] uppercase tracking-wider">{selected.symbol}</div>
                <div className="font-exo text-3xl font-bold text-white leading-tight">{selected.name}</div>
              </div>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap justify-center">
              <span className="font-orbitron text-5xl font-bold text-white">{cp >= 100 ? `$${cp.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `$${cp.toFixed(dec)}`}</span>
              <span className="font-mono text-sm font-bold" style={{ color: topColor }}>
                {result.change} <span className="text-[#555] font-normal">24h</span>
              </span>
            </div>
          </div>

          {/* ─── KEY FIGURES ─── */}
          <SectionHeading>{t["res_key_figures"]}</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
            <FigureCard title={t["res_market_stability"]} value={`${apiData.stability}/10`} valueColor={topColor}
              data={apiData.priceHistory} color={topColor}
              desc={t["res_stability_desc"]} />
            <FigureCard title={t["res_rsi"]} value={`${Math.round(apiData.rsi)}`} valueColor={topColor}
              data={apiData.rsiHistory} color={topColor}
              desc={t["res_rsi_desc"]} />
            <FigureCard title={t["res_econ_context"]}
              value={apiData.economicContext === "Bullish" ? t["res_bullish"] : apiData.economicContext === "Bearish" ? t["res_bearish"] : t["res_neutral"]}
              valueColor={ctxColor} data={apiData.rsiHistory} color={ctxColor}
              desc={`RSI(14): ${apiData.rsi} · 24h: ${apiData.priceChange24h > 0 ? "+" : ""}${apiData.priceChange24h}% · ${t["res_market_stability"]} ${apiData.stability}/10`} />
            <FigureCard title={t["res_vol24h"]} value={fmtVol(apiData.vol24h)} data={apiData.volumeHistory.slice(-12)} color="#5a6470"
              desc={t["res_vol24h_desc"]} />
            <FigureCard title={t["res_vol7d"]} value={fmtVol(apiData.vol7d)} data={apiData.volumeHistory.slice(-20)} color="#5a6470"
              desc={t["res_vol7d_desc"]} />
            <FigureCard title={t["res_vol1m"]} value={fmtVol(apiData.vol1m)} data={apiData.volumeHistory} color="#5a6470"
              desc={t["res_vol1m_desc"]} />
          </div>

          {/* ─── ADAPTED TRADING PLAN ─── */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <SectionHeading>{t["res_trading_plan"]}</SectionHeading>
            <div className="flex items-center gap-1 p-1 rounded-2xl border border-[#1a1a1a]" style={{ background: "#121212" }}>
              {(["scalper", "dayTrader", "swingTrader"] as const).map(pt => (
                <button key={pt} onClick={() => setPlanTab(pt)}
                  className="px-4 py-1.5 rounded-xl font-exo font-bold text-xs transition-all"
                  style={{ background: planTab === pt ? "#02B365" : "transparent", color: planTab === pt ? "#fff" : "#555" }}>
                  {pt === "scalper" ? t["res_scalper"] : pt === "dayTrader" ? t["res_day"] : t["res_swing"]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <PlanCard value={plan.action.replace(/_/g, " ")} label={t["res_trade_type"]} color={planActionColor} />
            <PlanCard value={plan.entryMin == null ? "—" : `${pf(plan.entryMin)}–${pf(plan.entryMax)}`} label={t["res_entry_price"]} />
            <PlanCard value={pf(plan.stopLoss)} label={t["res_sl"]} color="#EF4444" />
            <PlanCard value={pf(plan.takeProfit)} label={t["res_tp"]} color="#02B365" />
          </div>

          {/* Explanations + confidence accordion */}
          <Accordion title={t["res_explanation"]}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#444]">{t["res_confidence"].toUpperCase()}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[#1a1a1a] overflow-hidden max-w-[200px]">
                  <div className="h-full rounded-full" style={{ width: `${plan.confidence}%`, background: plan.confidence >= 70 ? "#02B365" : plan.confidence >= 50 ? "#F59E0B" : "#EF4444" }} />
                </div>
                <span className="font-mono text-xs text-white">{plan.confidence}%</span>
              </div>
              <p>{apiData.explanation}</p>
            </div>
          </Accordion>

          {/* ─── ГРАФИК из MT5-свечей ─── */}
          {apiData.candlesByTf && (
            <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden mb-10 mt-3">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a1a]" style={{ background: "#121212" }}>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#02B365]" />
                  <span className="font-mono text-[10px] text-[#444] uppercase tracking-widest">FxPro · {selected.symbol}</span>
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
              {apiData.candlesByTf[planTab] && apiData.candlesByTf[planTab]!.length > 0 ? (
                <CandleChart candles={apiData.candlesByTf[planTab]!} />
              ) : (
                <div className="flex items-center justify-center h-32 font-exo text-xs text-[#333]">График недоступен</div>
              )}
            </div>
          )}

          {/* ─── OTHER INFORMATION ─── */}
          <SectionHeading>{t["res_other_info"]}</SectionHeading>
          <Accordion title={t["res_tech_analysis"]}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}>
            {apiData.technicalAnalysis}
          </Accordion>
          <Accordion title={t["res_scenarios"]}
            icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>}>
            {typeof apiData.probableScenarios === "string" ? apiData.probableScenarios : (
              <div className="flex flex-col gap-2">
                {Object.entries(apiData.probableScenarios).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="font-mono text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ color: k === "Bullish" ? "#02B365" : k === "Bearish" ? "#EF4444" : "#F59E0B" }}>{k.toUpperCase()}:</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Accordion>

          {/* ─── ECONOMIC ANNOUNCEMENTS ─── */}
          {apiData.calendar && apiData.calendar.length > 0 && (
            <div className="mt-8">
              <SectionHeading>{t["res_econ_events"]}</SectionHeading>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                {apiData.calendar.map((ev, i) => {
                  const high = ev.impact === "High";
                  const badge = high ? { c: "#EF4444", bg: "#EF444415" } : ev.impact === "Medium" ? { c: "#F59E0B", bg: "#F59E0B15" } : { c: "#555", bg: "#ffffff08" };
                  return (
                    <div key={i} className="flex-shrink-0 w-[320px] rounded-2xl border border-[#1a1a1a] p-4" style={{ background: "#121212" }}>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-exo text-xs font-bold mb-3" style={{ color: badge.c, background: badge.bg }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        {ev.impact}
                      </span>
                      {ev.date && <div className="flex items-center gap-1.5 font-exo text-xs text-[#555] mb-2"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>{new Date(ev.date).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</div>}
                      <div className="font-exo font-bold text-white text-sm mb-2 leading-snug">{ev.title}</div>
                      {ev.source && <div className="flex items-center gap-1.5 font-exo text-[11px] text-[#444] mt-3"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>{ev.source}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── NEWS ─── */}
          {apiData.news && apiData.news.length > 0 && (
            <div className="mt-8">
              <SectionHeading>{t["res_news"]}</SectionHeading>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
                {apiData.news.slice(0, 8).map((n, i) => (
                  <a key={i} href={n.url} target="_blank" rel="noopener noreferrer"
                    className="flex-shrink-0 w-[300px] rounded-2xl border border-[#1a1a1a] overflow-hidden hover:border-[#02B36540] transition-all group" style={{ background: "#121212" }}>
                    <div className="h-32 flex items-center justify-center relative" style={{ background: "radial-gradient(circle, #02B36510, #0a0a0a)" }}>
                      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                        <path d="M3 21v-4a4 4 0 0 1 4-4h2l3-5 3 5h2a4 4 0 0 1 4 4v4"/><circle cx="7" cy="6" r="1"/><circle cx="17" cy="6" r="1"/>
                      </svg>
                      <span className="absolute bottom-2 font-mono text-[8px] text-[#333] tracking-widest">[NEWS]</span>
                    </div>
                    <div className="p-4">
                      <div className="font-exo text-sm text-[#ccc] font-semibold leading-snug mb-2 line-clamp-3 group-hover:text-white transition-colors">{n.title}</div>
                      <div className="flex items-center gap-1.5 font-exo text-[11px] text-[#444]">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                        {(n as { source?: string }).source || "News"}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* disclaimer + back */}
          <div className="text-center mt-10 mb-4">
            <p className="font-exo text-xs text-[#444]">{t["res_disclaimer"]}</p>
          </div>
          <div className="flex justify-center">
            <button onClick={() => { setSelected(null); setResult(null); setApiData(null); }}
              className="font-exo text-xs text-[#444] hover:text-white border border-[#1a1a1a] hover:border-[#333] px-5 py-2 rounded-xl transition-all">
              {t["db_back"]}
            </button>
          </div>
        </motion.div>
        );
      })()}

    </AnimatePresence>
  );
}
