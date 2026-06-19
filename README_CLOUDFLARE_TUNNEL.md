# Cloudflare Tunnel Setup Guide

This guide explains how to expose your local **E-Serbisyo Barangay System** to the internet using Cloudflare Quick Tunnel — **no domain or account required**.

---

## Quick Start (Recommended)

Double-click **`start-system.bat`** at the project root. This starts the backend, frontend, and Cloudflare tunnels automatically, then displays your public URLs.

---

## Manual Setup

### 1. Install Cloudflared

```powershell
winget install --id Cloudflare.cloudflared
```

Or download the MSI from [github.com/cloudflare/cloudflared/releases](https://github.com/cloudflare/cloudflared/releases).

> After installation, if `cloudflared` is not recognized, add `C:\Program Files (x86)\cloudflared` to your system PATH or use the full path: `"C:\Program Files (x86)\cloudflared\cloudflared.exe"`.

### 2. Start the servers

```powershell
# Terminal 1: Backend
cd server
npm start

# Terminal 2: Frontend
cd client
npm run dev
```

### 3. Start the tunnels

```powershell
# If cloudflared is not in PATH, use the full path:
# "C:\Program Files (x86)\cloudflared\cloudflared.exe"

# Terminal 3: Backend tunnel
cloudflared tunnel --url http://127.0.0.1:3000

# Terminal 4: Frontend tunnel
cloudflared tunnel --url http://127.0.0.1:5173
```

Each tunnel outputs a URL like `https://random-name.trycloudflare.com`.

### 4. Update environment files

```powershell
# client/.env
VITE_API_BASE_URL=https://<backend-tunnel-url>/api/v1

# server/.env
VERIFICATION_BASE_URL=https://<frontend-tunnel-url>/verify
```

---

## Quick Tunnel (One Service)

To expose just the backend (e.g., for API testing):

```powershell
cd server
npm run tunnel
```

This runs `cloudflared tunnel --url http://127.0.0.1:3000` (uses the full path to the executable).

---

## Important Notes

- **URLs change every restart** — the `start-system.ps1` script detects the new URLs and updates `.env` files automatically.
- **HTTPS is handled by Cloudflare** — no need for local SSL certificates.
- **Camera/QR scanning** works on any device accessing the tunnel URL (HTTPS).
- **Free and unlimited** — no credit card required for Quick Tunnel.
