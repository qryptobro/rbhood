"use client";
import { motion } from "framer-motion";
import { useReveal } from "./useInView";
import SectionLabel from "./SectionLabel";
import { useI18n } from "./i18n";

export default function Pricing({ paywall = false }: { paywall?: boolean }) {
  const { t } = useI18n();
  const { ref, inView } = useReveal();
  // На лендинге CTA ведёт на регистрацию; на paywall — к менеджеру за доступом (Telegram).
  const MANAGER_TG = "https://t.me/rbhoodai_support?text=" + encodeURIComponent("Хочу бесплатный доступ к платформе");
  const hrefFor = (planKey: string) => (paywall ? MANAGER_TG : "/register");

  const plans = [
    {
      name: t["plan1_name"],
      price: "19 990 ₸",
      period: t["plan1_period"],
      badge: t["plan1_badge"],
      desc: t["plan1_desc"],
      features: [t["plan1_f1"], t["plan1_f2"], t["plan1_f3"], t["plan1_f4"], t["plan1_f5"]],
      btn: t["plan1_btn"],
      featured: true,
      href: hrefFor("monthly"),
    },
    {
      name: t["plan2_name"],
      price: "89 990 ₸",
      period: t["plan2_period"],
      badge: t["plan2_badge"],
      desc: t["plan2_desc"],
      features: [t["plan2_f1"], t["plan2_f2"], t["plan2_f3"], t["plan2_f4"], t["plan2_f5"]],
      btn: t["plan2_btn"],
      featured: false,
      href: hrefFor("lifetime"),
    },
  ];

  return (
    <section id="pricing" className="py-24 px-6 relative overflow-hidden" style={{ background: "#080808" }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(2,179,101,0.05) 0%, transparent 65%)" }} />

      <div className="max-w-4xl mx-auto relative z-10" ref={ref}>
        <div className="text-center mb-14">
          <SectionLabel text={t["price_label"]} />
          <h2 className="font-orbitron font-bold text-white" style={{ fontSize: "clamp(22px, 3.2vw, 42px)", letterSpacing: "-0.5px", lineHeight: 1.15 }}>
            {t["price_title"]}
          </h2>
          <p className="text-[#444] text-base mt-4 font-exo max-w-md mx-auto">{t["price_sub"]}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-start">
          {plans.map((plan, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="rounded-2xl p-8 border relative overflow-hidden transition-all duration-300"
              style={plan.featured ? {
                background: "radial-gradient(140% 100% at 95% -10%, rgba(2,179,101,0.1) 0%, #0d0d0d 55%)",
                boxShadow: "0 0 60px rgba(2,179,101,0.08), 0 0 0 1px rgba(2,179,101,0.12)",
                borderColor: "rgba(2,179,101,0.2)",
              } : { background: "#0d0d0d", borderColor: "#151515" }}
            >
              {plan.featured && (
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, #02B365, transparent)" }} />
              )}

              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-orbitron font-bold text-xl text-white">{plan.name}</h3>
                <span className="font-mono text-[10px] font-bold px-3 py-1 rounded border tracking-widest"
                  style={plan.featured
                    ? { color: "#02B365", borderColor: "#02B36540", background: "#02B36510" }
                    : { color: "#02B365", borderColor: "#02B36530", background: "transparent" }}>
                  {plan.badge}
                </span>
              </div>

              <p className="font-exo text-sm text-[#555] mb-6">{plan.desc}</p>

              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="font-orbitron font-bold text-white" style={{ fontSize: 44, letterSpacing: "-2px", whiteSpace: "nowrap" }}>
                  {plan.price}
                </span>
                <span className="font-exo text-sm text-[#444]">{plan.period}</span>
              </div>

              {/* CTA */}
              <a href={plan.href} target={paywall ? "_blank" : undefined} rel={paywall ? "noopener noreferrer" : undefined} className="block text-center w-full py-3.5 rounded-xl font-exo font-semibold text-sm text-white transition-all duration-200 mb-8 hover:opacity-90 hover:-translate-y-px"
                style={plan.featured ? {
                  background: "linear-gradient(90deg,#02B365,#19BB74)",
                  boxShadow: "0 4px 20px rgba(2,179,101,0.3)",
                } : {
                  background: "#0a2a1a",
                  border: "1px solid #02B36530",
                }}>
                {plan.btn}
              </a>

              {/* Features */}
              <div>
                <div className="font-exo text-sm text-[#555] mb-4">{t["price_included"]}</div>
                <ul className="flex flex-col gap-3">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-3 text-sm font-exo" style={{ color: "#A1A1AA" }}>
                      <svg className="flex-shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
