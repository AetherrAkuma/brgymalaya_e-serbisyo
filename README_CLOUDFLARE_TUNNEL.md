# E-Serbisyo Deployment Guide

## Mode 1: Local LAN (Offline) — Default

Run on your local PC within the Barangay Hall network. No internet required.

**Double-click `start-system.bat`** → access at `http://localhost:5173`

For other LAN devices, use `http://<server-ip>:5173`.

---

## Mode 2: Online Tunnel (Cloudflare Quick Tunnel)

Expose the system publicly for QR verification, demos, or remote access.

**Double-click `start-system.bat`** — it will:
1. Start backend on port 3000
2. Start a Cloudflare Quick Tunnel → gets a `https://*.trycloudflare.com` URL for the API
3. Start frontend on port 5173 with the tunnel API URL pre-configured
4. Start a Quick Tunnel for the frontend
5. Display both public URLs

### Manual Tunnel (Backend only)

```powershell
cd server
npm run tunnel
```

This runs `cloudflared tunnel --url http://127.0.0.1:3000`.

---

## Requirements

Place `cloudflared.exe` in the project root folder (download from [github.com/cloudflare/cloudflared/releases](https://github.com/cloudflare/cloudflared/releases)).
