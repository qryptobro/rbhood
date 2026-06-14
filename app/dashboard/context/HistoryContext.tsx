"use client";
import { createContext, useContext, useState, useCallback } from "react";

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
