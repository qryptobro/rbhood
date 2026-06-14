"use client";
import { useState } from "react";

const SENT = [
  { id: 1, subject: "Новые функции AI анализа", sent: 2481, opened: 1204, date: "10 июн 2026", status: "sent"   },
  { id: 2, subject: "Промо: Elite -30% в июне",  sent: 2481, opened: 893,  date: "05 июн 2026", status: "sent"   },
  { id: 3, subject: "Обновление тарифных планов", sent: 0,    opened: 0,    date: "15 июн 2026", status: "draft"  },
];

export default function MailingPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [target, setTarget] = useState("all");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Рассылка</h1>
        <p className="font-exo text-sm text-[#444] mt-0.5">Отправка писем пользователям</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Compose */}
        <div className="rounded-2xl border border-[#1a1a1a] p-5 space-y-4" style={{ background: "#111" }}>
          <div className="font-exo font-bold text-white text-sm">Новое письмо</div>

          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Получатели</div>
            <div className="flex gap-2">
              {[["all","Все"],["active","Активные"],["trial","Пробные"],["expired","Истёкшие"]].map(([v,l]) => (
                <button key={v} onClick={() => setTarget(v)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${target===v?"text-white":"text-[#444] hover:text-white"}`}
                  style={target===v?{background:"#02B36520",border:"1px solid #02B365",color:"#02B365"}:{background:"#161616",border:"1px solid #1e1e1e"}}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Тема</div>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              placeholder="Тема письма..."
              className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333]" />
          </div>

          <div className="space-y-1">
            <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest">Текст</div>
            <textarea value={body} onChange={e => setBody(e.target.value)}
              rows={6} placeholder="Текст письма..."
              className="w-full bg-[#161616] border border-[#1e1e1e] rounded-xl px-3 py-2.5 font-exo text-sm text-white outline-none focus:border-[#02B365] transition-colors placeholder:text-[#333] resize-none" />
          </div>

          <div className="flex gap-2">
            <button className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-[#888] border border-[#1e1e1e] hover:text-white hover:border-[#333] transition-all"
              style={{ background: "#161616" }}>
              Сохранить черновик
            </button>
            <button className="flex-1 py-2.5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
              Отправить
            </button>
          </div>
        </div>

        {/* History */}
        <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#111" }}>
          <div className="px-5 py-4 border-b border-[#181818] font-exo font-bold text-white text-sm">История рассылок</div>
          <div className="divide-y divide-[#141414]">
            {SENT.map(m => (
              <div key={m.id} className="px-5 py-4 hover:bg-[#141414] transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="font-exo text-sm font-semibold text-white truncate flex-1">{m.subject}</div>
                  <span className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 ${m.status==="sent"?"text-[#02B365] bg-[#02B36515]":"text-[#F59E0B] bg-[#F59E0B15]"}`}>
                    {m.status === "sent" ? "Отправлено" : "Черновик"}
                  </span>
                </div>
                {m.status === "sent" && (
                  <div className="flex gap-4 mb-2">
                    <div>
                      <div className="font-mono text-[10px] text-[#333]">Отправлено</div>
                      <div className="font-orbitron text-sm font-bold text-white">{m.sent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-[#333]">Открыто</div>
                      <div className="font-orbitron text-sm font-bold text-[#02B365]">{m.opened.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] text-[#333]">Open rate</div>
                      <div className="font-orbitron text-sm font-bold text-white">{Math.round(m.opened/m.sent*100)}%</div>
                    </div>
                  </div>
                )}
                <div className="font-mono text-[10px] text-[#333]">{m.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
