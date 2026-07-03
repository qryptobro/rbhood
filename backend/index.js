// Грузим backend/.env независимо от рабочей директории сервиса
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
// Вебхук apipay нуждается в СЫРОМ теле для проверки HMAC — до express.json
app.use("/api/payments/webhook", express.raw({ type: "*/*" }));
app.use(express.json({ limit: "12mb" })); // иконки/логотипы base64 крупные

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "rbhood-backend" });
});

// Auth/users routes require PostgreSQL — skip if no DATABASE_URL
if (process.env.DATABASE_URL) {
  app.use("/api/auth",     require("./routes/auth"));
  app.use("/api/users",    require("./routes/users"));
  app.use("/api/payments", require("./routes/payments"));
  app.use("/api/history",  require("./routes/history"));
  app.use("/api/analytics",require("./routes/analytics"));
  app.use("/api/referrals",require("./routes/referrals"));
  app.use("/api/partner",  require("./routes/partner"));
  app.use("/api/withdrawals", require("./routes/withdrawals"));
  app.use("/api/signals",  require("./routes/signals"));
  app.use("/api/marathon", require("./routes/marathon"));
} else {
  console.warn("DATABASE_URL not set — auth/users routes disabled");
}

app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/quotes",   require("./routes/quotes"));
app.use("/api/state",    require("./routes/state"));

// Грузим key-value хранилища (Postgres в проде) ДО старта, затем слушаем порт
require("./lib/persist").init().finally(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
});

// Марафон и аналитика сигналов отключены (снижение нагрузки на MT5/LLM).
// Чтобы вернуть — раскомментируй блок ниже.
// if (Number(PORT) === 4000) {
//   try { require("./services/signalScheduler").start(); }
//   catch (e) { console.warn("signal scheduler:", e.message); }
//   try { require("./services/marathon").start(); }
//   catch (e) { console.warn("marathon:", e.message); }
// }
