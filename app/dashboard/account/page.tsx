"use client";
import { useEffect, useState } from "react";
import { useI18n } from "../../components/i18n";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Me { name?: string; email?: string; avatar?: string }

export default function AccountPage() {
  const { t } = useI18n();
  const [me, setMe] = useState<Me>({});
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Загружаем актуальные данные пользователя
  useEffect(() => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) return;
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then((d: Me | null) => { if (d) { setMe(d); setName(d.name || ""); setAvatar(d.avatar || ""); } })
      .catch(() => { /* офлайн — берём из кэша */ try { const u = JSON.parse(localStorage.getItem("rbhood-user") || "{}"); setMe(u); setName(u.name || ""); setAvatar(u.avatar || ""); } catch { /* ignore */ } });
  }, []);

  // Загрузка/сжатие аватара до 256px (JPEG)
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const MAX = 256;
        let w = img.width, h = img.height;
        const scale = Math.min(1, MAX / Math.max(w, h));
        w = Math.round(w * scale); h = Math.round(h * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) { ctx.drawImage(img, 0, 0, w, h); setAvatar(canvas.toDataURL("image/jpeg", 0.85)); }
        else setAvatar(reader.result as string);
      };
      img.onerror = () => setAvatar(reader.result as string);
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const token = localStorage.getItem("rbhood-token");
    if (!token) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/auth/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, avatar }),
      });
      if (r.ok) {
        const updated = await r.json();
        setMe(updated);
        try {
          const u = JSON.parse(localStorage.getItem("rbhood-user") || "{}");
          localStorage.setItem("rbhood-user", JSON.stringify({ ...u, ...updated }));
          window.dispatchEvent(new Event("rbhood-user-updated")); // обновить аватар в топбаре
        } catch { /* ignore */ }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const initials = (name || me.email || "?").trim().split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <h1 className="font-exo font-bold text-white text-2xl mb-1">{t["acc_title"]}</h1>
      <p className="font-exo text-sm text-[#444] mb-10">{t["acc_sub"]}</p>

      {/* Avatar */}
      <div className="flex items-center gap-5 mb-10">
        <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center font-exo font-bold text-2xl text-white border border-[#222] flex-shrink-0"
          style={{ background: avatar ? "#0d0d0d" : "#02B365" }}>
          {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : initials}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <label className="h-9 px-4 inline-flex items-center rounded-xl font-exo font-semibold text-sm text-white border border-[#222] hover:border-[#02B36540] hover:bg-[#141414] transition-all cursor-pointer"
              style={{ background: "#161616" }}>
              Загрузить фото
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            {avatar && (
              <button onClick={() => setAvatar("")}
                className="h-9 px-4 rounded-xl font-exo font-semibold text-sm text-[#888] border border-[#1e1e1e] hover:text-[#EF4444] transition-all" style={{ background: "#161616" }}>
                Убрать
              </button>
            )}
          </div>
          <p className="font-exo text-[11px] text-[#444]">JPG или PNG. Фото из Google подставляется автоматически.</p>
        </div>
      </div>

      {/* Basic Information */}
      <div className="mb-10">
        <h2 className="font-exo font-bold text-white text-lg mb-1">{t["acc_personal"]}</h2>
        <p className="font-exo text-sm text-[#444] mb-6">{t["acc_personal_sub"]}</p>

        <div className="mb-4">
          <label className="font-exo text-xs text-[#666] mb-1.5 block">{t["acc_first"]}</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full h-11 px-4 rounded-xl border border-[#1e1e1e] text-white text-sm font-exo outline-none transition-all focus:border-[#02B36540]"
            style={{ background: "#111" }}
          />
        </div>

        <div className="mb-5">
          <label className="font-exo text-xs text-[#666] mb-1.5 block">{t["acc_email"]}</label>
          <input
            value={me.email || ""}
            disabled
            className="w-full h-11 px-4 rounded-xl border border-[#1a1a1a] text-[#444] text-sm font-exo outline-none cursor-not-allowed"
            style={{ background: "#0d0d0d" }}
          />
          <p className="font-exo text-[11px] text-[#333] mt-1.5">{t["acc_email_note"]}</p>
        </div>

        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="h-9 px-6 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.25)" }}>
            {saving ? "…" : saved ? t["acc_saved"] : t["acc_save"]}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[#111] mb-10" />

      {/* Support */}
      <div>
        <h2 className="font-exo font-bold text-white text-lg mb-1">{t["acc_support"]}</h2>
        <p className="font-exo text-sm text-[#444] mb-5">{t["acc_support_sub"]}</p>
        <a href="mailto:support@rbhood.ai"
          className="inline-flex items-center gap-2.5 h-10 px-5 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "#2563EB", boxShadow: "0 2px 12px rgba(37,99,235,0.3)" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
          </svg>
          {t["acc_support_btn"]}
        </a>
      </div>
    </div>
  );
}
