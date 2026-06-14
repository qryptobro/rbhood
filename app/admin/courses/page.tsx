"use client";
import { useState } from "react";
import { useStore, Course, Module, Lesson } from "../../../store/useStore";

const STATUS = {
  published: { color: "#02B365", bg: "#02B36515", label: "Опубликован" },
  draft:     { color: "#F59E0B", bg: "#F59E0B15", label: "Черновик"    },
};

// ─── Lesson row ───────────────────────────────────────────────────────────────
function getYoutubeId(url: string) {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function LessonRow({ lesson, courseId, moduleId }: { lesson: Lesson; courseId: number; moduleId: number }) {
  const { updateLesson, deleteLesson } = useStore();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [duration, setDuration] = useState(lesson.duration);
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl ?? "");

  const save = () => {
    updateLesson(courseId, moduleId, lesson.id, { title, duration, videoUrl: videoUrl.trim() || undefined });
    setEditing(false);
  };

  const hasVideo = !!getYoutubeId(lesson.videoUrl ?? "");

  return (
    <div className="px-4 py-2.5 hover:bg-[#111] transition-colors group rounded-xl">
      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="flex-1 bg-[#1a1a1a] border border-[#02B365] rounded-lg px-2 py-1 font-exo text-xs text-white outline-none" />
            <input value={duration} onChange={e => setDuration(e.target.value)}
              className="w-16 bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-1 font-mono text-xs text-white outline-none text-center" />
          </div>
          <div className="flex items-center gap-2 pl-5">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#E00" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
              <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/>
              <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
            </svg>
            <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://youtu.be/..."
              className="flex-1 bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-1 font-mono text-[10px] text-white outline-none placeholder:text-[#333] focus:border-[#E00]" />
          </div>
          <div className="flex justify-end gap-2 pl-5">
            <button onClick={() => setEditing(false)} className="text-[#444] font-mono text-[10px] hover:text-white">Отмена</button>
            <button onClick={save} className="text-[#02B365] font-mono text-[10px] hover:underline">Сохранить</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={hasVideo ? "#E00" : "#333"} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          <span className="flex-1 font-exo text-sm text-[#888] truncate">{lesson.title}</span>
          {hasVideo && <span className="font-mono text-[8px] text-[#E00] bg-[#E0000015] px-1.5 py-0.5 rounded flex-shrink-0">YT</span>}
          <span className="font-mono text-[10px] text-[#444] flex-shrink-0">{lesson.duration}</span>
          <span className={`font-mono text-[8px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${lesson.free ? "text-[#02B365] bg-[#02B36515]" : "text-[#333] bg-[#1a1a1a]"}`}>
            {lesson.free ? "FREE" : "PRO"}
          </span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => setEditing(true)} className="w-5 h-5 flex items-center justify-center rounded text-[#444] hover:text-white transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button onClick={() => deleteLesson(courseId, moduleId, lesson.id)} className="w-5 h-5 flex items-center justify-center rounded text-[#444] hover:text-[#EF4444] transition-colors">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Module block ─────────────────────────────────────────────────────────────
function ModuleBlock({ module, courseId, index }: { module: Module; courseId: number; index: number }) {
  const { updateModule, deleteModule, addLesson } = useStore();
  const [open, setOpen] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(module.title);
  const [addingLesson, setAddingLesson] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDuration, setNewDuration] = useState("10:00");

  const saveTitle = () => { updateModule(courseId, module.id, title); setEditingTitle(false); };
  const saveLesson = () => {
    if (!newTitle.trim()) return;
    addLesson(courseId, module.id, { title: newTitle.trim(), duration: newDuration, free: false });
    setNewTitle(""); setNewDuration("10:00"); setAddingLesson(false);
  };

  return (
    <div className="rounded-2xl border border-[#1a1a1a] overflow-hidden" style={{ background: "#0e0e0e" }}>
      {/* Module header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a]" style={{ background: "#141414" }}>
        <button onClick={() => setOpen(v => !v)} className="flex-shrink-0 text-[#444] hover:text-white transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
        <span className="font-mono text-[10px] text-[#444] flex-shrink-0">М{index + 1}</span>
        {editingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input value={title} onChange={e => setTitle(e.target.value)} autoFocus
              onKeyDown={e => e.key === "Enter" && saveTitle()}
              className="flex-1 bg-[#1a1a1a] border border-[#02B365] rounded-lg px-2 py-1 font-exo text-sm text-white outline-none" />
            <button onClick={saveTitle} className="text-[#02B365] font-mono text-[10px] hover:underline flex-shrink-0">Сохр.</button>
            <button onClick={() => setEditingTitle(false)} className="text-[#444] font-mono text-[10px] hover:text-white flex-shrink-0">✕</button>
          </div>
        ) : (
          <>
            <span className="flex-1 font-exo font-bold text-sm text-white truncate">{module.title}</span>
            <span className="font-mono text-[10px] text-[#333] flex-shrink-0">{module.lessons.length} уроков</span>
          </>
        )}
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setEditingTitle(true)} className="w-6 h-6 flex items-center justify-center rounded text-[#333] hover:text-white hover:bg-[#1e1e1e] transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={() => deleteModule(courseId, module.id)} className="w-6 h-6 flex items-center justify-center rounded text-[#333] hover:text-[#EF4444] hover:bg-[#EF444410] transition-all">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Lessons */}
      {open && (
        <div className="py-1">
          {module.lessons.map(l => (
            <LessonRow key={l.id} lesson={l} courseId={courseId} moduleId={module.id} />
          ))}

          {addingLesson ? (
            <div className="flex items-center gap-2 px-4 py-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Название урока..."
                autoFocus onKeyDown={e => e.key === "Enter" && saveLesson()}
                className="flex-1 bg-[#1a1a1a] border border-[#02B365] rounded-lg px-2 py-1 font-exo text-xs text-white outline-none placeholder:text-[#333]" />
              <input value={newDuration} onChange={e => setNewDuration(e.target.value)}
                className="w-16 bg-[#1a1a1a] border border-[#222] rounded-lg px-2 py-1 font-mono text-xs text-white outline-none text-center" />
              <button onClick={saveLesson} className="text-[#02B365] font-mono text-[10px] hover:underline flex-shrink-0">Добавить</button>
              <button onClick={() => setAddingLesson(false)} className="text-[#444] font-mono text-[10px] hover:text-white flex-shrink-0">✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingLesson(true)}
              className="flex items-center gap-2 px-4 py-2 w-full text-left text-[#333] hover:text-[#02B365] transition-colors group/add">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              <span className="font-mono text-[10px]">Добавить урок</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Course detail ────────────────────────────────────────────────────────────
function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const { addModule, updateCourse } = useStore();
  const [addingModule, setAddingModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const st = STATUS[course.status];
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  const saveModule = () => {
    if (!moduleTitle.trim()) return;
    addModule(course.id, { title: moduleTitle.trim(), lessons: [] });
    setModuleTitle(""); setAddingModule(false);
  };

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-xl text-[#444] hover:text-white hover:bg-[#161616] transition-all border border-[#1a1a1a]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-orbitron font-bold text-xl text-white tracking-wide truncate">{course.title}</h1>
            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md flex-shrink-0" style={{ color: st.color, background: st.bg }}>{st.label}</span>
          </div>
          <p className="font-exo text-sm text-[#444] mt-0.5">{course.modules.length} модулей · {totalLessons} уроков</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {course.status === "draft" ? (
            <button onClick={() => updateCourse(course.id, { status: "published" })}
              className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
              style={{ background: "#02B365" }}>Опубликовать</button>
          ) : (
            <button onClick={() => updateCourse(course.id, { status: "draft" })}
              className="px-4 py-2 rounded-xl font-exo font-bold text-sm text-[#666] border border-[#1e1e1e] hover:text-white transition-all"
              style={{ background: "#161616" }}>В черновик</button>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        {course.modules.map((m, i) => (
          <ModuleBlock key={m.id} module={m} courseId={course.id} index={i} />
        ))}

        {addingModule ? (
          <div className="flex items-center gap-2 p-4 rounded-2xl border border-[#02B365]" style={{ background: "#111" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#02B365" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
              <path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/>
            </svg>
            <input value={moduleTitle} onChange={e => setModuleTitle(e.target.value)} placeholder="Название модуля..."
              autoFocus onKeyDown={e => e.key === "Enter" && saveModule()}
              className="flex-1 bg-transparent font-exo text-sm text-white outline-none placeholder:text-[#333]" />
            <button onClick={saveModule} className="text-[#02B365] font-exo font-bold text-sm hover:underline flex-shrink-0">Создать</button>
            <button onClick={() => setAddingModule(false)} className="text-[#444] font-mono text-[10px] hover:text-white flex-shrink-0">✕</button>
          </div>
        ) : (
          <button onClick={() => setAddingModule(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[#1e1e1e] text-[#333] hover:text-[#02B365] hover:border-[#02B36540] transition-all font-exo text-sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Добавить модуль
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CoursesPage() {
  const { courses, addCourse, deleteCourse } = useStore();
  const [selected, setSelected] = useState<number | null>(null);

  const selectedCourse = courses.find(c => c.id === selected);

  if (selectedCourse) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <CourseDetail course={selectedCourse} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-orbitron font-bold text-xl text-white tracking-wide">Курсы</h1>
          <p className="font-exo text-sm text-[#444] mt-0.5">
            {courses.filter(c => c.status === "published").length} опубликовано · {courses.filter(c => c.status === "draft").length} в черновике
          </p>
        </div>
        <button onClick={() => addCourse({ title: "Новый курс", description: "", cover: "#02B365", status: "draft", modules: [] })}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-exo font-bold text-sm text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(90deg,#02B365,#19BB74)", boxShadow: "0 2px 12px rgba(2,179,101,0.2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Создать курс
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map(c => {
          const st = STATUS[c.status];
          const totalLessons = c.modules.reduce((sum, m) => sum + m.lessons.length, 0);
          return (
            <div key={c.id} className="rounded-2xl border border-[#1a1a1a] overflow-hidden hover:border-[#222] transition-all group cursor-pointer"
              style={{ background: "#111" }} onClick={() => setSelected(c.id)}>
              {/* Cover */}
              <div className="h-20 relative flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${c.cover}22, ${c.cover}08)`, borderBottom: `1px solid ${c.cover}15` }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={c.cover} strokeWidth="1.5" strokeLinecap="round" style={{ opacity: 0.6 }}>
                  <path d="M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
                <div className="absolute top-2.5 right-2.5">
                  <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-md" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                </div>
              </div>

              <div className="p-4">
                <div className="font-exo font-bold text-white text-sm mb-1 group-hover:text-[#02B365] transition-colors truncate">{c.title}</div>
                {c.description && <div className="font-exo text-xs text-[#444] mb-3 truncate">{c.description}</div>}
                <div className="flex items-center gap-3 mb-4">
                  <span className="font-mono text-[10px] text-[#444]">{c.modules.length} модулей</span>
                  <span className="text-[#222]">·</span>
                  <span className="font-mono text-[10px] text-[#444]">{totalLessons} уроков</span>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button onClick={() => setSelected(c.id)}
                    className="flex-1 py-1.5 rounded-xl font-exo text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: "#02B365" }}>
                    Редактировать
                  </button>
                  <button onClick={() => deleteCourse(c.id)}
                    className="w-8 flex items-center justify-center rounded-xl border border-[#1e1e1e] text-[#444] hover:text-[#EF4444] hover:border-[#EF444430] hover:bg-[#EF444410] transition-all"
                    style={{ background: "#161616" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
