import { create } from "zustand";
import { persist } from "zustand/middleware";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Plan {
  id: number;
  name: string;
  price: number;
  period: string;
  features: string[];
  color: string;
}

export interface Tool {
  id: number;
  symbol: string;
  category: "Форекс" | "Крипто" | "Акции";
  active: boolean;
  name: string;
  icon?: string; // base64 или URL
}

export interface AIModel {
  id: number;
  name: string;
  provider: string;
  role: string;
  active: boolean;
}

export interface AutoTrigger {
  id: number;
  name: string;
  trigger: string;
  delay: string;
  active: boolean;
  sent: number;
}

export interface Broker {
  id: number;
  name: string;
  logo: string;
  link: string;
  description: string;
  active: boolean;
  featured: boolean;
}

export interface Review {
  id: number;
  image: string;   // скриншот отзыва (base64)
  name: string;    // имя автора (опционально)
  source: string;  // источник: WhatsApp / Trustpilot / Telegram и т.п.
  active: boolean;
}

export interface Lesson {
  id: number;
  title: string;
  duration: string;
  free: boolean;
  videoUrl?: string; // YouTube ссылка
}

export interface Module {
  id: number;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: number;
  title: string;
  description: string;
  cover: string; // hex color
  status: "published" | "draft";
  modules: Module[];
}

// ─── Store ────────────────────────────────────────────────────────────────────

interface Store {
  // Plans
  plans: Plan[];
  updatePlan: (id: number, data: Partial<Plan>) => void;

  // Tools
  tools: Tool[];
  toggleTool: (id: number) => void;
  updateTool: (id: number, data: Partial<Tool>) => void;
  addTool: (tool: Omit<Tool, "id">) => void;
  deleteTool: (id: number) => void;

  // AI Models
  aiModels: AIModel[];
  toggleAIModel: (id: number) => void;

  // Auto mailing triggers
  triggers: AutoTrigger[];
  toggleTrigger: (id: number) => void;

  // Brokers
  brokers: Broker[];
  addBroker: (broker: Omit<Broker, "id">) => void;
  updateBroker: (id: number, data: Partial<Omit<Broker, "id">>) => void;
  deleteBroker: (id: number) => void;
  toggleBroker: (id: number) => void;

  // Reviews (отзывы со скриншотами)
  reviews: Review[];
  addReview: (review: Omit<Review, "id">) => void;
  updateReview: (id: number, data: Partial<Omit<Review, "id">>) => void;
  deleteReview: (id: number) => void;
  toggleReview: (id: number) => void;

  // Courses
  courses: Course[];
  addCourse: (course: Omit<Course, "id">) => void;
  updateCourse: (id: number, data: Partial<Omit<Course, "modules">>) => void;
  deleteCourse: (id: number) => void;
  addModule: (courseId: number, module: Omit<Module, "id">) => void;
  updateModule: (courseId: number, moduleId: number, title: string) => void;
  deleteModule: (courseId: number, moduleId: number) => void;
  addLesson: (courseId: number, moduleId: number, lesson: Omit<Lesson, "id">) => void;
  updateLesson: (courseId: number, moduleId: number, lessonId: number, data: Partial<Lesson>) => void;
  deleteLesson: (courseId: number, moduleId: number, lessonId: number) => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      // ── Plans ──────────────────────────────────────────────────────────────
      plans: [
        {
          id: 1,
          name: "Monthly",
          price: 40,
          period: "мес",
          color: "#02B365",
          features: [
            "AI анализ (Форекс, Крипто, Акции)",
            "Поддержка в WhatsApp",
            "Доступ ко всем обновлениям",
            "Гайды и обучающие материалы",
            "История анализов",
          ],
        },
        {
          id: 2,
          name: "Lifetime",
          price: 180,
          period: "навсегда",
          color: "#F59E0B",
          features: [
            "AI анализ (Форекс, Крипто, Акции)",
            "Поддержка в WhatsApp",
            "Доступ ко всем обновлениям",
            "Гайды и обучающие материалы",
            "История анализов",
          ],
        },
      ],
      updatePlan: (id, data) =>
        set((s) => ({
          plans: s.plans.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      // ── Tools ──────────────────────────────────────────────────────────────
      tools: [
        { id: 1,  symbol: "XAUUSD", name: "Gold / Dollar",       category: "Форекс", active: true  },
        { id: 2,  symbol: "XAGUSD", name: "Silver / Dollar",     category: "Форекс", active: true  },
        { id: 3,  symbol: "EURUSD", name: "Euro / Dollar",       category: "Форекс", active: true  },
        { id: 4,  symbol: "GBPUSD", name: "Pound / Dollar",      category: "Форекс", active: true  },
        { id: 5,  symbol: "AUDJPY", name: "Aussie / Yen",        category: "Форекс", active: true  },
        { id: 6,  symbol: "USDJPY", name: "Dollar / Yen",        category: "Форекс", active: true  },
        { id: 7,  symbol: "AUDUSD", name: "Aussie / Dollar",     category: "Форекс", active: true  },
        { id: 8,  symbol: "USDCHF", name: "Dollar / Franc",      category: "Форекс", active: true  },
        { id: 9,  symbol: "NZDUSD", name: "Kiwi / Dollar",       category: "Форекс", active: true  },
        { id: 10, symbol: "USDCAD", name: "Dollar / Loonie",     category: "Форекс", active: true  },
        { id: 11, symbol: "BTCUSDT",  name: "Bitcoin",              category: "Крипто", active: true  },
        { id: 12, symbol: "ETHUSDT",  name: "Ethereum",             category: "Крипто", active: true  },
        { id: 13, symbol: "BNBUSDT",  name: "BNB",                  category: "Крипто", active: true  },
        { id: 14, symbol: "SOLUSDT",  name: "Solana",               category: "Крипто", active: true  },
        { id: 15, symbol: "XRPUSDT",  name: "Ripple",               category: "Крипто", active: true  },
        { id: 16, symbol: "ADAUSDT",  name: "Cardano",              category: "Крипто", active: true  },
        { id: 17, symbol: "DOGEUSDT", name: "Dogecoin",             category: "Крипто", active: true  },
        { id: 18, symbol: "AVAXUSDT", name: "Avalanche",            category: "Крипто", active: true  },
        { id: 19, symbol: "DOTUSDT",  name: "Polkadot",             category: "Крипто", active: true  },
        { id: 20, symbol: "LINKUSDT", name: "Chainlink",            category: "Крипто", active: true  },
        { id: 21, symbol: "AAPL",   name: "Apple Inc.",           category: "Акции",  active: true  },
        { id: 22, symbol: "TSLA",   name: "Tesla Inc.",           category: "Акции",  active: true  },
        { id: 23, symbol: "NVDA",   name: "NVIDIA Corp.",         category: "Акции",  active: true  },
        { id: 24, symbol: "MSFT",   name: "Microsoft Corp.",      category: "Акции",  active: true  },
        { id: 25, symbol: "AMZN",   name: "Amazon.com Inc.",      category: "Акции",  active: true  },
        { id: 26, symbol: "GOOGL",  name: "Alphabet Inc.",        category: "Акции",  active: true  },
        { id: 27, symbol: "META",   name: "Meta Platforms",       category: "Акции",  active: true  },
        { id: 28, symbol: "AMD",    name: "AMD Inc.",             category: "Акции",  active: true  },
        { id: 29, symbol: "NFLX",   name: "Netflix Inc.",         category: "Акции",  active: true  },
        { id: 30, symbol: "COIN",   name: "Coinbase Global",      category: "Акции",  active: true  },
      ],
      toggleTool: (id) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        })),
      updateTool: (id, data) =>
        set((s) => ({
          tools: s.tools.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),
      addTool: (tool) =>
        set((s) => ({
          tools: [...s.tools, { ...tool, id: Date.now() }],
        })),
      deleteTool: (id) =>
        set((s) => ({
          tools: s.tools.filter((t) => t.id !== id),
        })),

      // ── AI Models ──────────────────────────────────────────────────────────
      aiModels: [
        { id: 1, name: "claude-sonnet-4-6", provider: "Anthropic", role: "Анализ сигналов", active: true  },
        { id: 2, name: "claude-haiku-4-5",  provider: "Anthropic", role: "Быстрые ответы",  active: true  },
        { id: 3, name: "gpt-4o",            provider: "OpenAI",    role: "Резерв",          active: false },
        { id: 4, name: "claude-opus-4-8",   provider: "Anthropic", role: "Глубокий анализ", active: false },
      ],
      toggleAIModel: (id) =>
        set((s) => ({
          aiModels: s.aiModels.map((m) => (m.id === id ? { ...m, active: !m.active } : m)),
        })),

      // ── Auto triggers ──────────────────────────────────────────────────────
      triggers: [
        { id: 1, name: "Добро пожаловать",       trigger: "Регистрация",      delay: "Сразу",   active: true,  sent: 2481 },
        { id: 2, name: "Подписка истекает",       trigger: "Expired -3 дня",   delay: "Авто",    active: true,  sent: 108  },
        { id: 3, name: "Повторная активация",     trigger: "Неактивен 7 дней", delay: "Авто",    active: false, sent: 340  },
        { id: 4, name: "Апгрейд до Lifetime",     trigger: "Monthly > 30 дней",delay: "День 31", active: true,  sent: 217  },
        { id: 5, name: "Подписка истекла",        trigger: "Expired",          delay: "День 0",  active: true,  sent: 189  },
      ],
      toggleTrigger: (id) =>
        set((s) => ({
          triggers: s.triggers.map((t) => (t.id === id ? { ...t, active: !t.active } : t)),
        })),

      // ── Brokers ────────────────────────────────────────────────────────────
      brokers: [
        { id: 1, name: "Exness",  logo: "", link: "https://exness.com",  description: "Низкие спреды, быстрый вывод",    active: true, featured: true  },
        { id: 2, name: "XM",      logo: "", link: "https://xm.com",      description: "Бонусы для новых пользователей",  active: true, featured: false },
        { id: 3, name: "OctaFX", logo: "", link: "https://octafx.com",  description: "Исламский счёт, копитрейдинг",    active: true, featured: false },
      ],
      addBroker: (broker) =>
        set((s) => ({ brokers: [...s.brokers, { ...broker, id: Date.now() }] })),
      updateBroker: (id, data) =>
        set((s) => ({ brokers: s.brokers.map((b) => b.id === id ? { ...b, ...data } : b) })),
      deleteBroker: (id) =>
        set((s) => ({ brokers: s.brokers.filter((b) => b.id !== id) })),
      toggleBroker: (id) =>
        set((s) => ({ brokers: s.brokers.map((b) => b.id === id ? { ...b, active: !b.active } : b) })),

      // ── Reviews ────────────────────────────────────────────────────────────
      reviews: [],
      addReview: (review) =>
        set((s) => ({ reviews: [...s.reviews, { ...review, id: Date.now() }] })),
      updateReview: (id, data) =>
        set((s) => ({ reviews: s.reviews.map((r) => r.id === id ? { ...r, ...data } : r) })),
      deleteReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
      toggleReview: (id) =>
        set((s) => ({ reviews: s.reviews.map((r) => r.id === id ? { ...r, active: !r.active } : r) })),

      // ── Courses ────────────────────────────────────────────────────────────
      courses: [
        {
          id: 1,
          title: "Обучение трейдингу",
          description: "С нуля до первой сделки",
          cover: "#02B365",
          status: "published",
          modules: [
            { id: 1, title: "Введение и первый анализ rbhood ai", lessons: [{ id: 1, title: "Введение и первый анализ rbhood ai", duration: "8 мин", free: true }] },
            { id: 2, title: "Когда и в какое время торговать",    lessons: [{ id: 2, title: "Когда и в какое время торговать",    duration: "3 мин", free: false }] },
            { id: 3, title: "Создайте аккаунт у брокера",        lessons: [{ id: 3, title: "Создайте аккаунт у брокера",        duration: "10 мин", free: false }] },
            { id: 4, title: "Основы технического анализа",       lessons: [{ id: 4, title: "Основы технического анализа",       duration: "10 мин", free: false }] },
            { id: 5, title: "Управление эмоциями в трейдинге",   lessons: [{ id: 5, title: "Управление эмоциями в трейдинге",   duration: "10 мин", free: false }] },
          ],
        },
      ],
      addCourse: (course) =>
        set((s) => ({ courses: [...s.courses, { ...course, id: Date.now() }] })),
      updateCourse: (id, data) =>
        set((s) => ({ courses: s.courses.map((c) => c.id === id ? { ...c, ...data } : c) })),
      deleteCourse: (id) =>
        set((s) => ({ courses: s.courses.filter((c) => c.id !== id) })),
      addModule: (courseId, module) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: [...c.modules, { ...module, id: Date.now() }] }
              : c
          ),
        })),
      updateModule: (courseId, moduleId, title) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, title } : m) }
              : c
          ),
        })),
      deleteModule: (courseId, moduleId) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) }
              : c
          ),
        })),
      addLesson: (courseId, moduleId, lesson) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  modules: c.modules.map((m) =>
                    m.id === moduleId
                      ? { ...m, lessons: [...m.lessons, { ...lesson, id: Date.now() }] }
                      : m
                  ),
                }
              : c
          ),
        })),
      updateLesson: (courseId, moduleId, lessonId, data) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  modules: c.modules.map((m) =>
                    m.id === moduleId
                      ? { ...m, lessons: m.lessons.map((l) => l.id === lessonId ? { ...l, ...data } : l) }
                      : m
                  ),
                }
              : c
          ),
        })),
      deleteLesson: (courseId, moduleId, lessonId) =>
        set((s) => ({
          courses: s.courses.map((c) =>
            c.id === courseId
              ? {
                  ...c,
                  modules: c.modules.map((m) =>
                    m.id === moduleId
                      ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
                      : m
                  ),
                }
              : c
          ),
        })),
    }),
    {
      name: "rbhood-admin-store-v6", // смена имени ключа = гарантированный сброс на дефолты
      version: 6,
      migrate: () => ({}),
    }
  )
);
