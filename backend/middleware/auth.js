const jwt = require("jsonwebtoken");
const prisma = require("../lib/prisma");
const devices = require("../lib/devices");

module.exports = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.active) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    try { devices.record(user.id, req); } catch { /* учёт не должен ломать запрос */ }
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};
