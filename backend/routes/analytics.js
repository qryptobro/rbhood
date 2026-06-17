const router = require("express").Router();
const prisma = require("../lib/prisma");
const auth = require("../middleware/auth");
const { readUsage } = require("../lib/usage");

const COST_PER_REQUEST = Number(process.env.COST_PER_REQUEST_USD || 0.001);

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/analytics — расход по пользователям (только админ)
router.get("/", auth, adminOnly, async (req, res) => {
  const usage = readUsage(); // { userId: count }
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, plan: true },
  });
  const byId = new Map(users.map(u => [String(u.id), u]));

  // строки по всем, у кого есть запросы; плюс известные пользователи
  const ids = new Set([...Object.keys(usage), ...users.map(u => String(u.id))]);
  const rows = [...ids].map(id => {
    const u = byId.get(id);
    const requests = usage[id] || 0;
    return {
      id: Number(id),
      name: u?.name || "—",
      email: u?.email || `#${id}`,
      plan: u?.plan || "—",
      requests,
      cost: +(requests * COST_PER_REQUEST).toFixed(4),
    };
  }).sort((a, b) => b.requests - a.requests);

  const totalRequests = rows.reduce((s, r) => s + r.requests, 0);
  res.json({
    costPerRequest: COST_PER_REQUEST,
    totalRequests,
    totalCost: +(totalRequests * COST_PER_REQUEST).toFixed(4),
    rows,
  });
});

module.exports = router;
