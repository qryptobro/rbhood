const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "rbhood-backend" });
});

// Auth/users routes require PostgreSQL — skip if no DATABASE_URL
if (process.env.DATABASE_URL) {
  app.use("/api/auth",  require("./routes/auth"));
  app.use("/api/users", require("./routes/users"));
} else {
  console.warn("DATABASE_URL not set — auth/users routes disabled");
}

app.use("/api/analysis", require("./routes/analysis"));
app.use("/api/quotes",   require("./routes/quotes"));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
