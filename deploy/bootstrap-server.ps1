# bootstrap-server.ps1 — полная автоустановка rbhood-ai на чистом Windows-сервере.
# Запускать на СЕРВЕРЕ (по RDP), в PowerShell ОТ ИМЕНИ АДМИНИСТРАТОРА.
#
# Пример:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   .\bootstrap-server.ps1 -OpenRouterKey "sk-or-v1-..." -Domain "ai.rbhood.kz"
#
# ЧТО ДЕЛАЕТ САМ: Chocolatey, Node, Python, Git, Caddy, NSSM, клон репо,
# npm/pip install, сборка frontend, службы автозапуска, firewall 80/443.
#
# ЧТО НУЖНО СДЕЛАТЬ РУКАМИ (GUI/логин — не автоматизируется):
#   1) Установить терминал FxPro MT5 и войти в счёт (fxpro.com → MetaTrader 5).
#   2) В DNS rbhood.kz добавить A-запись: <Domain> → IP этого сервера.

param(
  [Parameter(Mandatory=$true)][string]$OpenRouterKey,
  [string]$Domain   = "ai.rbhood.kz",
  [string]$RepoUrl  = "https://gitlab.com/daulet880324/rbhood-ai.git",
  [string]$InstallDir = "C:\rbhood-ai",
  [string]$AlphaVantageKey = "Z569YIZCPUD189AL"
)

$ErrorActionPreference = "Stop"
function Step($m) { Write-Host "`n=== $m ===" -ForegroundColor Green }

# ── 1. Chocolatey ──
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
  Step "Установка Chocolatey"
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = 3072
  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  $env:Path += ";C:\ProgramData\chocolatey\bin"
}

# ── 2. Пакеты ──
Step "Установка Node, Python, Git, Caddy, NSSM"
choco install -y nodejs-lts python git caddy nssm
# обновляем PATH в текущей сессии
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# ── 3. Клон / обновление репо ──
Step "Клонирование репозитория"
if (Test-Path $InstallDir) {
  cd $InstallDir; git pull
} else {
  git clone $RepoUrl $InstallDir
  cd $InstallDir
}

# ── 4. Зависимости ──
Step "npm install (root + backend) + pip (мост)"
npm install
cd "$InstallDir\backend"; npm install; cd $InstallDir
python -m pip install -r "$InstallDir\mt5-bridge\requirements.txt"

# ── 5. .env.local для frontend + сборка ──
Step "Сборка frontend"
"NEXT_PUBLIC_API_URL=https://$Domain" | Out-File -Encoding utf8 "$InstallDir\.env.local"
npm run build

# ── 6. Caddyfile с доменом ──
Step "Caddyfile"
@"
$Domain {
	encode gzip
	handle /api/* { reverse_proxy 127.0.0.1:4000 }
	handle { reverse_proxy 127.0.0.1:3000 }
}
"@ | Out-File -Encoding ascii "$InstallDir\deploy\Caddyfile.prod"

# ── 7. Службы через NSSM (автозапуск, переживают перезагрузку) ──
Step "Регистрация служб (NSSM)"
$node   = (Get-Command node).Source
$npm    = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source; if (-not $npm) { $npm = (Get-Command npm).Source }
$python = (Get-Command python).Source
$caddy  = (Get-Command caddy).Source

function Reg($name, $exe, $args, $dir, $env) {
  & nssm stop $name 2>$null; & nssm remove $name confirm 2>$null
  & nssm install $name $exe $args
  & nssm set $name AppDirectory $dir
  if ($env) { & nssm set $name AppEnvironmentExtra $env }
  & nssm set $name Start SERVICE_AUTO_START
  & nssm start $name
}

Reg "rbhood-mt5"   $python "`"$InstallDir\mt5-bridge\server.py`"" "$InstallDir\mt5-bridge" $null
Reg "rbhood-back"  $node   "`"$InstallDir\backend\index.js`""    "$InstallDir\backend" @(
  "OPENROUTER_API_KEY=$OpenRouterKey",
  "ALPHA_VANTAGE_KEY=$AlphaVantageKey",
  "MT5_BRIDGE_URL=http://127.0.0.1:5001",
  "PORT=4000"
)
Reg "rbhood-front" $npm    "run start"                            $InstallDir $null
Reg "rbhood-caddy" $caddy  "run --config `"$InstallDir\deploy\Caddyfile.prod`"" $InstallDir $null

# ── 8. Firewall ──
Step "Открытие портов 80/443"
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null

Write-Host "`n================ ГОТОВО ================" -ForegroundColor Green
Write-Host "Осталось вручную:" -ForegroundColor Yellow
Write-Host "  1) Установить и залогинить терминал FxPro MT5 (fxpro.com → MetaTrader 5)."
Write-Host "  2) DNS: A-запись $Domain -> IP этого сервера."
Write-Host "После этого открой https://$Domain"
