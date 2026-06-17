@echo off
title E-Serbisyo Clustered Environment Controller
cd /d "%~dp0"

:: Download Caddy if missing from root
if not exist caddy.exe (
    echo [*] caddy.exe not found in root. Downloading...
    curl.exe -L -o caddy.exe "https://caddyserver.com/api/download?os=windows&arch=amd64"
    if exist caddy.exe (
        echo [+] Caddy downloaded successfully!
    ) else (
        echo [-] Failed to download Caddy. Please check internet connection.
        pause
        exit /b 1
    )
)

powershell -NoProfile -ExecutionPolicy Bypass -File "start-system.ps1"
pause
