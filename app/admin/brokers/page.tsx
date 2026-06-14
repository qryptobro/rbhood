"use client";
import { useState } from "react";
import { useStore, Broker } from "../../../store/useStore";

// ─── Modal ────────────────────────────────────────────────────────────────────
function BrokerModal({
  broker,
  onClose,
  onSave,
}: {
  broker: Partial<Broker> & { isNew?: boolean };
  onClose: () => void;
  onSave: (data: Omit<Broker, "id">) => void;
}) {
  const [name,        setName]        = useState(broker.name        ?? "");
  const [link,        setLink]        = useState(broker.link        ?? "");
  const [description, setDescription] = useState(broker.description ?? "");
  const [logo,        setLogo]        = useState(broker.logo        ?? "");
  const [active,      setActive]      = useState(broker.active      ?? true);
  const [featured,    setFeatured]    = useState(broker.featured    ?? false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim() || !link.trim()) return;
    onSave({ name: name.trim(), link: link.trim(), description: description.trim(), logo, active, featured });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-[#222] p-6 space-y-5" style={{ background: "#111" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-orbitron font-bold text-white">{broker.isNew ? "Новый брокер" : `Редактировать ${broker.name}`}</span>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Logo */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Логотип</div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-[#222] overflow-hidden flex-shrink-0"
              style={{ background: "#161616" }}>
              {logo
                ? <img src={logo} alt="" className="w-full h-full object-contain p-2" />
                : <span className="font-orbitron font-bold text-sm text-[#333]">{name.slice(0, 2) || "—"}</span>}
            </div>
            <div className="space-y-2 flex-1">
              <label className="block w-full py-2 rounded-xl text-center font-exo text-sm text-[#888] border border-[#1e1e1e] hover:text-white hover:border-[#333] transition-all cursor-pointer"
                style={{ background: "#161616" }}>
                Загрузить PNG / SVG
                <input type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />
              </label>
              {logo && (
                <button onClick={() => setLogo("")}
                  className="w-full py-1.5 rounded-xl font-exo text-xs text-[#EF4444] border border-[#EF444420] hover:bg-[#EF444410] transition-all">
                  Удалить лого
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Name */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Название</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Exness"
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Link */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Реферальная ссылка</div>
          <input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..."
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-mono text-xs text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Description */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Описание</div>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Краткое описание брокера..."
            rows={2}
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333] resize-none" />
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {([
            { label: "Активен", sub: "Показывать пользователям", val: active, set: setActive },
            { label: "Рекомендуемый", sub: "Выделить как топ-брокера", val: featured, set: setFeatured },
          ] as const).map(row => (
            <div key={row.label} className="flex items-center justify-between">
              <div>
                <div className="font-exo text-sm text-white">{row.label}</div>
                <div className="font-mono text-[10px] text-[#444]">{row.sub}</div>
              </div>
              <button onClick={() => row.set((v: boolean) => !v)}
                className="relative rounded-full transition-all flex-shrink-0"
                style={{ background: row.val ? "#02B365" : "#1e1e1e", padding: "2px", width: 44, height: 24 }}>
                <div className="w-5 h-5 rounded-full bg-white transition-all"
                  style={{ transform: row.val ? "translateX(20px)" : "translateX(0px)" }} />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-[#666] border border-[#1e1e1e] hover:text-white transition-all"
            style={{ background: "#161616" }}>
            Отмена
          </button>
          <button onClick={handleSave} disabled={!name.trim() || !link.trim()}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-30"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)" }}>
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BrokersPage() {
  const { brokers, addBroker, updateBroker, deleteBroker, toggleBroker } = useStore();
  const [modal, setModal] = useState<(Partial<Broker> & { isNew?: boolean }) | null>(null);

  const save = (data: Omit<Broker, "id">) => {
    if (modal?.isNew) {
      addBroker(data);
    } else if (modal?.id) {
      updateBroker(modal.id, data);
    }
    setModal(null);
  };

  const activeCount = brokers.filter(b => b.active).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {modal && <BrokerModal broker={modal} onClose={() => setModal(null)} onSave={save} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Брокеры</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{activeCount} активных из {brokers.length}</p>
        </div>
        <button onClick={() => setModal({ isNew: true })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Добавить
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {brokers.map(b => (
          <div key={b.id}
            className="flex items-center gap-4 rounded-2xl border border-[#1a1a1a] px-5 py-4 hover:border-[#222] transition-all group"
            style={{ background: "#111", opacity: b.active ? 1 : 0.5 }}>

            {/* Logo */}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border border-[#1e1e1e] overflow-hidden"
              style={{ background: "#161616" }}>
              {b.logo
                ? <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1.5" />
                : <span className="font-orbitron font-bold text-sm text-[#444]">{b.name.slice(0, 2)}</span>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-exo font-bold text-white text-sm">{b.name}</span>
                {b.featured && (
                  <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: "#F59E0B", background: "#F59E0B15" }}>ТОП</span>
                )}
              </div>
              {b.description && (
                <div className="font-exo text-xs text-[#444] truncate">{b.description}</div>
              )}
              <a href={b.link} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="font-mono text-[10px] text-[#333] hover:text-[#02B365] transition-colors truncate block mt-0.5">
                {b.link}
              </a>
            </div>

            {/* Toggle */}
            <button onClick={() => toggleBroker(b.id)}
              className="relative rounded-full flex-shrink-0 transition-all"
              style={{ background: b.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 40, height: 22 }}>
              <div className="w-4 h-4 rounded-full bg-white transition-all"
                style={{ transform: b.active ? "translateX(18px)" : "translateX(0px)" }} />
            </button>

            {/* Actions */}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button onClick={() => setModal(b)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all border border-[#1a1a1a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button onClick={() => deleteBroker(b.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl text-[#444] hover:text-[#EF4444] hover:bg-[#EF444410] hover:border-[#EF444430] transition-all border border-[#1a1a1a]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          </div>
        ))}

        {brokers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-[#1e1e1e]"
              style={{ background: "#111" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>
              </svg>
            </div>
            <div className="font-exo text-sm text-[#444]">Брокеры не добавлены</div>
          </div>
        )}
      </div>
    </div>
  );
}
