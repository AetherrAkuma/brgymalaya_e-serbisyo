@echo off
title E-Serbisyo System (Cloudflare Tunnel)
cd /d "%~dp0"

powershell -NoProfile -ExecutionPolicy Bypass -File "start-system.ps1"
pause
