const fs = require("fs");
const path = require("path");

// Промокоды, созданные самими партнёрами. Условия фиксированы системой (не меняются партнёром).
// backend/data/partner-codes.json -> { items: [ { code, email, name, createdAt } ] }
const DIR = path.join(__dirname, "..", "data");
const FILE = path.join(DIR, "partner-codes.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

// Фиксированные условия (можно поменять через env)
const DISCOUNT = Number(process.env.PARTNER_DISCOUNT_PERCENT || 10);    // скидка клиенту, %
const COMMISSION = Number(process.env.PARTNER_COMMISSION_PERCENT || 30); // комиссия партнёру, %
const MAX_PER_USER = Number(process.env.PARTNER_MAX_CODES || 3);

const read = () => { try { if (fs.existsSync(FILE)) return JSON.parse(fs.readFileSync(FILE, "utf8")) || { items: [] }; } catch { /* ignore */ } return { items: [] }; };
const write = (d) => { try { fs.writeFileSync(FILE, JSON.stringify(d), "utf8"); } catch { /* ignore */ } };

// Привести запись к виду промокода (как в админ-сторе)
const toPromo = (it) => ({
  code: String(it.code).toUpperCase(),
  type: "percent",
  value: DISCOUNT,
  commission: COMMISSION,
  partner: it.name || "",
  partnerEmail: String(it.email || "").toLowerCase(),
  active: true,
});

function findByCode(code) {
  const c = String(code || "").trim().toUpperCase();
  const it = read().items.find(i => String(i.code).toUpperCase() === c);
  return it ? toPromo(it) : null;
}

function forEmail(email) {
  const e = String(email || "").toLowerCase();
  return read().items.filter(i => String(i.email || "").toLowerCase() === e).map(toPromo);
}

function countForEmail(email) {
  const e = String(email || "").toLowerCase();
  return read().items.filter(i => String(i.email || "").toLowerCase() === e).length;
}

function add({ code, email, name }) {
  const data = read();
  data.items.push({ code: String(code).toUpperCase(), email: String(email).toLowerCase(), name: name || "", createdAt: Date.now() });
  write(data);
}

const config = () => ({ discount: DISCOUNT, commission: COMMISSION, maxPerUser: MAX_PER_USER });

module.exports = { findByCode, forEmail, countForEmail, add, config };
