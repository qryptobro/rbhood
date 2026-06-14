"use client";
import { useStore } from "../../../store/useStore";

export default function AutoMailingPage() {
  const { triggers, toggleTrigger } = useStore();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Авторассылка</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">Автоматические триггерные письма</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Новый триггер
        </button>
      </div>

      <div className="space-y-3">
        {triggers.map(item => (
          <div key={item.id} className="rounded-2xl border border-[#1a1a1a] p-4 hover:border-[#222] transition-all"
            style={{ background: "#111" }}>
            <div className="flex items-center gap-4">
              <button onClick={() => toggleTrigger(item.id)}
                className="relative flex-shrink-0 rounded-full transition-all"
                style={{ background: item.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 40, height: 22 }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all"
                  style={{ transform: item.active ? "translateX(18px)" : "translateX(0px)" }} />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-exo font-bold text-sm text-white">{item.name}</span>
                  {!item.active && <span className="font-mono text-[9px] text-[#444] bg-[#1a1a1a] px-2 py-0.5 rounded-md">Пауза</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-[#444]">{item.trigger}</span>
                  <div className="w-px h-3 bg-[#222]"/>
                  <span className="font-mono text-[10px] text-[#444]">{item.delay}</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="font-orbitron text-base font-bold text-white">{item.sent.toLocaleString()}</div>
                <div className="font-mono text-[9px] text-[#333]">отправлено</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
