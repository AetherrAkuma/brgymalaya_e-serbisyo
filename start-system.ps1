# E-Serbisyo Clustered Environment Controller
# Run this script to start all services (API Node instances, Vite Frontend, and Caddy Proxy) 
# and verify their status automatically.

$ErrorActionPreference = "SilentlyContinue"

# Define local configurations
$caddyUrl = "https://caddyserver.com/api/download?os=windows&arch=amd64"
$caddyExe = "caddy.exe"
$caddyfile = "Caddyfile"

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   E-SERBISYO CLUSTERED ENVIRONMENT CONTROLLER" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Download Caddy if missing
if (-not (Test-Path $caddyExe)) {
    Write-Host "[*] Caddy executable not found in root. Downloading..." -ForegroundColor Yellow
    curl.exe -L -o $caddyExe $caddyUrl
    if (Test-Path $caddyExe) {
        Write-Host "[+] Caddy downloaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "[-] Failed to download Caddy. Please check internet connection." -ForegroundColor Red
        Exit
    }
}

# 2. Check if Caddyfile exists
if (-not (Test-Path $caddyfile)) {
    Write-Host "[-] Caddyfile not found in root. Please create it first." -ForegroundColor Red
    Exit
}

# 3. Clean up any existing instances from previous runs to prevent port conflicts
Write-Host "[*] Stopping any existing Node or Caddy processes to prevent conflicts..." -ForegroundColor Gray
Stop-Process -Name "node" -Force 2>$null
Stop-Process -Name "caddy" -Force 2>$null
Start-Sleep -Seconds 1

# 4. Launch Backend Instance A (Port 3000, Cron Enabled)
Write-Host "[*] Starting Backend Instance A (Port 3000, cron: active)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Express API - Port 3000'; `$env:PORT='3000'; `$env:RUN_CRON='true'; node server.js" -WorkingDirectory "server" -WindowStyle Minimized

# 5. Launch Backend Instance B (Port 3001, Cron Disabled)
Write-Host "[*] Starting Backend Instance B (Port 3001, cron: inactive)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Express API - Port 3001'; `$env:PORT='3001'; `$env:RUN_CRON='false'; node server.js" -WorkingDirectory "server" -WindowStyle Minimized

# 6. Launch Vite Client (Port 5173)
Write-Host "[*] Starting Vite Client Frontend (Port 5173)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Vite Client'; npm run dev" -WorkingDirectory "client" -WindowStyle Minimized

# 7. Launch Caddy Reverse Proxy & Load Balancer
Write-Host "[*] Starting Caddy Proxy Load Balancer..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Caddy Proxy'; .\caddy.exe run --config ./Caddyfile" -WorkingDirectory "." -WindowStyle Minimized

# 8. Wait for initialization
Write-Host ""
Write-Host "Waiting 8 seconds for database and servers to initialize..." -ForegroundColor Yellow
for ($i = 8; $i -gt 0; $i--) {
    Write-Host "$i..." -NoNewline
    Start-Sleep -Seconds 1
}
Write-Host "Starting health probes..."

# 9. Perform HTTP Health Probes
$statusBackend3000 = "OFFLINE"
$statusBackend3001 = "OFFLINE"
$statusCaddyLB = "OFFLINE"
$statusCaddyPortal = "OFFLINE"

try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/v1/health" -Method Get -TimeoutSec 3
    if ($res.status -eq "OK") { $statusBackend3000 = "ONLINE (Cron Active)" }
} catch {}

try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:3001/api/v1/health" -Method Get -TimeoutSec 3
    if ($res.status -eq "OK") { $statusBackend3001 = "ONLINE (Cron Disabled)" }
} catch {}

try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:8081/api/v1/health" -Method Get -TimeoutSec 3
    if ($res.status -eq "OK") { $statusCaddyLB = "ONLINE (Load Balanced)" }
} catch {}

try {
    $res = Invoke-WebRequest -Uri "http://127.0.0.1:8080" -Method Get -TimeoutSec 3 -UseBasicParsing
    if ($res.StatusCode -eq 200) { $statusCaddyPortal = "ONLINE" }
} catch {}

# 10. Display Status Dashboard
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "              SERVICES HEALTH STATUS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# Service 1
if ($statusBackend3000 -like "ONLINE*") {
    Write-Host "[PASS] Node Backend A (Port 3000): " -NoNewline -ForegroundColor Green
    Write-Host $statusBackend3000 -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node Backend A (Port 3000): " -NoNewline -ForegroundColor Red
    Write-Host $statusBackend3000 -ForegroundColor Red
}

# Service 2
if ($statusBackend3001 -like "ONLINE*") {
    Write-Host "[PASS] Node Backend B (Port 3001): " -NoNewline -ForegroundColor Green
    Write-Host $statusBackend3001 -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node Backend B (Port 3001): " -NoNewline -ForegroundColor Red
    Write-Host $statusBackend3001 -ForegroundColor Red
}

# Service 3
if ($statusCaddyLB -eq "ONLINE (Load Balanced)") {
    Write-Host "[PASS] Caddy LB Endpoint (Port 8081): " -NoNewline -ForegroundColor Green
    Write-Host $statusCaddyLB -ForegroundColor Green
} else {
    Write-Host "[FAIL] Caddy LB Endpoint (Port 8081): " -NoNewline -ForegroundColor Red
    Write-Host $statusCaddyLB -ForegroundColor Red
}

# Service 4
if ($statusCaddyPortal -eq "ONLINE") {
    Write-Host "[PASS] Caddy Portal Proxy (Port 8080): " -NoNewline -ForegroundColor Green
    Write-Host $statusCaddyPortal -ForegroundColor Green
} else {
    Write-Host "[FAIL] Caddy Portal Proxy (Port 8080): " -NoNewline -ForegroundColor Red
    Write-Host $statusCaddyPortal -ForegroundColor Red
}

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Access Client Portal: http://localhost:8080" -ForegroundColor White
Write-Host "Access API Gateway  : http://localhost:8081" -ForegroundColor White
Write-Host "To shut down all services, close the minimized windows or run: " -ForegroundColor Gray
Write-Host "Stop-Process -Name node,caddy -Force" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
