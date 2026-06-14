"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export default function AccountPage() {
  const [firstName, setFirstName] = useState("IAMD");
  const [lastName, setLastName] = useState("OFFICIAL");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="font-exo font-bold text-white text-2xl mb-1">Настройки аккаунта</h1>
      <p className="font-exo text-sm text-[#444] mb-10">Управляйте личной информацией и настройками</p>

      {/* Basic Information */}
      <div className="mb-10">
        <h2 className="font-exo font-bold text-white text-lg mb-1">Личные данные</h2>
        <p className="font-exo text-sm text-[#444] mb-6">Просматривайте и обновляйте личную информацию аккаунта.</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="font-exo text-xs text-[#666] mb-1.5 block">Имя</label>
            <input
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1e1e1e] text-white text-sm font-exo outline-none transition-all focus:border-[#02B36540]"
              style={{ background: "#111" }}
            />
          </div>
          <div>
            <label className="font-exo text-xs text-[#666] mb-1.5 block">Фамилия</label>
            <input
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-[#1e1e1e] text-white text-sm font-exo outline-none transition-all focus:border-[#02B36540]"
              style={{ background: "#111" }}
            />
          </div>
        </div>

        <div className="mb-5">
          <label className="font-exo text-xs text-[#666] mb-1.5 block">Электронная почта</label>
          <input
            value="daukenzhebaev697@gmail.com"
            disabled
            className="w-full h-11 px-4 rounded-xl border border-[#1a1a1a] text-[#444] text-sm font-exo outline-none cursor-not-allowed"
            style={{ background: "#0d0d0d" }}
          />
          <p className="font-exo text-[11px] text-[#333] mt-1.5">Email нельзя изменить для аккаунтов Google</p>
        </div>

        <div className="flex justify-end">
          <button onClick={save}
            className="h-9 px-6 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.25)" }}>
            {saved ? "Сохранено ✓" : "Сохранить"}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#111] mb-10" />

      {/* Support */}
      <div>
        <h2 className="font-exo font-bold text-white text-lg mb-1">Поддержка</h2>
        <p className="font-exo text-sm text-[#444] mb-5">Нужна помощь? Свяжитесь с нашей командой поддержки.</p>
        <a href="mailto:support@rbhood.ai"
          className="inline-flex items-center gap-2.5 h-10 px-5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "#2563EB", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          Написать в поддержку
        </a>
      </div>
    </div>
  );
}
