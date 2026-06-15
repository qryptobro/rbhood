export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Exo 2', sans-serif" }}>
      {/* Top bar */}
      <header className="border-b border-[#141414] px-6 h-16 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <div style={{ width: 30, height: 26, overflow: "hidden", flexShrink: 0, marginTop: "-4px" }}>
            <img src="/logo.svg" alt="" width={30} height={45} style={{ display: "block" }} />
          </div>
          <span className="font-orbitron font-bold text-base lowercase tracking-wider text-white">
            rbhood <span className="text-[#02B365]">ai</span>
          </span>
        </a>
        <a href="/" className="ml-auto font-exo text-sm text-[#666] hover:text-white transition-colors">← На главную</a>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-16 legal-prose">
        {children}
      </main>

      {/* styles for legal prose */}
      <style>{`
        .legal-prose h1 { font-family: 'Orbitron', sans-serif; font-weight: 700; color: #fff; font-size: 32px; letter-spacing: -0.5px; margin-bottom: 8px; }
        .legal-prose .updated { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #555; margin-bottom: 32px; }
        .legal-prose h2 { font-family: 'Exo 2', sans-serif; font-weight: 700; color: #fff; font-size: 18px; margin-top: 32px; margin-bottom: 10px; }
        .legal-prose p, .legal-prose li { font-family: 'Exo 2', sans-serif; color: #888; font-size: 15px; line-height: 1.7; margin-bottom: 12px; }
        .legal-prose ul { padding-left: 20px; list-style: disc; margin-bottom: 12px; }
        .legal-prose li { margin-bottom: 6px; }
        .legal-prose a { color: #02B365; }
        .legal-prose strong { color: #ccc; }
      `}</style>
    </div>
  );
}
