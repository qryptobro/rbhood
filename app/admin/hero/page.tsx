"use client";
import { useStore } from "../../../store/useStore";

const SLOTS = [
  { ini: "АБ", bg: "#0f5132" },
  { ini: "НС", bg: "#157347" },
  { ini: "ДҚ", bg: "#02B365" },
];

export default function HeroAdminPage() {
  const { heroAvatars, setHeroAvatars } = useStore();

  const setSlot = (i: number, img: string) => {
    const next = [...heroAvatars];
    next[i] = img;
    setHeroAvatars(next);
  };

  const handleFile = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 128;
        let w = img.width, h = img.height;
        const scale = Math.min(1, MAX / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); setSlot(i, canvas.toDataURL("image/jpeg", 0.85)); }
        else setSlot(i, reader.result as string);
      };
      img.onerror = () => setSlot(i, reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Главный экран</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Аватары в бейдже «+1300 трейдеров» на лендинге</p>
      </div>

      {/* Превью бейджа */}
      <div className="rounded-2xl border border-[#1a1a1a] p-6 flex justify-center" style={{ background: "#0d0d0d" }}>
        <div className="inline-flex items-center gap-3 rounded-full border border-[#2a2a2a] px-4 py-2" style={{ background: "#111" }}>
          <span className="font-mono text-[#444] text-base">[</span>
          <div className="flex -space-x-2">
            {SLOTS.map((s, i) => (
              <div key={i} className="w-7 h-7 rounded-full border-2 border-[#111] overflow-hidden flex items-center justify-center font-exo text-[9px] font-bold text-white"
                style={{ background: s.bg, zIndex: 3 - i }}>
                {heroAvatars[i] ? <img src={heroAvatars[i]} alt="" className="w-full h-full object-cover" /> : s.ini}
              </div>
            ))}
          </div>
          <span className="font-mono text-xs font-bold text-white uppercase tracking-widest">+1300 прибыльных трейдеров</span>
          <span className="font-mono text-[#444] text-base">]</span>
        </div>
      </div>

      {/* Слоты загрузки */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SLOTS.map((s, i) => (
          <div key={i} className="rounded-2xl border border-[#1a1a1a] p-5 flex flex-col items-center gap-4" style={{ background: "#111" }}>
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Аватар {i + 1}</div>
            <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-exo font-bold text-xl text-white border border-[#222]"
              style={{ background: heroAvatars[i] ? "#0d0d0d" : s.bg }}>
              {heroAvatars[i] ? <img src={heroAvatars[i]} alt="" className="w-full h-full object-cover" /> : s.ini}
            </div>
            <div className="flex flex-col gap-2 w-full">
              <label className="h-9 inline-flex items-center justify-center rounded-xl font-exo font-semibold text-sm text-white border border-[#222] hover:border-[#02B36540] hover:bg-[#161616] transition-all cursor-pointer"
                style={{ background: "#161616" }}>
                {heroAvatars[i] ? "Заменить" : "Загрузить"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(i, e)} />
              </label>
              {heroAvatars[i] && (
                <button onClick={() => setSlot(i, "")}
                  className="h-9 rounded-xl font-exo font-semibold text-sm text-[#888] border border-[#1e1e1e] hover:text-[#EF4444] transition-all" style={{ background: "#161616" }}>
                  Убрать
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="font-exo text-xs text-[#444]">JPG или PNG. Если слот пустой — в бейдже показываются инициалы. Изменения применяются на лендинге сразу после сохранения (автоматически).</p>
    </div>
  );
}
