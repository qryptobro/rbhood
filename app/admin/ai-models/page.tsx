"use client";
import { useStore } from "../../../store/useStore";

const PROVIDER_COLOR: Record<string, string> = { Anthropic: "#02B365", OpenAI: "#4A90D9" };

export default function AIModelsPage() {
  const { aiModels, toggleAIModel } = useStore();

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">AI Модели</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{aiModels.filter(m => m.active).length} активных</p>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl border border-[#1a1a1a] p-5 space-y-3" style={{ background: "#111" }}>
        <div className="font-exo font-bold text-white text-sm">API Ключи</div>
        {[["Anthropic","ANTHROPIC_API_KEY","sk-ant-••••••••••••••••••••••••••••"],
          ["OpenAI","OPENAI_API_KEY","sk-••••••••••••••••••••••••••••••"]].map(([p,k,v]) => (
          <div key={k} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#161616" }}>
            <div className="font-mono text-[10px] font-bold w-20 flex-shrink-0" style={{ color: PROVIDER_COLOR[p] ?? "#666" }}>{p}</div>
            <div className="flex-1 min-w-0">
              <div className="font-mono text-[9px] text-[#333] mb-0.5">{k}</div>
              <div className="font-mono text-xs text-[#555] truncate">{v}</div>
            </div>
            <button className="font-mono text-[10px] text-[#444] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#1e1e1e]">Изменить</button>
          </div>
        ))}
      </div>

      {/* Models */}
      <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
        <div className="px-5 py-4 border-b border-[#181818] font-exo font-bold text-white text-sm">Модели</div>
        <div className="divide-y divide-[#141414]">
          {aiModels.map(m => (
            <div key={m.id} className="flex items-center gap-4 px-5 py-4 hover:bg-[#141414] transition-colors">
              <button onClick={() => toggleAIModel(m.id)}
                className="relative flex-shrink-0 rounded-full transition-all"
                style={{ background: m.active ? "#02B365" : "#1e1e1e", padding: "2px", width: 36, height: 20 }}>
                <div className="w-3.5 h-3.5 rounded-full bg-white transition-all"
                  style={{ transform: m.active ? "translateX(16px)" : "translateX(0px)" }} />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-sm font-bold text-white">{m.name}</span>
                  <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded"
                    style={{ color: PROVIDER_COLOR[m.provider] ?? "#666", background: (PROVIDER_COLOR[m.provider] ?? "#666") + "20" }}>
                    {m.provider}
                  </span>
                </div>
                <div className="font-exo text-xs text-[#444]">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
