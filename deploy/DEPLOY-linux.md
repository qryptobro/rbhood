# Деплой rbhood-ai на бесплатный Linux (Oracle Always Free)

Одна Ubuntu 22.04 машина держит всё: фронт (Next :3000), бэк (Express :4000),
PostgreSQL и Caddy (HTTPS). MT5 не нужен — данные из Binance/Yahoo.

## 0. Требования
- Oracle Always Free инстанс **VM.Standard.A1.Flex** (ARM), Ubuntu 22.04, ≥6 ГБ RAM.
- В OCI-консоли в **Security List** подсети открыть ingress TCP **80** и **443** (0.0.0.0/0).
- SSH-доступ: `ssh ubuntu@<PUBLIC_IP>`.

## 1. Установка окружения
```bash
git clone https://gitlab.com/daulet880324/rbhood-ai.git ~/rbhood-ai
cd ~/rbhood-ai
bash deploy/setup-ubuntu.sh
```

## 2. Переменные окружения
`backend/.env` (перенеси с текущего сервера, но **без `MT5_BRIDGE_URL`**):
```
PORT=4000
JWT_SECRET=<длинный секрет>
DATABASE_URL=postgresql://rbhood:rbhood_pass@localhost:5432/rbhood
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AQ...
# платежи/уведомления — перенеси свои:
APIPAY_API_KEY=...
APIPAY_WEBHOOK_SECRET=...
PRICE_MONTHLY_KZT=19990
PRICE_LIFETIME_KZT=89990
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```
`.env.local` в корне (для сборки фронта):
```
NEXT_PUBLIC_API_URL=https://ai.rbhood.kz
```

## 3. Зависимости, база, сборка
```bash
cd ~/rbhood-ai
npm install
cd backend && npm install && npx prisma generate && npx prisma db push && cd ..
npm run build          # сборка Next (может занять пару минут)
```

## 4. Запуск через PM2
```bash
cd ~/rbhood-ai
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup            # выполни команду, которую он подскажет (автозапуск после ребута)
```

## 5. Caddy (HTTPS)
```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl reload caddy
```
Caddy сам получит сертификат Let's Encrypt для ai.rbhood.kz (после того как DNS укажет сюда).

## 6. DNS
В панели домена переведи A-запись `ai.rbhood.kz` на **PUBLIC_IP** нового сервера.
Дождись обновления (`ping ai.rbhood.kz` покажет новый IP), затем `sudo systemctl reload caddy`.

## 7. Перенос данных со старого сервера
- JSON-хранилища: скопируй `backend/data/*.json` (store.json, history/, referrals.json, usage.json и т.д.).
- База (если есть данные пользователей): на старом `pg_dump`, на новом `psql ... < dump.sql`.

## 8. Проверка и выключение старого
- Открой https://ai.rbhood.kz — логин, анализ актива, оплата-тест.
- Всё ок → выключай старый Vultr Windows-сервер ($50/мес → $0).
