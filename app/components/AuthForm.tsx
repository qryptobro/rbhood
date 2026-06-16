"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "./i18n";

export default function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isSignup = mode === "signup";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim() || (isSignup && !name.trim())) return;
    // TODO: подключить реальную аутентификацию (backend + БД).
    // Пока — переход в дашборд.
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#080808", fontFamily: "'Exo 2', sans-serif" }}>
      {/* glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[400px] rounded-full"
          style={{ background: "radial-gradient(ellipse, rgba(2,179,101,0.08) 0%, transparent 70%)" }} />
      </div>

      <div className="relative w-full max-w-[420px] rounded-2xl border border-[#1a1a1a] p-8"
        style={{ background: "#0d0d0d", boxShadow: "0 0 60px rgba(2,179,101,0.06)" }}>
        {/* Header */}
        <div className="text-center mb-7">
          <h1 className="font-exo font-bold text-white text-2xl mb-1">
            {isSignup ? t["auth_signup_title"] : t["auth_signin_title"]}
          </h1>
          <p className="font-exo text-sm text-[#666]">
            {isSignup ? t["auth_signup_sub"] : t["auth_signin_sub"]}
          </p>
        </div>

        {/* Google */}
        <button type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border border-[#222] font-exo font-semibold text-sm text-white hover:border-[#333] hover:bg-[#141414] transition-all mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {t["auth_google"]}
        </button>

        {/* OR */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="font-mono-custom text-[10px] text-[#444] tracking-widest">{t["auth_or"]}</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
        </div>

        {/* Form */}
        <form onSubmit={submit} className="flex flex-col gap-4">
          {isSignup && (
            <div>
              <label className="font-exo font-semibold text-sm text-white block mb-1.5">{t["auth_name"]}</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder={t["auth_name_ph"]}
                className="w-full h-11 px-3.5 rounded-xl border border-[#1e1e1e] bg-[#111] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#444]" />
            </div>
          )}

          <div>
            <label className="font-exo font-semibold text-sm text-white block mb-1.5">{t["auth_email"]}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t["auth_email_ph"]}
              className="w-full h-11 px-3.5 rounded-xl border border-[#1e1e1e] bg-[#111] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#444]" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-exo font-semibold text-sm text-white">{t["auth_password"]}</label>
              {!isSignup && <a href="#" className="font-exo text-xs text-[#666] hover:text-[#02B365] transition-colors">{t["auth_forgot"]}</a>}
            </div>
            <div className="relative">
              <input type={showPwd ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={t["auth_password_ph"]}
                className="w-full h-11 px-3.5 pr-11 rounded-xl border border-[#1e1e1e] bg-[#111] text-white text-sm font-exo outline-none focus:border-[#02B365] transition-colors placeholder:text-[#444]" />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#888] transition-colors">
                {showPwd
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
              </button>
            </div>
          </div>

          <button type="submit"
            className="w-full h-11 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 hover:-translate-y-px mt-1"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 4px 20px rgba(2,179,101,0.3)" }}>
            {isSignup ? t["auth_signup_btn"] : t["auth_signin_btn"]}
          </button>
        </form>

        {/* Switch */}
        <div className="text-center mt-6 font-exo text-sm text-[#666]">
          {isSignup ? t["auth_have_account"] : t["auth_no_account"]}{" "}
          <a href={isSignup ? "/login" : "/register"} className="text-[#02B365] hover:underline">
            {isSignup ? t["auth_signin_link"] : t["auth_signup_link"]}
          </a>
        </div>
      </div>
    </div>
  );
}
