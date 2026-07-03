# Бесплатный деплой rbhood-ai ($0, без карты)

Стек: **Vercel** (фронт) + **Render** (бэк) + **Neon** (Postgres). Все — регистрация без карты.
Файловые хранилища бэкенда уже перенесены в Postgres (`KV_STORE=db`), поэтому временный диск Render не проблема.

## 1. Neon (Postgres) — база
1. Регистрация на **neon.tech** (GitHub/Google, без карты).
2. Create Project → регион ближе к Европе.
3. Скопируй **Connection string** (`postgresql://...`) — это `DATABASE_URL`.

## 2. Перенос данных со старого сервера в Neon
На **старом** Windows-сервере (там лежат данные):
```powershell
cd C:\rbhood-ai
git pull
cd backend
npm install
$env:DATABASE_URL="postgresql://...neon..."   # ВРЕМЕННО, строка из Neon
npx prisma db push                              # создаёт таблицы (User, Session, KV) в Neon
node ../deploy/seed-to-db.js                    # заливает store.json/history/и т.д. в Neon
```
Пользователей (если есть) перенести отдельно:
```powershell
# дамп старой базы -> восстановление в Neon (только если в старой БД есть пользователи)
pg_dump "СТАРЫЙ_DATABASE_URL" --data-only -t "User" -t "Session" > users.sql
psql "postgresql://...neon..." -f users.sql
```

## 3. Render (бэкенд)
1. Регистрация на **render.com** (GitHub, без карты).
2. New → **Web Service** → подключи GitLab-репозиторий (или GitHub-зеркало).
3. Настройки:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node index.js`
   - **Environment**: добавь все переменные из `backend/.env`, но:
     - `KV_STORE=db`   ← ВКЛючает Postgres-хранилище
     - `DATABASE_URL=...neon...`
     - `GROQ_API_KEY`, `GEMINI_API_KEY`, `JWT_SECRET`, `APIPAY_*`, `TELEGRAM_*`, `PRICE_*`
     - `FRONTEND_URL=https://<твой-vercel-домен>` (для CORS)
     - **НЕ** ставь `MT5_BRIDGE_URL`
4. Deploy. Получишь URL вида `https://rbhood-back.onrender.com`.
   ⚠️ Free-сервис «засыпает» после 15 мин простоя (первый запрос ~30-60с). Держать тёплым — пинговать через UptimeRobot (бесплатно) каждые 10 мин на `/health`.

## 4. Vercel (фронтенд)
1. Регистрация на **vercel.com** (GitHub, без карты).
2. Import Project → репозиторий (Root = корень, это Next.js).
3. **Environment Variable**: `NEXT_PUBLIC_API_URL=https://rbhood-back.onrender.com`
4. Deploy. Получишь `https://<проект>.vercel.app`.

## 5. Домен ai.rbhood.kz
- В Vercel → Project → Settings → Domains → добавь `ai.rbhood.kz`, следуй инструкции (CNAME/A).
- Обнови `FRONTEND_URL` в Render на финальный домен, redeploy бэка.

## 6. Проверка и выключение старого
- Открой сайт: логин, анализ (крипта/форекс/акция), история, оплата-тест, админка (контент на месте — подтянулся из Neon).
- Всё ок → выключай старый Vultr Windows-сервер. **$50 + $15 → $0.**
