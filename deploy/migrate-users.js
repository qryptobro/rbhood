// Перенос пользователей из старой БД в новую (Neon) с сохранением id.
// OLD берётся из backend/.env (текущая база), NEW — из process.env.DATABASE_URL (ты выставил Neon).
// Запуск на старом сервере:  node ../deploy/migrate-users.js   (из папки backend)
const fs = require("fs");
const path = require("path");
// @prisma/client лежит в backend/node_modules — резолвим оттуда
const { PrismaClient } = require(path.join(__dirname, "..", "backend", "node_modules", "@prisma", "client"));

// OLD: сначала из $env:OLD_DATABASE_URL, иначе из backend/.env
let OLD = process.env.OLD_DATABASE_URL;
if (!OLD) {
  try {
    const envTxt = fs.readFileSync(path.join(__dirname, "..", "backend", ".env"), "utf8");
    OLD = (envTxt.match(/^DATABASE_URL=(.+)$/m) || [])[1]?.trim().replace(/^["']|["']$/g, "");
  } catch { /* ignore */ }
}
const NEW = process.env.DATABASE_URL;

if (!OLD || !NEW || OLD === NEW) {
  console.error("Нужно: OLD (DATABASE_URL в backend/.env) и NEW ($env:DATABASE_URL=Neon), и они должны различаться.");
  process.exit(1);
}

const oldDb = new PrismaClient({ datasourceUrl: OLD });
const newDb = new PrismaClient({ datasourceUrl: NEW });

(async () => {
  const users = await oldDb.user.findMany();
  for (const u of users) {
    const data = { ...u }; delete data.updatedAt; // updatedAt проставится автоматически
    await newDb.user.upsert({ where: { id: u.id }, update: {}, create: data });
  }
  if (users.length) {
    const maxId = Math.max(...users.map(u => u.id));
    await newDb.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"','id'), ${maxId})`);
  }
  console.log("✅ перенесено пользователей:", users.length);
  await oldDb.$disconnect(); await newDb.$disconnect();
})().catch(e => { console.error(e); process.exit(1); });
