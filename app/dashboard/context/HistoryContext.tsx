"use client";
import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "rbhood-analysis-history";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface HistoryItem {
  id: number;
  ticker: string;
  signal: "BUY" | "SELL" | "HOLD";
  time: string;
}

interface HistoryContextType {
  history: HistoryItem[];
  pushHistory: (item: Omit<HistoryItem, "id">) => void;
  deleteHistory: (id: number) => void;
}

const HistoryContext = createContext<HistoryContextType>({
  history: [],
  pushHistory: () => {},
  deleteHistory: () => {},
});

export function HistoryProvider({ children }: { children: React.ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Загружаем историю: с сервера (привязана к аккаунту, видна на всех устройствах),
  // localStorage используется как мгновенный кэш-фоллбэк
  useEffect(() => {
    let cached: HistoryItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { cached = JSON.parse(raw); setHistory(cached); }
    } catch { /* ignore */ }

    const token = typeof window !== "undefined" ? localStorage.getItem("rbhood-token") : null;
    if (token) {
      fetch(`${API}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then((server: HistoryItem[] | null) => { if (Array.isArray(server)) setHistory(server); })
        .catch(() => { /* офлайн — остаёмся на кэше */ })
        .finally(() => setHydrated(true));
    } else {
      setHydrated(true);
    }
  }, []);

  // Сохраняем при изменении: и в localStorage (кэш), и на сервер (для всех устройств)
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { /* ignore */ }
    const token = typeof window !== "undefined" ? localStorage.getItem("rbhood-token") : null;
    if (token) {
      fetch(`${API}/api/history`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ history }),
      }).catch(() => { /* офлайн — синхронизируется при следующем изменении */ });
    }
  }, [history, hydrated]);

  const pushHistory = useCallback((item: Omit<HistoryItem, "id">) => {
    setHistory(prev => {
      // не дублируем тот же тикер подряд
      const filtered = prev.filter(h => h.ticker !== item.ticker);
      return [{ ...item, id: Date.now() }, ...filtered].slice(0, 20);
    });
  }, []);

  const deleteHistory = useCallback((id: number) => {
    setHistory(prev => prev.filter(h => h.id !== id));
  }, []);

  return (
    <HistoryContext.Provider value={{ history, pushHistory, deleteHistory }}>
      {children}
    </HistoryContext.Provider>
  );
}

export const useHistory = () => useContext(HistoryContext);
