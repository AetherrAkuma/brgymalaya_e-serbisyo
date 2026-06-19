$ErrorActionPreference = "SilentlyContinue"

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   E-SERBISYO SYSTEM START (Cloudflare Tunnel)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Clean up any existing processes
Write-Host "[*] Stopping any existing Node or cloudflared processes..." -ForegroundColor Gray
Stop-Process -Name "node" -Force 2>$null
Stop-Process -Name "cloudflared" -Force 2>$null
Start-Sleep -Seconds 1

# 2. Start Backend (Port 3000)
Write-Host "[*] Starting Backend (Port 3000)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Express API - Port 3000'; `$env:PORT='3000'; `$env:RUN_CRON='true'; node server.js" -WorkingDirectory "server" -WindowStyle Minimized

# 3. Start Vite Frontend (Port 5173)
Write-Host "[*] Starting Vite Frontend (Port 5173)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Vite Client'; npm run dev" -WorkingDirectory "client" -WindowStyle Minimized

# Wait for servers to initialize
Write-Host ""
Write-Host "Waiting 8 seconds for servers to initialize..." -ForegroundColor Yellow
for ($i = 8; $i -gt 0; $i--) {
    Write-Host "$i..." -NoNewline
    Start-Sleep -Seconds 1
}

# 4. Start Cloudflare Quick Tunnel for Backend
Write-Host ""
Write-Host "[*] Starting Cloudflare Tunnel for Backend (port 3000)..." -ForegroundColor Gray
$backendTunnelLog = "$env:TEMP\cloudflared-backend.log"
Remove-Item -Path $backendTunnelLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --url http://127.0.0.1:3000 --loglevel info 2>&1 | Tee-Object -FilePath '$backendTunnelLog'" -WindowStyle Minimized

# 5. Start Cloudflare Quick Tunnel for Frontend
Write-Host "[*] Starting Cloudflare Tunnel for Frontend (port 5173)..." -ForegroundColor Gray
$frontendTunnelLog = "$env:TEMP\cloudflared-frontend.log"
Remove-Item -Path $frontendTunnelLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& 'C:\Program Files (x86)\cloudflared\cloudflared.exe' tunnel --url http://127.0.0.1:5173 --loglevel info 2>&1 | Tee-Object -FilePath '$frontendTunnelLog'" -WindowStyle Minimized

# 6. Poll logs until tunnel URLs appear (up to 90 seconds)
Write-Host "Waiting for tunnels to connect (may take up to 90s)..." -ForegroundColor Yellow

$backendUrl = $null
$frontendUrl = $null
$maxWait = 90
for ($i = 0; $i -lt $maxWait; $i++) {
    if (-not $backendUrl -and (Test-Path $backendTunnelLog)) {
        $logContent = Get-Content $backendTunnelLog -Raw
        if ($logContent -match 'https://([\w-]+\.trycloudflare\.com)') {
            $backendUrl = $matches[0]
            Write-Host ""; Write-Host "[+] Backend Tunnel URL: $backendUrl" -ForegroundColor Green
        }
    }
    if (-not $frontendUrl -and (Test-Path $frontendTunnelLog)) {
        $logContent = Get-Content $frontendTunnelLog -Raw
        if ($logContent -match 'https://([\w-]+\.trycloudflare\.com)') {
            $frontendUrl = $matches[0]
            Write-Host ""; Write-Host "[+] Frontend Tunnel URL: $frontendUrl" -ForegroundColor Green
        }
    }
    if ($backendUrl -and $frontendUrl) { break }
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 1
}
Write-Host ""

# 7. Update .env files with tunnel URLs if found
$clientEnv = "client\.env"
$serverEnv = "server\.env"

if ($backendUrl) {
    # Strip trailing slash if present
    $backendUrl = $backendUrl.TrimEnd('/')
    $newApiUrl = "$backendUrl/api/v1"
    (Get-Content $clientEnv) -replace 'VITE_API_BASE_URL=.*', "VITE_API_BASE_URL=$newApiUrl" | Set-Content $clientEnv
    Write-Host "[+] Updated client\.env VITE_API_BASE_URL = $newApiUrl" -ForegroundColor Green
} else {
    Write-Host "[-] Could not detect Backend Tunnel URL. Check logs: $backendTunnelLog" -ForegroundColor Red
}

if ($frontendUrl) {
    $frontendUrl = $frontendUrl.TrimEnd('/')
    $newVerifyUrl = "$frontendUrl/verify"
    (Get-Content $serverEnv) -replace 'VERIFICATION_BASE_URL=.*', "VERIFICATION_BASE_URL=$newVerifyUrl" | Set-Content $serverEnv
    Write-Host "[+] Updated server\.env VERIFICATION_BASE_URL = $newVerifyUrl" -ForegroundColor Green
} else {
    Write-Host "[-] Could not detect Frontend Tunnel URL. Check logs: $frontendTunnelLog" -ForegroundColor Red
}

# 8. Perform Health Check (via localhost)
$statusBackend = "OFFLINE"
try {
    $res = Invoke-RestMethod -Uri "http://127.0.0.1:3000/api/v1/health" -Method Get -TimeoutSec 3
    if ($res.status -eq "OK") { $statusBackend = "ONLINE" }
} catch {}

# 9. Display Dashboard
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "              SERVICES HEALTH STATUS" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

if ($statusBackend -eq "ONLINE") {
    Write-Host "[PASS] Backend (Port 3000): " -NoNewline -ForegroundColor Green
    Write-Host $statusBackend -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend (Port 3000): " -NoNewline -ForegroundColor Red
    Write-Host $statusBackend -ForegroundColor Red
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "ACCESS INFORMATION" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Local Backend  : http://localhost:3000" -ForegroundColor White
Write-Host "Local Frontend : http://localhost:5173" -ForegroundColor White
if ($backendUrl) { Write-Host "Public API     : $backendUrl" -ForegroundColor Yellow }
if ($frontendUrl) { Write-Host "Public Portal  : $frontendUrl" -ForegroundColor Yellow }
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "To shut down all services, close the minimized windows" -ForegroundColor Gray
Write-Host "or run: Stop-Process -Name node,cloudflared -Force" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

# Keep script alive
Read-Host "Press Enter to exit"
