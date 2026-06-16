"use client";
import { useState } from "react";
import { useStore, Promo } from "../../../store/useStore";

function PromoModal({
  promo,
  onClose,
  onSave,
}: {
  promo: Partial<Promo> & { isNew?: boolean };
  onClose: () => void;
  onSave: (data: Omit<Promo, "id">) => void;
}) {
  const [code, setCode]   = useState(promo.code ?? "");
  const [type, setType]   = useState<"percent" | "fixed">(promo.type ?? "percent");
  const [value, setValue] = useState(String(promo.value ?? ""));
  const [active, setActive] = useState(promo.active ?? true);

  const handleSave = () => {
    const v = Number(value);
    if (!code.trim() || !v || v <= 0) return;
    onSave({ code: code.trim().toUpperCase(), type, value: v, active });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-[#222] p-6 space-y-5" style={{ background: "#111" }}>
        <div className="flex items-center justify-between">
          <span className="font-orbitron font-bold text-white">{promo.isNew ? "Новый промокод" : "Редактировать промокод"}</span>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Code */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Код</div>
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="WELCOME20"
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333] tracking-wider" />
        </div>

        {/* Type */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Тип скидки</div>
          <div className="grid grid-cols-2 gap-2">
            {([["percent", "Процент %"], ["fixed", "Сумма ₸"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setType(v)}
                className="py-2.5 rounded-xl font-exo text-sm transition-all border"
                style={type === v
                  ? { background: "#02B36518", color: "#02B365", borderColor: "#02B36540" }
                  : { background: "#161616", color: "#666", borderColor: "#1e1e1e" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Value */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">
            {type === "percent" ? "Скидка, %" : "Скидка, ₸"}
          </div>
          <input value={value} onChange={e => setValue(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric"
            placeholder={type === "percent" ? "20" : "5000"}
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Active */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-exo text-sm text-white">Активен</div>
            <div className="font-mono text-[10px] text-[#444]">Можно применять на оплате</div>
          </div>
          <button onClick={() => setActive(v => !v)}
            className="relative rounded-full transition-all flex-shrink-0"
            style={{ background: active ? "#02B365" : "#1e1e1e", padding: "2px", width: 44, height: 24 }}>
            <div className="w-5 h-5 rounded-full bg-white transition-all" style={{ transform: active ? "translateX(20px)" : "translateX(0px)" }} />
          </button>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-[#666] border border-[#1e1e1e] hover:text-white transition-all" style={{ background: "#161616" }}>
            Отмена
          </button>
          <button onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PromosPage() {
  const { promos, addPromo, updatePromo, deletePromo, togglePromo } = useStore();
  const [modal, setModal] = useState<(Partial<Promo> & { isNew?: boolean }) | null>(null);

  const save = (data: Omit<Promo, "id">) => {
    if (modal?.isNew) addPromo(data);
    else if (modal?.id) updatePromo(modal.id, data);
    setModal(null);
  };

  const activeCount = promos.filter(p => p.active).length;
  const fmtDiscount = (p: Promo) => p.type === "percent" ? `−${p.value}%` : `−${p.value.toLocaleString("ru-RU")} ₸`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {modal && <PromoModal promo={modal} onClose={() => setModal(null)} onSave={save} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Промокоды</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{activeCount} активных из {promos.length}</p>
        </div>
        <button onClick={() => setModal({ isNew: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить
        </button>
      </div>

      {/* List */}
      <div className="space-y-2">
        {promos.map(p => (
          <div key={p.id}
            className="flex items-center gap-4 rounded-2xl border border-[#1a1a1a] px-4 py-3.5"
            style={{ background: "#111", opacity: p.active ? 1 : 0.5 }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#02B36512", border: "1px solid #02B36530" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-mono font-bold text-white tracking-wider truncate">{p.code}</div>
              <div className="font-exo text-xs text-[#555]">{p.type === "percent" ? "Скидка в процентах" : "Фиксированная скидка"}</div>
            </div>
            <span className="font-orbitron font-bold text-[#02B365] text-base px-3 py-1 rounded-lg flex-shrink-0" style={{ background: "#02B3650d" }}>
              {fmtDiscount(p)}
            </span>
            <button onClick={() => togglePromo(p.id)}
              className="relative rounded-full flex-shrink-0 transition-all"
              style={{ background: p.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 40, height: 22 }}>
              <div className="w-[18px] h-[18px] rounded-full bg-white transition-all" style={{ transform: p.active ? "translateX(18px)" : "translateX(0px)" }} />
            </button>
            <button onClick={() => setModal(p)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-white hover:bg-[#1e1e1e] transition-all flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => deletePromo(p.id)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#666] hover:text-[#EF4444] hover:bg-[#1e1e1e] transition-all flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            </button>
          </div>
        ))}
      </div>

      {promos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-[#1e1e1e]" style={{ background: "#111" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div className="font-exo text-sm text-[#444]">Промокоды не созданы</div>
          <div className="font-exo text-xs text-[#333] mt-1">Создайте код со скидкой — клиенты введут его на оплате</div>
        </div>
      )}
    </div>
  );
}
