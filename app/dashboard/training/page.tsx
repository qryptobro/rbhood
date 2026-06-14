"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../../../store/useStore";

function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function ModuleThumbnail({ videoId }: { videoId?: string | null }) {
  if (videoId) {
    return (
      <img
        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
        alt=""
        className="w-full h-full object-cover"
      />
    );
  }
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative"
      style={{ background: "linear-gradient(135deg, #a8edcb 0%, #7dd8a8 50%, #5bc48a 100%)" }}>
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }} />
      <div className="relative z-10 mb-3">
        <span className="font-orbitron font-bold text-[#1a5a3a] text-lg tracking-wide">rbhood ai</span>
      </div>
      <div className="relative z-10 flex items-center gap-2 bg-white/30 backdrop-blur-sm rounded-full px-4 py-1.5 border border-white/40">
        <div className="w-3 h-3 rounded-full bg-white/60" />
        <span className="font-exo text-[11px] text-[#1a5a3a] font-medium">Анализ графика</span>
        <div className="w-2 h-2 rounded-full bg-[#02B365]" />
      </div>
    </div>
  );
}

// ─── Video Modal ──────────────────────────────────────────────────────────────
function VideoModal({ videoId, title, onClose }: { videoId: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full rounded-2xl overflow-hidden border border-[#222]"
        style={{ maxWidth: 800, background: "#111" }}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#1a1a1a]">
          <span className="font-exo font-bold text-white text-sm truncate">{title}</span>
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#444] hover:text-white hover:bg-[#1e1e1e] transition-all flex-shrink-0 ml-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="relative" style={{ paddingTop: "56.25%" }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </motion.div>
    </div>
  );
}

export default function TrainingPage() {
  const { courses } = useStore();
  const course = courses[0];
  const MODULES = (course?.modules ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    duration: m.lessons[0]?.duration ?? "—",
    videoUrl: m.lessons[0]?.videoUrl ?? "",
  }));

  const [completed, setCompleted] = useState<number[]>([]);
  const [activeVideo, setActiveVideo] = useState<{ id: string; title: string } | null>(null);

  const toggleComplete = (id: number) => {
    setCompleted(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleCardClick = (mod: typeof MODULES[0]) => {
    const ytId = getYoutubeId(mod.videoUrl);
    if (ytId) {
      setActiveVideo({ id: ytId, title: mod.title });
    } else {
      toggleComplete(mod.id);
    }
  };

  const completedCount = completed.length;
  const total = MODULES.length;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;

  return (
    <>
      <AnimatePresence>
        {activeVideo && (
          <VideoModal
            videoId={activeVideo.id}
            title={activeVideo.title}
            onClose={() => setActiveVideo(null)}
          />
        )}
      </AnimatePresence>

      <div className="px-8 py-8 flex gap-6 items-start justify-center">
        {/* Left: modules grid */}
        <div className="min-w-0" style={{ width: 580 }}>
          <h1 className="font-exo font-bold text-white text-2xl mb-6">{course?.title ?? "Обучение"}</h1>

          <div className="grid grid-cols-2 gap-3" style={{ maxWidth: 580 }}>
            {MODULES.map(mod => {
              const ytId = getYoutubeId(mod.videoUrl);
              return (
                <motion.div key={mod.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: mod.id * 0.05 }}
                  onClick={() => handleCardClick(mod)}
                  className="rounded-2xl border border-[#1a1a1a] overflow-hidden cursor-pointer group transition-all hover:border-[#02B36530]"
                  style={{ background: "#111" }}
                >
                  {/* Thumbnail */}
                  <div className="h-[130px] relative overflow-hidden">
                    <ModuleThumbnail videoId={ytId} />
                    {/* Play button overlay if has video */}
                    {ytId && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{ background: "rgba(255,0,0,0.9)" }}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                        </div>
                      </div>
                    )}
                    {completed.includes(mod.id) && (
                      <div className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: "#02B365" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="px-4 py-3">
                    <div className="font-mono text-[10px] text-[#444] uppercase tracking-widest mb-1">Модуль {mod.id}</div>
                    <div className="font-exo text-sm font-semibold text-white mb-3 leading-tight group-hover:text-[#02B365] transition-colors">
                      {mod.title}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[#444]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        <span className="font-exo text-xs">{mod.duration}</span>
                      </div>
                      {ytId && !completed.includes(mod.id) && (
                        <button
                          onClick={e => { e.stopPropagation(); toggleComplete(mod.id); }}
                          className="font-mono text-[9px] text-[#444] hover:text-[#02B365] transition-colors">
                          Отметить пройденным
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Mentor */}
          <div className="mt-8">
            <h2 className="font-exo font-bold text-white text-lg mb-1">Наставник</h2>
            <p className="font-exo text-sm text-[#444] mb-4">Свяжитесь с наставником в WhatsApp, чтобы получить помощь с первым анализом</p>
            {completedCount < total && (
              <p className="font-exo text-xs text-[#444] mb-3">
                Пройдите все уроки чтобы разблокировать
              </p>
            )}
            <a
              href={completedCount >= total ? "https://wa.me/" : undefined}
              target={completedCount >= total ? "_blank" : undefined}
              rel="noopener noreferrer"
              onClick={e => { if (completedCount < total) e.preventDefault(); }}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl font-exo font-bold text-sm text-white transition-all"
              style={completedCount >= total
                ? { background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.25)", cursor: "pointer" }
                : { background: "#1a1a1a", color: "#444", cursor: "not-allowed" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.135.561 4.137 1.535 5.874L.057 23.886l6.198-1.453A11.944 11.944 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.885 0-3.651-.516-5.166-1.415l-.371-.22-3.679.862.924-3.574-.242-.381A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
              </svg>
              Написать наставнику
            </a>
          </div>
        </div>

        {/* Right: progress panel */}
        <div className="w-[280px] flex-shrink-0 sticky top-4">
          <div className="rounded-2xl border border-[#02B36540] overflow-hidden" style={{ background: "#111", boxShadow: "0 0 0 1px #02B36520" }}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
              <span className="font-exo font-bold text-white text-sm">Прогресс</span>
              <span className="font-mono text-[11px] text-[#444]">{completedCount}/{total} пройдено</span>
            </div>

            {/* Progress bar */}
            <div className="px-5 py-3 border-b border-[#1a1a1a]">
              <div className="h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #02B365, #19BB74)" }}
                />
              </div>
            </div>

            {/* Module list */}
            <div className="flex flex-col">
              {MODULES.map(mod => (
                <button key={mod.id}
                  onClick={() => toggleComplete(mod.id)}
                  className={`flex items-center gap-3 px-4 py-3 border-b border-[#111] text-left transition-colors hover:bg-[#161616] ${completed.includes(mod.id) ? "bg-[#02B36508]" : ""}`}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#1e1e1e]"
                    style={{ background: "#0d0d0d" }}>
                    {completed.includes(mod.id)
                      ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      : <span className="font-mono text-[10px] text-[#333]">{mod.id}</span>}
                  </div>
                  <span className={`font-exo text-xs leading-tight flex-1 ${completed.includes(mod.id) ? "text-[#555] line-through" : "text-[#888]"}`}>
                    {mod.title}
                  </span>
                  {completed.includes(mod.id) && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
