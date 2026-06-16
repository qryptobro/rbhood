"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { I18nProvider } from "../components/i18n";
import Pricing from "../components/Pricing";

function Paywall() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) { router.replace("/login"); return; }
    setReady(true);
  }, [router]);

  const logout = () => {
    try { localStorage.removeItem("rbhood-token"); localStorage.removeItem("rbhood-user"); } catch { /* ignore */ }
    router.replace("/login");
  };

  if (!ready) return null;

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Exo 2', sans-serif" }}>
      <header className="border-b border-[#141414] px-6 h-16 flex items-center">
        <a href="/" className="flex items-center gap-2">
          <div style={{ width: 30, height: 26, overflow: "hidden", marginTop: "-4px" }}>
            <img src="/logo.svg" alt="" width={30} height={45} style={{ display: "block" }} />
          </div>
          <span className="font-orbitron font-bold text-base lowercase tracking-wider text-white">rbhood <span className="text-[#02B365]">ai</span></span>
        </a>
        <button onClick={logout} className="ml-auto font-exo text-sm text-[#666] hover:text-white transition-colors">Выйти</button>
      </header>

      <div className="text-center pt-12 px-6">
        <h1 className="font-orbitron font-bold text-white mb-3" style={{ fontSize: "clamp(24px, 3.4vw, 40px)" }}>Выберите тариф</h1>
        <p className="font-exo text-[#666] max-w-md mx-auto">Доступ к ИИ-анализу открывается по подписке. Выберите план ниже.</p>
      </div>

      <Pricing paywall />
    </div>
  );
}

export default function SubscribePage() {
  return (
    <I18nProvider>
      <Paywall />
    </I18nProvider>
  );
}
