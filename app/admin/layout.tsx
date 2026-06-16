"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin",             label: "Дашборд",        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
  { href: "/admin/users",       label: "Пользователи",   icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { href: "/admin/plans",       label: "Тарифы",         icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { href: "/admin/promos",      label: "Промокоды",      icon: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01" },
  { href: "/admin/mailing",     label: "Рассылка",       icon: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
  { href: "/admin/auto-mailing",label: "Авторассылка",   icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  { href: "/admin/ai-models",   label: "AI Модели",      icon: "M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1H0a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" },
  { href: "/admin/tools",       label: "Инструменты",    icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" },
  { href: "/admin/courses",     label: "Курсы",          icon: "M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5" },
  { href: "/admin/brokers",     label: "Брокеры",        icon: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" },
  { href: "/admin/reviews",     label: "Отзывы",         icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
];

function AdminSidebar({ open }: { open: boolean }) {
  const path = usePathname();
  const active = (href: string) =>
    href === "/admin" ? path === "/admin" : path.startsWith(href);

  return (
    <aside className="w-[200px] flex-shrink-0 flex flex-col h-full border-r border-[#181818]" style={{ background: "#111" }}>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-[14px] border-b border-[#181818]">
        <div style={{ width: 28, height: 24, overflow: "hidden", flexShrink: 0, marginTop: "-3px" }}>
          <img src="/logo.svg" alt="" width={28} height={42} style={{ display: "block" }} />
        </div>
        <div className="min-w-0">
          <span className="font-orbitron font-bold text-[13px] tracking-wider text-white lowercase">rbhood <span style={{ color: "#02B365" }}>ai</span></span>
          <div className="font-mono text-[9px] text-[#444] uppercase tracking-widest leading-none mt-0.5">Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map(item => {
          const isActive = active(item.href);
          return (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-exo transition-all duration-150 group ${
                isActive
                  ? "text-white font-semibold"
                  : "text-[#555] hover:text-white hover:bg-[#161616]"
              }`}
              style={isActive ? { background: "#02B36518", color: "#02B365" } : {}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={isActive ? "#02B365" : "currentColor"}
                strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span className="truncate">{item.label}</span>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-[#02B365]" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom user */}
      <div className="border-t border-[#181818] px-3 py-3">
        <Link href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[#555] hover:text-white hover:bg-[#161616] transition-all text-xs font-exo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Назад в Dashboard
        </Link>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const path = usePathname();
  const currentPage = NAV.find(n => n.href === "/admin" ? path === "/admin" : path.startsWith(n.href));

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0e0e0e" }}>
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 200, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="flex-shrink-0 overflow-hidden h-full"
          >
            <AdminSidebar open={sidebarOpen} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-4 px-5 h-[46px] border-b border-[#181818]" style={{ background: "#111" }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#333] hover:text-white hover:bg-[#161616] transition-all">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <div className="flex items-center gap-1.5 font-exo text-sm text-[#444]">
            <span className="text-[#333]">Admin</span>
            {currentPage && currentPage.href !== "/admin" && (
              <>
                <span className="text-[#222]">/</span>
                <span className="text-white">{currentPage.label}</span>
              </>
            )}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold uppercase tracking-wider"
              style={{ background: "#02B36515", color: "#02B365", border: "1px solid #02B36530" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#02B365]" />
              Admin
            </div>
            <div className="w-7 h-7 rounded-full overflow-hidden border border-[#2a2a2a]">
              <img src="https://i.pravatar.cc/28?img=12" alt="" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: "#0e0e0e" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
