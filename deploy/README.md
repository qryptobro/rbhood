# Деплой rbhood-ai на Windows-сервер

Всё крутится на одном Windows-сервере: терминал FxPro MT5 + MT5-мост (Python) + backend (Node) + frontend (Next.js) + Caddy (reverse proxy + HTTPS).

```
Интернет → Caddy (:443, ai.rbhood.kz)
              ├─ /api/*  → backend (Node :4000)
              └─ /*      → frontend (Next.js :3000)
backend → MT5-мост (Python :5001) → терминал FxPro MT5
```

## 0. Что поставить на сервере
- Node.js 20+
- Python 3.10+
- Git
- Терминал **FxPro MT5** (залогинен в счёт, автозапуск)
- Caddy (https://caddyserver.com/download) — для HTTPS

## 1. Код
```powershell
git clone https://gitlab.com/daulet880324/rbhood-ai.git
cd rbhood-ai
npm install
cd backend; npm install; cd ..
pip install -r mt5-bridge\requirements.txt
```

## 2. Переменные
- В корень положи `.env.local` с `NEXT_PUBLIC_API_URL=https://ai.rbhood.kz`
- Backend env: задай в системных переменных или в службе (см. `deploy/.env.production.example`)

## 3. Сборка frontend
```powershell
npm run build
```

## 4. DNS
В панели домена rbhood.kz добавь A-запись:
```
ai.rbhood.kz  →  <IP Windows-сервера>
```

## 5. Firewall
Открой порты 80 и 443 (для Caddy/Let's Encrypt). Порты 3000/4000/5001 наружу НЕ открывать.

## 6. Запуск (тест)
1. Открой и залогинь терминал FxPro MT5.
2. `powershell deploy\start-all.ps1`
3. `caddy run --config deploy\Caddyfile`
4. Открой https://ai.rbhood.kz

## 7. Прод: автозапуск через NSSM (чтобы пережить перезагрузку)
Скачай NSSM (https://nssm.cc), затем для каждого сервиса:
```powershell
nssm install rbhood-mt5    "python"  "C:\...\rbhood-ai\mt5-bridge\server.py"
nssm install rbhood-back   "node"    "C:\...\rbhood-ai\backend\index.js"
nssm install rbhood-front  "npm"     "run start"   # AppDirectory = корень проекта
nssm install rbhood-caddy  "caddy"   "run --config C:\...\rbhood-ai\deploy\Caddyfile"
```
Для каждой службы задай env-переменные (`nssm set rbhood-back AppEnvironmentExtra ...`) и AppDirectory.
Терминал FxPro добавь в автозагрузку Windows с авто-логином.

## Важно
- Терминал FxPro должен быть **запущен и залогинен** — иначе MT5-мост не отдаёт данные.
- Юридические страницы (`/legal/*`) — шаблон, проверь у юриста.
- Админ-данные (инструменты, брокеры, отзывы) хранятся в localStorage браузера, не на сервере.
