"use client";
import { useState } from "react";
import { useStore, Review } from "../../../store/useStore";

// ─── Modal ────────────────────────────────────────────────────────────────────
function ReviewModal({
  review,
  onClose,
  onSave,
}: {
  review: Partial<Review> & { isNew?: boolean };
  onClose: () => void;
  onSave: (data: Omit<Review, "id">) => void;
}) {
  const [image,  setImage]  = useState(review.image  ?? "");
  const [name,   setName]   = useState(review.name   ?? "");
  const [source, setSource] = useState(review.source ?? "");
  const [active, setActive] = useState(review.active ?? true);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Сжимаем скриншот до 600px по ширине (JPEG) — чтобы не переполнять localStorage
      const img = new Image();
      img.onload = () => {
        const MAX = 600;
        let w = img.width, h = img.height;
        if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#0d0d0d"; ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          setImage(canvas.toDataURL("image/jpeg", 0.82));
        } else setImage(reader.result as string);
      };
      img.onerror = () => setImage(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!image) return;
    onSave({ image, name: name.trim(), source: source.trim(), active });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.75)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-md rounded-2xl border border-[#222] p-6 space-y-5 max-h-[90vh] overflow-y-auto" style={{ background: "#111" }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="font-orbitron font-bold text-white">{review.isNew ? "Новый отзыв" : "Редактировать отзыв"}</span>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Screenshot */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-2">Скриншот отзыва</div>
          {image ? (
            <div className="relative rounded-xl border border-[#222] overflow-hidden" style={{ background: "#0d0d0d" }}>
              <img src={image} alt="" className="w-full h-auto block" />
              <button onClick={() => setImage("")}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-[#EF4444] hover:bg-black transition-all">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          ) : (
            <label className="block w-full py-10 rounded-xl text-center font-exo text-sm text-[#888] border border-dashed border-[#2a2a2a] hover:text-white hover:border-[#02B36540] transition-all cursor-pointer"
              style={{ background: "#161616" }}>
              <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              Загрузить скриншот (JPG / PNG)
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>

        {/* Name */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Имя (необязательно)</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Айбек Б."
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Source */}
        <div>
          <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1.5">Источник (необязательно)</div>
          <input value={source} onChange={e => setSource(e.target.value)} placeholder="WhatsApp / Telegram / Trustpilot"
            className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-exo text-sm text-white">Активен</div>
            <div className="font-mono text-[10px] text-[#444]">Показывать на лендинге</div>
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
          <button onClick={handleSave} disabled={!image}
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
export default function ReviewsPage() {
  const { reviews, addReview, updateReview, deleteReview, toggleReview } = useStore();
  const [modal, setModal] = useState<(Partial<Review> & { isNew?: boolean }) | null>(null);

  const save = (data: Omit<Review, "id">) => {
    if (modal?.isNew) addReview(data);
    else if (modal?.id) updateReview(modal.id, data);
    setModal(null);
  };

  const activeCount = reviews.filter(r => r.active).length;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {modal && <ReviewModal review={modal} onClose={() => setModal(null)} onSave={save} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Отзывы</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{activeCount} активных из {reviews.length}</p>
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

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {reviews.map(r => (
          <div key={r.id}
            className="relative rounded-2xl border border-[#1a1a1a] overflow-hidden group"
            style={{ background: "#111", opacity: r.active ? 1 : 0.45 }}>
            <img src={r.image} alt="" className="w-full h-auto block" />
            <div className="px-3 py-2.5 border-t border-[#1a1a1a] flex items-center gap-2">
              <div className="flex-1 min-w-0">
                {r.name && <div className="font-exo text-xs font-bold text-white truncate">{r.name}</div>}
                {r.source && <div className="font-mono text-[9px] text-[#444] truncate">{r.source}</div>}
              </div>
              <button onClick={() => toggleReview(r.id)}
                className="relative rounded-full flex-shrink-0 transition-all"
                style={{ background: r.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 36, height: 20 }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all"
                  style={{ transform: r.active ? "translateX(16px)" : "translateX(0px)" }} />
              </button>
            </div>
            {/* Actions */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setModal(r)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-[#888] hover:text-white transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => deleteReview(r.id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-black/70 text-[#888] hover:text-[#EF4444] transition-all">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3 border border-[#1e1e1e]" style={{ background: "#111" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="font-exo text-sm text-[#444]">Отзывы не добавлены</div>
          <div className="font-exo text-xs text-[#333] mt-1">Загрузите скриншоты реальных отзывов</div>
        </div>
      )}
    </div>
  );
}
