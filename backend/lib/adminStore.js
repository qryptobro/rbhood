const persist = require("./persist");

// Чтение промокодов из админ-стора (ключ "store", поле state.promos)
function readPromos() {
  const parsed = persist.getJSON("store", null);
  const promos = parsed?.state?.promos;
  return Array.isArray(promos) ? promos : [];
}

module.exports = { readPromos };
