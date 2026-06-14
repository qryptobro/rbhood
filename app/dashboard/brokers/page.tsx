"use client";
import { useStore } from "../../../store/useStore";

export default function BrokersPage() {
  const { brokers } = useStore();
  const active = brokers.filter(b => b.active);
  const featured = active.filter(b => b.featured);
  const rest = active.filter(b => !b.featured);
  const sorted = [...featured, ...rest];

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="font-exo font-bold text-white text-2xl mb-1">Брокеры</h1>
      <p className="font-exo text-sm text-[#444] mb-8">Наши рекомендованные партнёры</p>

      {sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-[#1e1e1e]"
            style={{ background: "#111" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/>
            </svg>
          </div>
          <div className="font-exo text-sm text-[#444]">Брокеры пока не добавлены</div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map(broker => (
          <div key={broker.id}
            className="relative rounded-2xl border overflow-hidden transition-all hover:border-[#222]"
            style={{ background: "#111", borderColor: broker.featured ? "#02B36530" : "#1a1a1a" }}>

            {broker.featured && (
              <div className="absolute top-4 left-6 font-mono text-[8px] font-bold px-2 py-0.5 rounded"
                style={{ color: "#F59E0B", background: "#F59E0B15" }}>
                ТОП БРОКЕР
              </div>
            )}

            {/* External link */}
            <a href={broker.link} target="_blank" rel="noopener noreferrer"
              className="absolute top-4 right-4 text-[#333] hover:text-[#02B365] transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>

            {/* Top section */}
            <div className="px-6 pt-6 pb-5" style={{ paddingTop: broker.featured ? "2.5rem" : "1.5rem" }}>
              {/* Logo */}
              <div className="mb-4">
                {broker.logo ? (
                  <img src={broker.logo} alt={broker.name}
                    className="w-10 h-10 object-contain rounded-xl border border-[#1e1e1e]"
                    style={{ background: "#161616" }} />
                ) : (
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[#1e1e1e]"
                    style={{ background: "#161616" }}>
                    <span className="font-orbitron font-bold text-sm text-[#444]">{broker.name.slice(0, 2)}</span>
                  </div>
                )}
              </div>
              <div className="font-exo font-bold text-white text-base mb-1">{broker.name}</div>
              {broker.description && (
                <div className="font-exo text-sm text-[#444]">{broker.description}</div>
              )}
            </div>

            {/* Bottom action */}
            <div className="border-t border-[#1a1a1a] px-6 py-4 flex justify-end">
              <a href={broker.link} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 h-9 px-5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.25)" }}>
                Создать аккаунт
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
