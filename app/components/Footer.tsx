"use client";
import { useI18n } from "./i18n";

export default function Footer() {
  const { t } = useI18n();

  const cols = [
    {
      title: t["footer_product"],
      links: [
        { label: t["footer_how"], href: "#how" },
        { label: t["footer_pricing"], href: "#pricing" },
        { label: t["footer_testimonials"], href: "#testimonials" },
        { label: t["footer_faq"], href: "#faq" },
      ],
    },
    {
      title: t["footer_company"],
      links: [
        { label: t["footer_contact"], href: "mailto:support@rbhood.ai" },
        { label: t["footer_blog"], href: "#" },
      ],
    },
    {
      title: t["footer_legal"],
      links: [
        { label: t["footer_terms"], href: "#" },
        { label: t["footer_privacy"], href: "#" },
        { label: t["footer_disclaimer"], href: "#" },
        { label: t["footer_risk"], href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#111] pt-14 pb-8 px-6" style={{ background: "#050505" }}>
      <div className="max-w-6xl mx-auto">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <a href="#" className="flex items-center gap-2 mb-4">
              <div style={{ width: 30, height: 26, overflow: "hidden", flexShrink: 0, marginTop: "-4px" }}>
                <img src="/logo.svg" alt="" width={30} height={45} style={{ display: "block" }} />
              </div>
              <span className="font-orbitron font-bold text-base lowercase tracking-wider text-white">
                rbhood <span className="text-[#02B365]">ai</span>
              </span>
            </a>
            <p className="font-exo text-sm text-[#444] leading-relaxed max-w-[200px]">
              ИИ-анализ активов для умных трейдеров.
            </p>
            {/* Instagram */}
            <a href="#" className="mt-4 inline-flex items-center justify-center w-9 h-9 rounded-lg border border-[#1e1e1e] text-[#555] hover:border-[#02B36540] hover:text-[#02B365] transition-all duration-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </div>

          {/* Nav columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <div className="font-mono-custom text-[11px] text-[#333] uppercase tracking-widest mb-5">{col.title}</div>
              <ul className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}
                      className="font-exo text-sm text-[#444] hover:text-[#A1A1AA] transition-colors duration-150 cursor-pointer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-[#0e0e0e] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="font-exo text-xs text-[#2a2a2a]">{t["footer_copy"]}</div>
          <div className="font-mono-custom text-[10px] text-[#222] text-center">{t["footer_nfa"]}</div>
        </div>
      </div>
    </footer>
  );
}
