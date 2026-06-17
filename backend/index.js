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
} else {
  console.warn("DATABASE_URL not set — auth/users routes disabled");
}

app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/quotes",   require("./routes/quotes"));
app.use("/api/state",    require("./routes/state"));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
