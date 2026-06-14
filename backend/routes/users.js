const router = require("express").Router();
const prisma = require("../lib/prisma");
const authMiddleware = require("../middleware/auth");

const adminOnly = (req, res, next) => {
  if (req.user.role !== "ADMIN") return res.status(403).json({ error: "Forbidden" });
  next();
};

// GET /api/users — только для админа
router.get("/", authMiddleware, adminOnly, async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, plan: true, role: true, active: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

// PATCH /api/users/:id — изменить план/роль/статус
router.patch("/:id", authMiddleware, adminOnly, async (req, res) => {
  const { plan, role, active } = req.body;
  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { ...(plan && { plan }), ...(role && { role }), ...(active !== undefined && { active }) },
    select: { id: true, email: true, name: true, plan: true, role: true, active: true },
  });
  res.json(user);
});

// DELETE /api/users/:id
router.delete("/:id", authMiddleware, adminOnly, async (req, res) => {
  await prisma.user.delete({ where: { id: Number(req.params.id) } });
  res.json({ ok: true });
});

module.exports = router;
