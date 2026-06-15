"use client";
import { useState, useRef } from "react";
import { useStore, Tool } from "../../../store/useStore";

const CAT_COLOR: Record<string, string> = { Форекс: "#02B365", Крипто: "#F59E0B", Акции: "#4A90D9" };
const CATS = ["Форекс", "Крипто", "Акции"] as const;

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  tool,
  onClose,
  onSave,
}: {
  tool: Partial<Tool> & { isNew?: boolean };
  onClose: () => void;
  onSave: (data: Partial<Tool>) => void;
}) {
  const [symbol,   setSymbol]   = useState(tool.symbol   ?? "");
  const [name,     setName]     = useState(tool.name     ?? "");
  const [category, setCategory] = useState<Tool["category"]>(tool.category ?? "Форекс");
  const [active,   setActive]   = useState(tool.active   ?? true);
  const [icon,     setIcon]     = useState<string>(tool.icon ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Сжимаем иконку до 96px, чтобы не переполнять localStorage (иначе стор не сохраняется)
      const img = new Image();
      img.onload = () => {
        const MAX = 96;
        let w = img.width, h = img.height;
        if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
        else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setIcon(canvas.toDataURL("image/png")); // PNG сохраняет прозрачность логотипов
        } else {
          setIcon(reader.result as string);
        }
      };
      img.onerror = () => setIcon(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!symbol.trim() || !name.trim()) return;
    onSave({ symbol: symbol.trim().toUpperCase(), name: name.trim(), category, active, icon: icon || undefined });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-[#222] p-6 space-y-5" style={{ background: "#111" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="font-orbitron font-bold text-white">{tool.isNew ? "Новый инструмент" : `Редактировать ${tool.symbol}`}</div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Icon upload */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Иконка</div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 border border-[#222] overflow-hidden"
              style={{ background: "#161616" }}>
              {icon ? (
                <img src={icon} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="font-orbitron font-bold text-sm text-[#333]">{symbol.slice(0,3) || "—"}</span>
              )}
            </div>
            <div className="space-y-2 flex-1">
              <button onClick={() => fileRef.current?.click()}
                className="w-full py-2 rounded-xl font-exo text-sm text-[#888] border border-[#1e1e1e] hover:text-white hover:border-[#333] transition-all"
                style={{ background: "#161616" }}>
                Загрузить PNG / SVG
              </button>
              {icon && (
                <button onClick={() => setIcon("")}
                  className="w-full py-1.5 rounded-xl font-exo text-xs text-[#EF4444] border border-[#EF444420] hover:bg-[#EF444410] transition-all">
                  Удалить иконку
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </div>

        {/* Symbol */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Тикер / Символ</div>
          <input value={symbol} onChange={e => setSymbol(e.target.value.toUpperCase())}
            placeholder="EURUSD"
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-mono text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Name */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Название</div>
          <input value={name} onChange={e => setName(e.target.value)}
            placeholder="Euro / Dollar"
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Category */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Категория</div>
          <div className="flex gap-2">
            {CATS.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                className="flex-1 py-2 rounded-xl font-mono text-[10px] font-bold transition-all"
                style={category === c
                  ? { background: CAT_COLOR[c] + "20", border: `1px solid ${CAT_COLOR[c]}`, color: CAT_COLOR[c] }
                  : { background: "#161616", border: "1px solid #1e1e1e", color: "#444" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <div className="font-exo text-sm text-white">Активен</div>
            <div className="font-mono text-[10px] text-[#444]">Показывать в дашборде</div>
          </div>
          <button onClick={() => setActive(v => !v)}
            className="relative rounded-full transition-all flex-shrink-0"
            style={{ background: active ? "#02B365" : "#1e1e1e", padding: "2px", width: 44, height: 24 }}>
            <div className="w-5 h-5 rounded-full bg-white transition-all"
              style={{ transform: active ? "translateX(20px)" : "translateX(0px)" }} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-[#666] border border-[#1e1e1e] hover:text-white transition-all"
            style={{ background: "#161616" }}>
            Отмена
          </button>
          <button onClick={handleSave}
            disabled={!symbol.trim() || !name.trim()}
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
export default function ToolsPage() {
  const { tools, toggleTool, updateTool, addTool, deleteTool } = useStore();
  const [cat, setCat] = useState("Все");
  const [editing, setEditing] = useState<(Partial<Tool> & { isNew?: boolean }) | null>(null);

  const cats = ["Все", ...CATS];
  const filtered = cat === "Все" ? tools : tools.filter(t => t.category === cat);
  const activeCount = tools.filter(t => t.active).length;

  const handleSave = (data: Partial<Tool>) => {
    if (editing?.isNew) {
      addTool(data as Omit<Tool, "id">);
    } else if (editing?.id) {
      updateTool(editing.id, data);
    }
    setEditing(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {editing && <EditModal tool={editing} onClose={() => setEditing(null)} onSave={handleSave} />}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Инструменты</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{activeCount} активных из {tools.length}</p>
        </div>
        <button onClick={() => setEditing({ isNew: true, active: true, category: "Форекс" })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Добавить
        </button>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className="px-3 py-1.5 rounded-xl font-mono text-[10px] font-bold transition-all"
            style={cat === c
              ? { background: (CAT_COLOR[c] ?? "#02B365") + "20", border: `1px solid ${CAT_COLOR[c] ?? "#02B365"}`, color: CAT_COLOR[c] ?? "#02B365" }
              : { background: "#111", border: "1px solid #1a1a1a", color: "#444" }}>
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {filtered.map(t => (
          <div key={t.id} className="rounded-2xl border p-3.5 transition-all group"
            style={{ background: "#111", borderColor: t.active ? "#1e1e1e" : "#141414", opacity: t.active ? 1 : 0.5 }}>

            {/* Top row: icon + toggle */}
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0"
                style={{ background: "#161616" }}>
                {t.icon ? (
                  <img src={t.icon} alt={t.symbol} className="w-full h-full object-contain" />
                ) : (
                  <span className="font-orbitron font-bold text-[8px] text-white">{t.symbol.slice(0, 3)}</span>
                )}
              </div>
              <button onClick={() => toggleTool(t.id)}
                className="relative rounded-full flex-shrink-0 transition-all"
                style={{ background: t.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 28, height: 16 }}>
                <div className="w-3 h-3 rounded-full bg-white transition-all"
                  style={{ transform: t.active ? "translateX(12px)" : "translateX(0px)" }} />
              </button>
            </div>

            <div className="font-orbitron font-bold text-xs text-white truncate">{t.symbol}</div>
            <div className="font-exo text-[10px] text-[#333] truncate mt-0.5">{t.name}</div>

            <div className="flex items-center justify-between mt-2">
              <span className="font-mono text-[8px] font-bold px-1.5 py-0.5 rounded"
                style={{ color: CAT_COLOR[t.category], background: CAT_COLOR[t.category] + "20" }}>
                {t.category}
              </span>
              {/* Edit/Delete on hover */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditing(t)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[#444] hover:text-white transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button onClick={() => deleteTool(t.id)}
                  className="w-5 h-5 flex items-center justify-center rounded text-[#444] hover:text-[#EF4444] transition-colors">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
