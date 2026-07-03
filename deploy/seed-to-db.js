// Разовый импорт файловых хранилищ backend/data/*.json в Postgres (таблица KV).
// Запускать на СТАРОМ сервере, где лежат данные, указав DATABASE_URL новой базы (Neon):
//   cd backend
//   $env:DATABASE_URL="postgresql://...neon..."; node ../deploy/seed-to-db.js   (PowerShell)
//   DATABASE_URL="postgresql://...neon..." node ../deploy/seed-to-db.js          (bash)
// Предварительно: npx prisma db push (создаст таблицы, включая KV) на эту же базу.
const fs = require("fs");
const path = require("path");
// @prisma/client лежит в backend/node_modules — резолвим оттуда
const { PrismaClient } = require(path.join(__dirname, "..", "backend", "node_modules", "@prisma", "client"));
const prisma = new PrismaClient();

const DATA = path.join(__dirname, "..", "backend", "data");

async function up(key, value) {
  await prisma.kV.upsert({ where: { key }, update: { value }, create: { key, value } });
  console.log("seeded", key, `(${value.length} b)`);
}

(async () => {
  const flat = ["store", "usage", "referrals", "pay-pending", "withdrawals", "partner-codes", "devices", "notified"];
  for (const key of flat) {
    const p = path.join(DATA, `${key}.json`);
    if (fs.existsSync(p)) await up(key, fs.readFileSync(p, "utf8"));
  }
  const hdir = path.join(DATA, "history");
  if (fs.existsSync(hdir)) {
    for (const f of fs.readdirSync(hdir)) {
      if (f.endsWith(".json")) await up(`history:${f.replace(/\.json$/, "")}`, fs.readFileSync(path.join(hdir, f), "utf8"));
    }
  }
  await prisma.$disconnect();
  console.log("✅ done");
})().catch(e => { console.error(e); process.exit(1); });
