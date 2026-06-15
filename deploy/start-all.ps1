# start-all.ps1 — ручной запуск всех сервисов на Windows-сервере (для теста).
# Для прода лучше оформить как Windows-службы через NSSM (см. deploy/README.md).
# Перед запуском: терминал FxPro MT5 должен быть открыт и залогинен.

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent

# Переменные окружения backend
$env:OPENROUTER_API_KEY = $env:OPENROUTER_API_KEY  # подставь или задай в системе
$env:ALPHA_VANTAGE_KEY  = "Z569YIZCPUD189AL"
$env:MT5_BRIDGE_URL     = "http://127.0.0.1:5001"
$env:PORT               = "4000"

Write-Host "1/3 MT5-мост (Python, :5001)..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\mt5-bridge'; python server.py"

Start-Sleep -Seconds 3

Write-Host "2/3 Backend (Node, :4000)..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\backend'; node index.js"

Write-Host "3/3 Frontend (Next.js, :3000)..."
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root'; npm run start"

Write-Host "Готово. Caddy запусти отдельно: caddy run --config deploy\Caddyfile"
