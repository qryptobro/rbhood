const persist = require("./persist");

// Промокоды, созданные самими партнёрами (ключ "partner-codes"): { items: [ { code, email, name, createdAt } ] }
// Условия фиксированы системой (не меняются партнёром).
const DISCOUNT = Number(process.env.PARTNER_DISCOUNT_PERCENT || 10);    // скидка клиенту, %
const COMMISSION = Number(process.env.PARTNER_COMMISSION_PERCENT || 30); // комиссия партнёру, %
const MAX_PER_USER = Number(process.env.PARTNER_MAX_CODES || 3);

const read = () => persist.getJSON("partner-codes", { items: [] });
const write = (d) => persist.setJSON("partner-codes", d);

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

// Все созданные партнёрами коды (для админки)
function listAll() {
  return read().items.slice().sort((a, b) => b.createdAt - a.createdAt);
}

module.exports = { findByCode, forEmail, countForEmail, add, config, listAll };
