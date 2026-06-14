"use client";
import { useState } from "react";
import { useStore } from "../../../store/useStore";

export default function PlansPage() {
  const { plans, updatePlan } = useStore();
  const [editing, setEditing] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");

  const startEdit = (id: number, price: number) => {
    setEditing(id);
    setEditPrice(String(price));
  };

  const saveEdit = (id: number) => {
    const price = Number(editPrice);
    if (!isNaN(price) && price > 0) updatePlan(id, { price });
    setEditing(null);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Тарифные планы</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">{plans.length} активных тарифа</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(plan => (
          <div key={plan.id} className="rounded-2xl border p-5 space-y-4"
            style={{ background: "#111", borderColor: editing === plan.id ? plan.color : "#1a1a1a" }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-orbitron font-bold text-lg" style={{ color: plan.color }}>{plan.name}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(plan.id, plan.price)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
              </div>
            </div>

            {editing === plan.id ? (
              <div className="space-y-2">
                <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Цена (USD)</div>
                <input
                  value={editPrice}
                  onChange={e => setEditPrice(e.target.value)}
                  type="number"
                  className="w-full bg-[#161616] border border-[#2a2a2a] rounded-xl px-3 py-2 font-orbitron text-xl font-bold text-white outline-none focus:border-[#02B365] transition-colors"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditing(null)}
                    className="flex-1 py-2 rounded-xl font-exo font-bold text-sm text-[#666] border border-[#1e1e1e] hover:text-white transition-all"
                    style={{ background: "#161616" }}>Отмена</button>
                  <button onClick={() => saveEdit(plan.id)}
                    className="flex-1 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
                    style={{ background: "#02B365" }}>Сохранить</button>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline gap-1">
                <span className="font-orbitron font-bold text-3xl text-white">${plan.price}</span>
                <span className="font-mono text-xs text-[#444]">/{plan.period}</span>
              </div>
            )}

            <div className="space-y-2">
              {plan.features.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="font-exo text-xs text-[#666]">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
