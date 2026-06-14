const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "rbhood-backend" });
});

// Место для будущих роутов
// app.use("/api/auth", require("./routes/auth"));
// app.use("/api/users", require("./routes/users"));

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
