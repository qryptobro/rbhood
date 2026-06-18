const fs = require("fs");
const path = require("path");

// Учёт партнёрских комиссий по промокодам.
// pending.json   — счета с промокодом, ещё не оплаченные: { invoiceId: { promo, partner, commissionPct, amount } }
// referrals.json — итог: { processed: {invoiceId:true}, codes: { CODE: { partner, sales, revenue, commission, paidOut, items:[] } } }
const DIR = path.join(__dirname, "..", "data");
const PENDING = path.join(DIR, "pay-pending.json");
const REFS = path.join(DIR, "referrals.json");
try { fs.mkdirSync(DIR, { recursive: true }); } catch { /* ignore */ }

const read = (f, def) => { try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf8")) || def; } catch { /* ignore */ } return def; };
const write = (f, d) => { try { fs.writeFileSync(f, JSON.stringify(d), "utf8"); } catch { /* ignore */ } };

// Зафиксировать «ожидающий» счёт с промокодом (при создании счёта Kaspi)
function setPending(invoiceId, rec) {
  if (!invoiceId || !rec?.promo) return;
  const p = read(PENDING, {});
  p[String(invoiceId)] = rec;
  write(PENDING, p);
}

// Начислить комиссию партнёру при оплате (идемпотентно — по invoiceId)
function credit(invoiceId) {
  const id = String(invoiceId || "");
  if (!id) return;
  const refs = read(REFS, { processed: {}, codes: {} });
  if (refs.processed[id]) return;            // уже обработан
  const pending = read(PENDING, {});
  const rec = pending[id];
  if (!rec) return;                          // счёт без промокода — не наша забота

  refs.processed[id] = true;
  const code = String(rec.promo).toUpperCase();
  const c = refs.codes[code] || (refs.codes[code] = { partner: "", sales: 0, revenue: 0, commission: 0, paidOut: 0, items: [] });
  const commission = Math.round((rec.amount || 0) * (Number(rec.commissionPct) || 0) / 100);
  if (rec.partner) c.partner = rec.partner;
  c.sales += 1;
  c.revenue += rec.amount || 0;
  c.commission += commission;
  c.items.push({ invoiceId: id, amount: rec.amount || 0, commission, date: Date.now() });
  write(REFS, refs);

  delete pending[id];
  write(PENDING, pending);
}

// Сводка по всем партнёрским кодам
function summary() {
  const refs = read(REFS, { processed: {}, codes: {} });
  return Object.entries(refs.codes).map(([code, c]) => ({
    code,
    partner: c.partner || "",
    sales: c.sales || 0,
    revenue: c.revenue || 0,
    commission: c.commission || 0,
    paidOut: c.paidOut || 0,
    owed: Math.max(0, (c.commission || 0) - (c.paidOut || 0)),
  })).sort((a, b) => b.owed - a.owed);
}

// Статистика по конкретным кодам (для кабинета партнёра)
function forCodes(codes) {
  const refs = read(REFS, { processed: {}, codes: {} });
  return (codes || []).map((code) => {
    const c = refs.codes[String(code).toUpperCase()] || {};
    return { code: String(code).toUpperCase(), sales: c.sales || 0, revenue: c.revenue || 0, commission: c.commission || 0 };
  });
}

// Отметить комиссию выплаченной (всю накопленную по коду)
function payout(code) {
  const refs = read(REFS, { processed: {}, codes: {} });
  const c = refs.codes[String(code).toUpperCase()];
  if (!c) return false;
  c.paidOut = c.commission;
  write(REFS, refs);
  return true;
}

module.exports = { setPending, credit, summary, payout, forCodes };
