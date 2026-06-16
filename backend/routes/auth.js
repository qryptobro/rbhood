const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const { OAuth2Client } = require("google-auth-library");
const prisma = require("../lib/prisma");

const sign = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name, plan: u.plan, role: u.role });

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
    res.status(201).json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role } });
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
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role } });
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
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const p = ticket.getPayload();
    const email = p.email;
    const name = p.name || email.split("@")[0];
    const googleId = p.sub;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({ data: { email, name, googleId } });
    } else if (!user.googleId) {
      user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
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
  const { id, email, name, plan, role, createdAt } = req.user;
  res.json({ id, email, name, plan, role, createdAt });
});

// POST /api/auth/logout
router.post("/logout", require("../middleware/auth"), (req, res) => {
  res.json({ ok: true });
});

module.exports = router;
