$ErrorActionPreference = "SilentlyContinue"

# ─── CONFIG ─────────────────────────────────────────────────────────────────
$cloudflared = ".\cloudflared.exe"
if (-not (Test-Path $cloudflared)) {
    $cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
    if (-not (Test-Path $cloudflared)) {
        $cloudflared = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
        if (-not $cloudflared) {
            Write-Host "[-] cloudflared.exe not found. Place it in the project root." -ForegroundColor Red
            Exit
        }
    }
}

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   E-SERBISYO SYSTEM START (Cloudflare Tunnel)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Clean up
Write-Host "[*] Stopping existing processes..." -ForegroundColor Gray
Stop-Process -Name "node","cloudflared" -Force 2>$null
Start-Sleep -Seconds 1

# 2. Start Backend
Write-Host "[*] Starting Backend (Port 3000)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Express API'; `$env:PORT='3000'; `$env:RUN_CRON='true'; npx nodemon server.js" -WorkingDirectory "server" -WindowStyle Minimized

# 3. Start Backend Tunnel
Write-Host "[*] Starting Cloudflare Tunnel for Backend..." -ForegroundColor Gray
$backendLog = "$env:TEMP\cf-backend.log"
Remove-Item $backendLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$cloudflared' tunnel --url http://127.0.0.1:3000 --loglevel info 2>&1 | Tee-Object -FilePath '$backendLog'" -WindowStyle Minimized

# 4. Poll for backend tunnel URL
Write-Host "Waiting for backend tunnel..." -ForegroundColor Yellow
$backendUrl = $null
for ($i = 0; $i -lt 90 -and -not $backendUrl; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $backendLog) {
        $content = Get-Content $backendLog -Raw
        if ($content -match 'https://([\w-]+\.trycloudflare\.com)') {
            $backendUrl = $matches[0].TrimEnd('/')
            Write-Host ""; Write-Host "[+] Backend Tunnel: $backendUrl" -ForegroundColor Green
        }
    }
    Write-Host "." -NoNewline
}
Write-Host ""

if (-not $backendUrl) {
    Write-Host "[-] Backend tunnel failed. Check: $backendLog" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    Exit
}

# 5. Start Frontend with backend tunnel URL injected
Write-Host "[*] Starting Frontend (Port 5173)..." -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle='Vite Client'; `$env:VITE_API_BASE_URL='$backendUrl/api/v1'; npm run dev" -WorkingDirectory "client" -WindowStyle Minimized

# 6. Start Frontend Tunnel
Write-Host "[*] Starting Cloudflare Tunnel for Frontend..." -ForegroundColor Gray
$frontendLog = "$env:TEMP\cf-frontend.log"
Remove-Item $frontendLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$cloudflared' tunnel --url http://127.0.0.1:5173 --loglevel info 2>&1 | Tee-Object -FilePath '$frontendLog'" -WindowStyle Minimized

# 7. Poll for frontend tunnel URL
Write-Host "Waiting for frontend tunnel..." -ForegroundColor Yellow
$frontendUrl = $null
for ($i = 0; $i -lt 90 -and -not $frontendUrl; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $frontendLog) {
        $content = Get-Content $frontendLog -Raw
        if ($content -match 'https://([\w-]+\.trycloudflare\.com)') {
            $frontendUrl = $matches[0].TrimEnd('/')
            Write-Host ""; Write-Host "[+] Frontend Tunnel: $frontendUrl" -ForegroundColor Green
        }
    }
    Write-Host "." -NoNewline
}
Write-Host ""

# 8. Update server .env with frontend tunnel URL (for QR codes)
if ($frontendUrl) {
    $serverEnv = "server\.env"
    (Get-Content $serverEnv) -replace 'VERIFICATION_BASE_URL=.*', "VERIFICATION_BASE_URL=$frontendUrl/verify" | Set-Content $serverEnv
    Write-Host "[+] Updated server\.env VERIFICATION_BASE_URL = $frontendUrl/verify" -ForegroundColor Green
}

# 9. Health Check
$status = "OFFLINE"
try {
    $res = Invoke-RestMethod -Uri "$backendUrl/api/v1/health" -Method Get -TimeoutSec 5
    if ($res.status -eq "OK") { $status = "ONLINE" }
} catch {}

# 10. Display
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "              SYSTEM IS RUNNING" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Backend    : $status" -ForegroundColor $(if($status -eq "ONLINE"){"Green"}else{"Red"})
Write-Host "Public API : $backendUrl" -ForegroundColor Yellow
Write-Host "Public App : $frontendUrl" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "Local Backend : http://localhost:3000" -ForegroundColor White
Write-Host "Local Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "API Base URL for frontend builds: $backendUrl/api/v1" -ForegroundColor Gray
Write-Host "To shut down: Stop-Process -Name node,cloudflared -Force" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
