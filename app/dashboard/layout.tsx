"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { I18nProvider, useI18n, Lang } from "../components/i18n";
import Sidebar from "./components/Sidebar";
import { HistoryProvider, useHistory } from "./context/HistoryContext";

function LangDropdown() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const langs: Lang[] = ["ru", "kz", "en"];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 font-mono text-[11px] text-[#555] hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-[#161616]">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span className="uppercase font-bold text-white">{lang}</span>
        <motion.svg animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </motion.svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }} transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1.5 rounded-xl border border-[#1e1e1e] overflow-hidden z-50"
            style={{ background: "#111", minWidth: 120, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            {langs.map(l => (
              <button key={l} onClick={() => { setLang(l); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-150 ${lang === l ? "bg-[#02B36515] text-[#02B365]" : "text-[#666] hover:bg-[#161616] hover:text-white"}`}>
                <span className="font-mono text-[11px] font-bold uppercase">{l}</span>
                <span className="font-exo text-xs text-[#444]">{l === "ru" ? "Русский" : l === "kz" ? "Қазақша" : "English"}</span>
                {lang === l && (
                  <svg className="ml-auto" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Аватар реального пользователя с выпадающим меню (Аккаунт / Выйти)
function UserAvatar() {
  const router = useRouter();
  const [u, setU] = useState<{ name?: string; email?: string; avatar?: string }>({});
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => { try { setU(JSON.parse(localStorage.getItem("rbhood-user") || "{}")); } catch { /* ignore */ } };
    read();
    window.addEventListener("rbhood-user-updated", read);
    return () => window.removeEventListener("rbhood-user-updated", read);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const label = (u.name || u.email || "").trim();
  const initials = (u.name || u.email || "?").trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const logout = () => {
    try { localStorage.removeItem("rbhood-token"); localStorage.removeItem("rbhood-user"); } catch { /* ignore */ }
    router.replace("/login");
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(v => !v)} className="block rounded-full" title={label}>
        {u.avatar
          ? <div className="w-7 h-7 rounded-full overflow-hidden border border-[#2a2a2a]"><img src={u.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /></div>
          : <div className="w-7 h-7 rounded-full flex items-center justify-center font-exo font-bold text-[11px] text-white select-none" style={{ background: "#02B365" }}>{initials}</div>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.13 }}
            className="absolute top-full right-0 mt-2 rounded-xl border border-[#1e1e1e] overflow-hidden z-50"
            style={{ background: "#111", minWidth: 200, boxShadow: "0 8px 28px rgba(0,0,0,0.55)" }}>
            <div className="px-4 py-3 border-b border-[#1a1a1a]">
              <div className="font-exo text-sm font-bold text-white truncate">{u.name || "Пользователь"}</div>
              <div className="font-mono text-[10px] text-[#444] truncate">{u.email}</div>
            </div>
            <a href="/dashboard/account" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#161616] transition-colors text-[#888] hover:text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="font-exo text-sm">Мой аккаунт</span>
            </a>
            <button onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-[#EF444410] transition-colors text-[#888] hover:text-[#EF4444] border-t border-[#1a1a1a]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span className="font-exo text-sm">Выйти</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { history, deleteHistory } = useHistory();
  const router = useRouter();

  // Гейт: без токена — на вход; без подписки — на тарифы
  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) { router.replace("/login"); return; }
    const api = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    fetch(`${api}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (!r.ok) { router.replace("/login"); return; }
        const me = await r.json();
        localStorage.setItem("rbhood-user", JSON.stringify(me));
        if (!me.plan || me.plan === "FREE") router.replace("/subscribe");
      })
      .catch(() => { /* офлайн — пускаем по токену */ });
  }, [router]);

  // Определяем мобильный вьюпорт и закрываем сайдбар по умолчанию
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => { setIsMobile(mq.matches); setSidebarOpen(!mq.matches); };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0e0e0e", fontFamily: "'Exo 2', sans-serif" }}>
      {/* ── Десктоп: сайдбар инлайн (раздвигает контент) ── */}
      {!isMobile && (
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex-shrink-0 overflow-hidden h-full"
            >
              <Sidebar history={history} onDeleteHistory={deleteHistory} />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ── Мобайл: сайдбар оверлеем с подложкой ── */}
      {isMobile && (
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSidebarOpen(false)}
                className="fixed inset-0 z-40 bg-black/60"
              />
              <motion.div
                initial={{ x: -210 }} animate={{ x: 0 }} exit={{ x: -210 }}
                transition={{ type: "tween", duration: 0.25 }}
                className="fixed inset-y-0 left-0 z-50 w-[200px]"
              >
                <Sidebar history={history} onDeleteHistory={deleteHistory} />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="flex-shrink-0 flex items-center gap-3 md:gap-4 px-3 md:px-5 h-[46px] border-b border-[#181818]" style={{ background: "#111" }}>
          <button onClick={() => setSidebarOpen(v => !v)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555] md:text-[#333] hover:text-white hover:bg-[#161616] transition-all">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="h-4 w-px bg-[#1a1a1a]" />
          <div className="flex items-center gap-1.5 font-exo text-sm text-[#444]">
            <a href="/dashboard" className="hover:text-white transition-colors">Dashboard</a>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LangDropdown />
            <UserAvatar />
          </div>
        </header>

        <main className="flex-1 overflow-y-auto" style={{ background: "#0e0e0e" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <HistoryProvider>
        <DashboardShell>{children}</DashboardShell>
      </HistoryProvider>
    </I18nProvider>
  );
}
