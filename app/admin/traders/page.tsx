"use client";
import { useState } from "react";
import { useStore } from "../../../store/useStore";

const SAMPLE = `[
  { "name": "AlphaTrader_KZ", "country": "🇰🇿", "volume": "$4,820,000", "days": 180 },
  { "name": "BullRunner99",   "country": "🇷🇺", "volume": "$3,650,000", "days": 142 }
]`;

export default function TradersAdminPage() {
  const { topTraders, setTopTraders, addTrader, updateTrader, deleteTrader } = useStore();
  const [json, setJson] = useState("");
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const doImport = () => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error("Ожидался массив");
      const cleaned = parsed.map((t) => ({
        name: String(t.name ?? "").trim(),
        country: String(t.country ?? "").trim(),
        volume: String(t.volume ?? "").trim(),
        days: Number(t.days) || 0,
      })).filter(t => t.name);
      if (cleaned.length === 0) throw new Error("Нет валидных записей (нужно поле name)");
      setTopTraders(cleaned);
      setJson("");
      setImportMsg({ ok: true, text: `Импортировано трейдеров: ${cleaned.length}` });
    } catch (e) {
      setImportMsg({ ok: false, text: "Ошибка JSON: " + (e as Error).message });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Топ трейдеры</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">{topTraders.length} в списке · показываются во вкладке «Топ Трейдеры»</p>
      </div>

      {/* Импорт JSON */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5 space-y-3" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm">Импорт из кабинета (JSON)</div>
        <p className="font-exo text-xs text-[#555] leading-relaxed">
          Запусти скрипт-сборщик в консоли браузера на странице кабинета (F12 → Console), скопируй полученный JSON и вставь сюда.
          Импорт <b className="text-[#888]">заменяет</b> весь список. Формат:
        </p>
        <pre className="font-mono text-[10px] text-[#555] bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-3 overflow-x-auto">{SAMPLE}</pre>
        <textarea value={json} onChange={e => { setJson(e.target.value); setImportMsg(null); }}
          placeholder="Вставьте JSON-массив сюда…" rows={6}
          className="w-full bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333] resize-y" />
        {importMsg && (
          <div className="font-exo text-xs" style={{ color: importMsg.ok ? "#02B365" : "#EF4444" }}>{importMsg.text}</div>
        )}
        <button onClick={doImport} disabled={!json.trim()}
          className="px-5 py-2.5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-40"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
          Импортировать
        </button>
      </div>

      {/* Ручное редактирование */}
      <div className="flex items-center justify-between">
        <div className="font-exo font-bold text-white text-sm">Список ({topTraders.length})</div>
        <button onClick={() => addTrader({ name: "", country: "🇰🇿", volume: "$0", days: 0 })}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить
        </button>
      </div>

      <div className="space-y-2">
        {/* Заголовки */}
        {topTraders.length > 0 && (
          <div className="grid grid-cols-[28px_1fr_56px_1fr_70px_32px] gap-2 px-3">
            {["#", "Имя", "Флаг", "Объём", "Дней", ""].map((h, i) => (
              <span key={i} className="font-mono text-[9px] text-[#333] uppercase tracking-widest">{h}</span>
            ))}
          </div>
        )}
        {topTraders.map((tr, i) => (
          <div key={tr.id} className="grid grid-cols-[28px_1fr_56px_1fr_70px_32px] gap-2 items-center rounded-xl border border-[#1a1a1a] px-3 py-2" style={{ background: "#111" }}>
            <span className="font-orbitron text-xs font-bold text-[#444]">{i + 1}</span>
            <input value={tr.name} onChange={e => updateTrader(tr.id, { name: e.target.value })} placeholder="Имя"
              className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-2.5 py-1.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors" />
            <input value={tr.country} onChange={e => updateTrader(tr.id, { country: e.target.value })} placeholder="🇰🇿"
              className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-2 py-1.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors text-center" />
            <input value={tr.volume} onChange={e => updateTrader(tr.id, { volume: e.target.value })} placeholder="$0"
              className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#02B365] outline-none focus:border-[#02B365] transition-colors" />
            <input value={tr.days} onChange={e => updateTrader(tr.id, { days: Number(e.target.value.replace(/\D/g, "")) || 0 })} inputMode="numeric"
              className="bg-[#0d0d0d] border border-[#1e1e1e] rounded-lg px-2 py-1.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors text-center" />
            <button onClick={() => deleteTrader(tr.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-[#EF4444] hover:bg-[#1e1e1e] transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        ))}
        {topTraders.length === 0 && (
          <div className="rounded-2xl border border-[#1a1a1a] py-12 text-center font-exo text-sm text-[#444]" style={{ background: "#111" }}>
            Список пуст. Импортируй из кабинета или добавь вручную.<br />
            <span className="text-[#333] text-xs">Пока пусто — во вкладке показывается демо-список.</span>
          </div>
        )}
      </div>
    </div>
  );
}
