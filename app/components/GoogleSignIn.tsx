"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { google?: any; __gsiLoaded?: boolean } }

export default function GoogleSignIn({ onError }: { onError?: (m: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;

    const init = () => {
      const g = window.google;
      if (!g || !ref.current) return;
      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          try {
            const r = await fetch(`${API}/api/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ credential: resp.credential }),
            });
            const data = await r.json();
            if (!r.ok) { onError?.(data.error || "Ошибка Google-входа"); return; }
            localStorage.setItem("rbhood-token", data.token);
            localStorage.setItem("rbhood-user", JSON.stringify(data.user));
            router.push("/dashboard");
          } catch {
            onError?.("Сервер недоступен");
          }
        },
      });
      g.accounts.id.renderButton(ref.current, {
        theme: "filled_black", size: "large", width: 356, text: "continue_with", shape: "rectangular",
      });
    };

    if (window.google?.accounts?.id) { init(); return; }
    // загрузить скрипт GSI один раз
    const existing = document.getElementById("gsi-script");
    if (existing) { existing.addEventListener("load", init); return; }
    const s = document.createElement("script");
    s.id = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true; s.defer = true;
    s.onload = init;
    document.head.appendChild(s);
  }, [router, onError]);

  if (!CLIENT_ID) return null;
  return <div ref={ref} className="flex justify-center mb-5 min-h-[44px]" />;
}
