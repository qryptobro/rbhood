"use client";
import { useEffect } from "react";

// Ловит ?ref=КОД из ссылки и запоминает — потом подставится на оплате
export default function RefCapture() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref && /^[A-Za-z0-9]{2,20}$/.test(ref)) {
        localStorage.setItem("rbhood-ref", ref.trim().toUpperCase());
      }
    } catch { /* ignore */ }
  }, []);
  return null;
}
