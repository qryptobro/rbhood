"use client";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

const testimonials = [
  { initials: "АБ", name: "Айбек Байжанов", roleKey: "t_role1" as const, textKey: "t1_text" as const },
  { initials: "НС", name: "Назгүл Сейткали", roleKey: "t_role2" as const, textKey: "t2_text" as const },
  { initials: "ДҚ", name: "Данияр Қасымов", roleKey: "t_role3" as const, textKey: "t3_text" as const },
  { initials: "МӘ", name: "Мадина Әлімова", roleKey: "t_role4" as const, textKey: "t4_text" as const },
  { initials: "ЗТ", name: "Зарина Тоқаева", roleKey: "t_role5" as const, textKey: "t5_text" as const },
  { initials: "ЕН", name: "Ержан Нұрланов", roleKey: "t_role6" as const, textKey: "t6_text" as const },
  { initials: "АС", name: "Асель Сарсенова", roleKey: "t_role7" as const, textKey: "t7_text" as const },
  { initials: "БА", name: "Болат Ахметов", roleKey: "t_role8" as const, textKey: "t8_text" as const },
  { initials: "ДМ", name: "Дина Мусаева", roleKey: "t_role9" as const, textKey: "t9_text" as const },
];

const extraKeys = {
  t_role1: "Крипто-трейдер", t_role2: "Частный инвестор", t_role3: "Аналитик",
  t_role4: "Финансовый советник", t_role5: "Трейдер", t_role6: "Портфельный управляющий",
  t_role7: "Инвестор", t_role8: "Дейтрейдер", t_role9: "Крипто-аналитик",
  t1_text: "«Выбрал BTC, за 5 секунд получил полный анализ с прогнозом. Невероятно!»",
  t2_text: "«Наконец-то сервис, где не нужно ничего загружать. Просто выбираешь актив.»",
  t3_text: "«ИИ-анализ действительно работает. Сигналы точные, интерфейс интуитивный.»",
  t4_text: "«Использую rbhood ai каждый день. Экономит часы исследований.»",
  t5_text: "«Анализ акций стал намного проще. Выбираю тикер — получаю рекомендацию.»",
  t6_text: "«Точность прогнозов впечатляет. Помогает принимать взвешенные решения.»",
  t7_text: "«Лучший ИИ-инструмент для инвесторов из Казахстана.»",
  t8_text: "«Экономит столько времени! Раньше тратил часы, теперь — минуты.»",
  t9_text: "«Точность поражает, рекомендую всем трейдерам!»",
} as Record<string, string>;

function TestimonialCard({ initials, name, role, text }: { initials: string; name: string; role: string; text: string }) {
  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 mb-4">
      <div className="text-[#02B365] text-xs tracking-widest mb-3">★★★★★</div>
      <p className="text-sm text-[#3B3B3B] leading-relaxed mb-4 font-exo">{text}</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(135deg,#02B365,#19BB74)" }}>
          {initials}
        </div>
        <div>
          <div className="font-semibold text-sm text-[#0A0A0A]">{name}</div>
          <div className="text-xs text-[#6B6B6B] font-exo">{role}</div>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { t } = useI18n();
  const cols = [
    testimonials.slice(0, 3),
    testimonials.slice(3, 6),
    testimonials.slice(6, 9),
  ];

  return (
    <section id="testimonials" className="py-24 px-8 bg-[#F4F4F5]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionLabel text={t.test_label} dark={false} />
          <h2 className="font-orbitron font-bold text-[#0A0A0A]" style={{ fontSize: "clamp(24px, 3.5vw, 44px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {t.test_title}
          </h2>
        </div>

        <div className="relative overflow-hidden" style={{ height: 560 }}>
          <div className="absolute top-0 left-0 right-0 h-28 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, #F4F4F5, transparent)" }} />
          <div className="absolute bottom-0 left-0 right-0 h-28 z-10 pointer-events-none"
            style={{ background: "linear-gradient(to top, #F4F4F5, transparent)" }} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {cols.map((col, ci) => (
              <div key={ci} className={`hidden md:block ${ci === 0 ? "block" : ""}`}>
                <div
                  className="flex flex-col"
                  style={{
                    animation: `scrollUp 22s linear infinite`,
                    animationDelay: `${[-0, -7, -14][ci]}s`,
                  }}
                >
                  {[...col, ...col].map((item, i) => (
                    <TestimonialCard
                      key={i}
                      initials={item.initials}
                      name={item.name}
                      role={extraKeys[item.roleKey] ?? ""}
                      text={extraKeys[item.textKey] ?? ""}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scrollUp { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @media (prefers-reduced-motion: reduce) { [style*="scrollUp"] { animation: none !important; } }
      `}</style>
    </section>
  );
}
