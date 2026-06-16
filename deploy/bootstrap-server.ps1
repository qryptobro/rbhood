# bootstrap-server.ps1 - full auto-install of rbhood-ai on a clean Windows server.
# Run ON THE SERVER (via RDP), in PowerShell AS ADMINISTRATOR.
#
# Example:
#   Set-ExecutionPolicy Bypass -Scope Process -Force
#   .\bootstrap-server.ps1 -OpenRouterKey "sk-or-v1-..." -Domain "ai.rbhood.kz"
#
# DOES AUTOMATICALLY: Chocolatey, Node, Python, Caddy, NSSM, deps, build,
# autostart services, firewall 80/443.
# DO MANUALLY: install + login FxPro MT5; add DNS A-record Domain -> server IP.

param(
  [Parameter(Mandatory=$true)][string]$OpenRouterKey,
  [string]$Domain   = "ai.rbhood.kz",
  [string]$RepoUrl  = "https://gitlab.com/daulet880324/rbhood-ai.git",
  [string]$InstallDir = "C:\rbhood-ai",
  [string]$AlphaVantageKey = "Z569YIZCPUD189AL"
)

$ErrorActionPreference = "Stop"
function Step($m) { Write-Host "`n=== $m ===" -ForegroundColor Green }

# 1. Chocolatey
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
  Step "Installing Chocolatey"
  Set-ExecutionPolicy Bypass -Scope Process -Force
  [System.Net.ServicePointManager]::SecurityProtocol = 3072
  iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
  $env:Path += ";C:\ProgramData\chocolatey\bin"
}

# 2. Packages
Step "Installing Node, Python, Caddy, NSSM"
choco install -y nodejs-lts python caddy nssm
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 3. Repo (already cloned? pull. else clone)
Step "Repo"
if (Test-Path "$InstallDir\.git") {
  cd $InstallDir; git pull
} elseif (-not (Test-Path $InstallDir)) {
  git clone $RepoUrl $InstallDir
}
cd $InstallDir

# 4. Dependencies
Step "Installing dependencies (npm + pip)"
npm install
cd "$InstallDir\backend"; npm install; cd $InstallDir
python -m pip install -r "$InstallDir\mt5-bridge\requirements.txt"

# 5. Frontend env + build
Step "Building frontend"
"NEXT_PUBLIC_API_URL=https://$Domain" | Out-File -Encoding utf8 "$InstallDir\.env.local"
npm run build

# 6. Caddyfile with domain
Step "Writing Caddyfile"
@"
$Domain {
	encode gzip
	handle /api/* {
		reverse_proxy 127.0.0.1:4000
	}
	handle {
		reverse_proxy 127.0.0.1:3000
	}
}
"@ | Out-File -Encoding ascii "$InstallDir\deploy\Caddyfile.prod"

# 7. Services via NSSM (auto-start, survive reboot)
Step "Registering services (NSSM)"
$ErrorActionPreference = "Continue"  # nssm stop/remove on a missing service is fine
$node   = (Get-Command node).Source
$npm    = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source; if (-not $npm) { $npm = (Get-Command npm).Source }
$python = (Get-Command python).Source
$caddy  = (Get-Command caddy).Source

function Reg($name, $exe, $args, $dir, $envArr) {
  nssm stop $name 2>&1 | Out-Null
  nssm remove $name confirm 2>&1 | Out-Null
  nssm install $name $exe $args 2>&1 | Out-Null
  nssm set $name AppDirectory $dir 2>&1 | Out-Null
  if ($envArr) { nssm set $name AppEnvironmentExtra $envArr 2>&1 | Out-Null }
  nssm set $name Start SERVICE_AUTO_START 2>&1 | Out-Null
  nssm start $name 2>&1 | Out-Null
  Write-Host "  $name : registered" -ForegroundColor Cyan
}

Reg "rbhood-mt5"   $python "`"$InstallDir\mt5-bridge\server.py`"" "$InstallDir\mt5-bridge" $null
Reg "rbhood-back"  $node   "`"$InstallDir\backend\index.js`""    "$InstallDir\backend" @(
  "OPENROUTER_API_KEY=$OpenRouterKey",
  "ALPHA_VANTAGE_KEY=$AlphaVantageKey",
  "MT5_BRIDGE_URL=http://127.0.0.1:5001",
  "PORT=4000"
)
Reg "rbhood-front" $npm    "run start"  $InstallDir $null
Reg "rbhood-caddy" $caddy  "run --config `"$InstallDir\deploy\Caddyfile.prod`"" $InstallDir $null

# 8. Firewall
Step "Opening ports 80/443"
New-NetFirewallRule -DisplayName "HTTP"  -Direction Inbound -Protocol TCP -LocalPort 80  -Action Allow -ErrorAction SilentlyContinue | Out-Null
New-NetFirewallRule -DisplayName "HTTPS" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue | Out-Null

Write-Host "`n================ DONE ================" -ForegroundColor Green
Write-Host "Manual steps left:" -ForegroundColor Yellow
Write-Host "  1) Install and login FxPro MT5 terminal (fxpro.com -> MetaTrader 5)."
Write-Host "  2) DNS: A-record $Domain -> this server IP."
Write-Host "Then open https://$Domain"
