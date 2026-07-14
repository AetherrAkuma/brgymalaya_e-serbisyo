$ErrorActionPreference = "SilentlyContinue"

# ─── Auto-elevate to Admin (needed for hosts file DNS fix) ──────────────────
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "[!] This script needs Administrator privileges to fix tunnel DNS resolution." -ForegroundColor Yellow
    Write-Host "[!] Restarting as Administrator..." -ForegroundColor Yellow
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "powershell.exe"
    $psi.Arguments = "-NoProfile -ExecutionPolicy Bypass -File `"" + $MyInvocation.MyCommand.Path + "`""
    $psi.Verb = "runas"
    $proc = [System.Diagnostics.Process]::Start($psi)
    if ($proc) { Start-Sleep -Seconds 2; Exit } else { Write-Host "[-] Failed to elevate. Run the script as Administrator manually." -ForegroundColor Red }
}

# ─── CONFIG ─────────────────────────────────────────────────────────────────
# ─── Locate cloudflared.exe (ONLY accept/search root folder, auto-download if missing) ───
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$cloudflared = Join-Path $projectRoot "cloudflared.exe"
$nodeDir = try { (Get-Command node).Source | Split-Path } catch { "C:\Program Files\nodejs" }

if (-not (Test-Path $cloudflared)) {
    Write-Host "" 
    Write-Host "=====================================================" -ForegroundColor Yellow
    Write-Host "  cloudflared.exe not found in root folder." -ForegroundColor Yellow
    Write-Host "=====================================================" -ForegroundColor Yellow

    # Check if cloudflared is already installed elsewhere on the system so we can copy it to root
    $tempPath = $null
    $knownPaths = @(
        "C:\Program Files (x86)\cloudflared\cloudflared.exe",
        "C:\Program Files\cloudflared\cloudflared.exe",
        "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe"
    )
    foreach ($p in $knownPaths) {
        if (Test-Path $p) {
            $tempPath = $p
            break
        }
    }
    if (-not $tempPath) {
        $inPath = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
        if ($inPath) { $tempPath = $inPath }
    }

    if ($tempPath) {
        Write-Host "[*] Found cloudflared installed on system at: $tempPath" -ForegroundColor Gray
        Write-Host "[*] Copying cloudflared.exe to the root folder..." -ForegroundColor Gray
        Copy-Item -Path $tempPath -Destination $cloudflared -Force
    } else {
        # Check if winget is available
        if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
            Write-Host "[-] winget is not available on this machine." -ForegroundColor Red
            Write-Host "    Please download cloudflared.exe manually and place it in the project root folder." -ForegroundColor Red
            Read-Host "Press Enter to exit"
            Exit
        }

        Write-Host "[*] Downloading and installing cloudflared via winget..." -ForegroundColor Gray
        winget install --id Cloudflare.cloudflared -e --silent --accept-source-agreements --accept-package-agreements

        # Refresh PATH in current session
        $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" +
                    [System.Environment]::GetEnvironmentVariable("PATH", "User")

        # Find it again
        foreach ($p in $knownPaths) {
            if (Test-Path $p) {
                $tempPath = $p
                break
            }
        }
        if (-not $tempPath) {
            $inPath = (Get-Command cloudflared -ErrorAction SilentlyContinue).Source
            if ($inPath) { $tempPath = $inPath }
        }

        if ($tempPath) {
            Write-Host "[*] Copying downloaded cloudflared.exe to the root folder..." -ForegroundColor Gray
            Copy-Item -Path $tempPath -Destination $cloudflared -Force
        }
    }

    if (-not (Test-Path $cloudflared)) {
        Write-Host "[-] cloudflared.exe could not be placed in the root folder." -ForegroundColor Red
        Write-Host "    Please place cloudflared.exe manually in the root folder." -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        Exit
    }

    Write-Host "[+] cloudflared.exe successfully copied to the root folder." -ForegroundColor Green
    Write-Host ""
}

function Set-EnvFileValue {
    param(
        [string]$FilePath,
        [string]$Key,
        [string]$Value
    )

    $utf8NoBom = New-Object System.Text.UTF8Encoding $false

    if (-not (Test-Path $FilePath)) {
        [System.IO.File]::WriteAllLines($FilePath, @("$Key=$Value"), $utf8NoBom)
        return
    }

    $lines = [System.IO.File]::ReadAllLines($FilePath, [System.Text.Encoding]::UTF8)
    $updated = $false

    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match "^\s*$([regex]::Escape($Key))\s*=") {
            $lines[$i] = "$Key=$Value"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        $lines += "$Key=$Value"
    }

    [System.IO.File]::WriteAllLines($FilePath, $lines, $utf8NoBom)
}

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "   E-SERBISYO SYSTEM START (Cloudflare Tunnel)" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# 1. Clean up
Write-Host "[*] Stopping existing processes..." -ForegroundColor Gray
Stop-Process -Name "node","cloudflared" -Force 2>$null
Start-Sleep -Seconds 1

# 2. Start Backend Tunnel
Write-Host "[*] Starting Cloudflare Tunnel for Backend..." -ForegroundColor Gray
$backendLog = "$env:TEMP\cf-backend.log"
Remove-Item $backendLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$cloudflared' tunnel --url http://127.0.0.1:3000 --loglevel info 2>&1 | Tee-Object -FilePath '$backendLog'" -WindowStyle Minimized

# 3. Poll for backend tunnel URL
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
    Write-Host "[-] Backend tunnel did not produce a public URL. Check the log: $backendLog" -ForegroundColor Red
    if (Test-Path $backendLog) { Get-Content $backendLog -Tail 40 }
    Read-Host "Press Enter to exit"; Exit
}

# Helper: ensure tunnel hostname has IPv4 DNS resolution via hosts file
Function Add-HostEntryForTunnel {
    param([string]$TunnelUrl)
    $hostname = ($TunnelUrl -replace 'https://','' -replace '/.*','').Trim()
    # Check if hostname already resolves to an IPv4 address
    $hasIpv4 = $false
    try { $records = [System.Net.Dns]::GetHostEntry($hostname); $hasIpv4 = ($records.AddressList | Where-Object { $_.AddressFamily -eq 'InterNetwork' }).Count -gt 0 } catch {}
    if ($hasIpv4) { Write-Host "[+] DNS OK ($hostname resolves to IPv4)" -ForegroundColor Green; return }
    # Only AAAA (IPv6) records — resolve trycloudflare.com for its IPv4 anycast IP
    try {
        $cfIpv4 = (Resolve-DnsName "trycloudflare.com" -Type A -ErrorAction Stop)[0].IPAddress
        $hostsPath = "$env:SystemRoot\System32\drivers\etc\hosts"
        $existing = Get-Content $hostsPath -ErrorAction SilentlyContinue
        $entry = "$cfIpv4  $hostname  # E-Serbisyo tunnel (auto-added)"
        if ($existing -match [regex]::Escape($hostname)) {
            Write-Host "[+] Hosts entry already exists for $hostname" -ForegroundColor Green
        } else {
            Add-Content -Path $hostsPath -Value $entry
            Write-Host "[+] Added hosts entry: $entry" -ForegroundColor Green
            # Flush DNS cache
            ipconfig /flushdns 2>$null | Out-Null
        }
    } catch {
        Write-Host "[-] Could not add hosts entry: $_" -ForegroundColor Red
        Write-Host "[-] Run this script AS ADMINISTRATOR to enable tunnel DNS fix" -ForegroundColor Yellow
    }
}

# Fix DNS for backend tunnel
Add-HostEntryForTunnel -TunnelUrl $backendUrl

# 4. Start Frontend (Port 5173)
$clientEnv = Join-Path $projectRoot "client/.env"
Set-EnvFileValue -FilePath $clientEnv -Key "VITE_API_BASE_URL" -Value "$backendUrl/api/v1"
Write-Host "[+] Updated client/.env with VITE_API_BASE_URL=$backendUrl/api/v1" -ForegroundColor Green
Write-Host "[*] Starting Frontend (Port 5173)..." -ForegroundColor Gray
$clientDir = Join-Path $projectRoot "client"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$nodeDir;'+`$env:PATH; `$Host.UI.RawUI.WindowTitle='Vite Client'; Set-Location '$clientDir'; npm run dev" -WindowStyle Minimized

# 5. Start Frontend Tunnel
Write-Host "[*] Starting Cloudflare Tunnel for Frontend..." -ForegroundColor Gray
$frontendLog = "$env:TEMP\cf-frontend.log"
Remove-Item $frontendLog -Force -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$cloudflared' tunnel --url http://127.0.0.1:5173 --loglevel info 2>&1 | Tee-Object -FilePath '$frontendLog'" -WindowStyle Minimized

# 6. Poll for frontend tunnel URL
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

if (-not $frontendUrl) {
    Write-Host "[-] Frontend tunnel did not produce a public URL. Check the log: $frontendLog" -ForegroundColor Red
    if (Test-Path $frontendLog) { Get-Content $frontendLog -Tail 40 }
    Read-Host "Press Enter to exit"; Exit
}

# Fix DNS for frontend tunnel
Add-HostEntryForTunnel -TunnelUrl $frontendUrl
$frontendBaseUrl = $frontendUrl.TrimEnd('/')

# 7. Update server .env and start backend with correct frontend URL
$serverEnv = Join-Path $projectRoot "server/.env"
Set-EnvFileValue -FilePath $serverEnv -Key "FRONTEND_BASE_URL" -Value $frontendBaseUrl
Set-EnvFileValue -FilePath $serverEnv -Key "PUBLIC_FRONTEND_URL" -Value $frontendBaseUrl
Set-EnvFileValue -FilePath $serverEnv -Key "VERIFICATION_BASE_URL" -Value "$frontendBaseUrl/verify"
Write-Host "[+] Updated server/.env with frontend URL: $frontendBaseUrl" -ForegroundColor Green

# 8. Start Backend
Write-Host "[*] Starting Backend (Port 3000)..." -ForegroundColor Gray
$serverDir = Join-Path $projectRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$nodeDir;'+`$env:PATH; `$Host.UI.RawUI.WindowTitle='Express API'; `$env:PORT='3000'; `$env:RUN_CRON='true'; `$env:FRONTEND_BASE_URL='$frontendBaseUrl'; `$env:PUBLIC_FRONTEND_URL='$frontendBaseUrl'; `$env:VERIFICATION_BASE_URL='$frontendBaseUrl/verify'; Set-Location '$serverDir'; npx nodemon server.js" -WindowStyle Minimized

# 9. Health Check (wait for backend to boot)
Write-Host "[*] Waiting for backend to start..." -ForegroundColor Gray
Start-Sleep -Seconds 8
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
Write-Host "API Base URL  : $backendUrl/api/v1" -ForegroundColor Gray
Write-Host "To shut down  : Stop-Process -Name node,cloudflared -Force" -ForegroundColor Yellow
Write-Host "====================================================" -ForegroundColor Cyan

Read-Host "Press Enter to exit"
