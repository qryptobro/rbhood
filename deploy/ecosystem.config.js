// PM2: держит бэкенд (4000) и фронт (3000) запущенными + автозапуск после ребута.
// Путь предполагает клон в /home/ubuntu/rbhood-ai (пользователь ubuntu на Oracle).
const ROOT = process.env.RBHOOD_ROOT || "/home/ubuntu/rbhood-ai";

module.exports = {
  apps: [
    {
      name: "rbhood-back",
      cwd: ROOT + "/backend",
      script: "index.js",
      env: { NODE_ENV: "production", PORT: 4000 },
      max_restarts: 20,
    },
    {
      name: "rbhood-front",
      cwd: ROOT,
      script: "npm",
      args: "start",           // next start, слушает PORT
      env: { NODE_ENV: "production", PORT: 3000 },
      max_restarts: 20,
    },
  ],
};
