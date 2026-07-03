const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");

const sign = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, plan: u.plan, role: u.role, avatar: u.avatar });

// POST /api/auth/register
router.post("/register", [
  body("email").isEmail().normalizeEmail(),
  body("name").trim().notEmpty(),
  body("password").isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, name, password } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: "Email already in use" });

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { email, name, password: hash } });

    const token = sign(user.id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.password) return res.status(401).json({ error: "Use Google sign-in for this account" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });

    if (!user.active) return res.status(403).json({ error: "Account disabled" });

    const token = sign(user.id);
    res.json({ token, user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/google — вход/регистрация через Google ID-токен
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "credential required" });
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ error: "Google sign-in not configured" });

  try {
    // Проверяем ID-токен через публичный endpoint Google tokeninfo.
    // Устойчиво на облачных IP: не требует загрузки сертификатов /oauth2/v1/certs,
    // которые Google отдаёт Render'у с 403. Google сам валидирует подпись и срок.
    const info = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!info.ok) throw new Error("tokeninfo " + info.status);
    const p = await info.json();
    if (p.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("audience mismatch");
    if (p.email_verified !== true && p.email_verified !== "true") throw new Error("email not verified");
    if (!p.email) throw new Error("no email in token");
    const email = p.email;
    const name = p.name || email.split("@")[0];
    const googleId = p.sub;
    const picture = p.picture || null;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name, googleId, avatar: picture } });
    } else if (!user.googleId || (picture && !user.avatar)) {
      // привязываем googleId и подставляем фото, если у пользователя ещё нет аватара
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: user.googleId || googleId, ...(picture && !user.avatar ? { avatar: picture } : {}) },
      });
    }
    if (!user.active) return res.status(403).json({ error: "Account disabled" });

    res.json({ token: sign(user.id), user: publicUser(user) });
  } catch (e) {
    console.error("google auth:", e.message);
    res.status(401).json({ error: "Invalid Google token" });
  }
});

// GET /api/auth/me
router.get("/me", require("../middleware/auth"), (req, res) => {
  const { id, email, name, plan, role, avatar, createdAt } = req.user;
  res.json({ id, email, name, plan, role, avatar, createdAt });
});

// PATCH /api/auth/me — обновить имя и/или аватар (для текущего пользователя)
router.patch("/me", require("../middleware/auth"), async (req, res) => {
  const { name, avatar } = req.body;
  const data = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim();
  if (typeof avatar === "string") data.avatar = avatar || null; // пустая строка = убрать аватар
  if (Object.keys(data).length === 0) return res.status(400).json({ error: "Нечего обновлять" });
  try {
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json(publicUser(user));
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", require("../middleware/auth"), (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
