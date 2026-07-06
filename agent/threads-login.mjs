// Локальный логин в Threads → сохраняет сессию в threads-session.json.
// Запуск (в папке agent):
//   npm i playwright && npx playwright install chromium
//   node threads-login.mjs
// Откроется браузер — залогинься в Threads (включая 2FA), потом вернись в терминал и нажми Enter.
// Затем содержимое threads-session.json целиком вставь в GitHub secret THREADS_SESSION.
import { chromium } from "playwright";

const b = await chromium.launch({ headless: false });
const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto("https://www.threads.net/login", { waitUntil: "domcontentloaded" });

console.log("\n➡  Залогинься в открытом окне Threads (можно через Instagram, включая 2FA).");
console.log("➡  Когда увидишь свою ленту — вернись сюда и нажми Enter.\n");

process.stdin.resume();
process.stdin.once("data", async () => {
  await ctx.storageState({ path: "threads-session.json" });
  console.log("\n✅ Сессия сохранена в agent/threads-session.json");
  console.log("➡  Открой этот файл, скопируй ВСЁ содержимое и вставь в GitHub secret THREADS_SESSION.");
  console.log("⚠  Файл секретный — не коммить его в репозиторий (он уже в .gitignore ниже).\n");
  await b.close();
  process.exit(0);
});
