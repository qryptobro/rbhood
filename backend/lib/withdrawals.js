const persist = require("./persist");

// Запросы партнёров на вывод средств (ключ "withdrawals"):
// { items: [ { id, userId, email, name, amount, card, status: "pending"|"paid", requestedAt, paidAt } ] }
const read = () => persist.getJSON("withdrawals", { items: [] });
const write = (d) => persist.setJSON("withdrawals", d);

function list() { return read().items.slice().sort((a, b) => b.requestedAt - a.requestedAt); }
function listForUser(userId) { return list().filter(i => i.userId === userId); }

function create({ userId, email, name, amount, card }) {
  const data = read();
  const item = { id: Date.now(), userId, email, name, amount, card, status: "pending", requestedAt: Date.now(), paidAt: null };
  data.items.push(item);
  write(data);
  return item;
}

function markPaid(id) {
  const data = read();
  const it = data.items.find(i => String(i.id) === String(id));
  if (!it) return false;
  it.status = "paid";
  it.paidAt = Date.now();
  write(data);
  return true;
}

// Суммы по пользователю: выплачено и в ожидании
function sums(userId) {
  let paid = 0, pending = 0;
  for (const i of read().items) {
    if (i.userId !== userId) continue;
    if (i.status === "paid") paid += i.amount;
    else pending += i.amount;
  }
  return { paid, pending };
}

module.exports = { list, listForUser, create, markPaid, sums };
