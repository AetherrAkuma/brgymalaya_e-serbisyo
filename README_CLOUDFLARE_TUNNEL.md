# Cloudflare Tunnel Setup & Verification Guide

This guide explains how to expose your local **E-Serbisyo Barangay System** server (backend on port 3000, frontend on port 5173) to the internet using Cloudflare Tunnels or free temporary tunnels (like Localtunnel).

Exposing the system is required to:
1. Enable **webcam QR scanning** on mobile phones and external browsers (which requires HTTPS security).
2. Allow external verification of Barangay certificates via stamped QR codes in the PDF templates.

---

## Option 1: Quick Tunnel (Free & No Account Required)
If you just want to quickly test the QR scanner or verify pages from your phone, you can run a temporary tunnel:

### A. Exposing the Backend (For API calls & verification links)
1. Run the local backend server:
   ```bash
   cd server
   npm start
   ```
2. Open a new terminal window and run:
   ```bash
   npm run tunnel
   ```
   *This commands runs `npx localtunnel --port 3000`, which gives you a public address like `https://glowing-elk-83.localtunnel.me`.*
3. Copy this public URL.

### B. Exposing the Frontend (For phone/camera scanning)
1. In another terminal, expose port 5173 (Vite Client):
   ```bash
   npx localtunnel --port 5173
   ```
2. Copy the generated frontend HTTPS address. Open this URL on your phone or tablet to scan physical certificates!

### C. Environmental Config Updates
Make sure to update your environment files to sync URLs:
- In [client/.env](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/client/.env), update the API base URL to point to your public backend URL:
  ```env
  VITE_API_BASE_URL=https://<your-public-backend-url>/api/v1
  ```
- In [server/.env](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/.env), update the verification base URL so printed QR codes point to your public frontend:
  ```env
  VERIFICATION_BASE_URL=https://<your-public-frontend-url>/verify
  ```

---

## Option 2: Permanent Cloudflare Tunnel (Recommended for Staging)
To set up a stable, professional, and free tunnel with your own domain using Cloudflare:

### 1. Install Cloudflared
- Download the Windows MSI installer from the [official Cloudflare website](https://github.com/cloudflare/cloudflared/releases).
- Or install using **winget** in PowerShell:
  ```powershell
  winget install --id Cloudflare.cloudflared
  ```

### 2. Authenticate Cloudflared
Run this command in your command prompt/PowerShell:
```bash
cloudflared tunnel login
```
*This opens a browser window. Log in to your Cloudflare account and select your domain (e.g., `brgy143.gov.ph` or a free domain).*

### 3. Create a Tunnel
Create a tunnel named `barangay-tunnel`:
```bash
cloudflared tunnel create barangay-tunnel
```
*This generates a JSON credentials file on your computer and output a Tunnel ID.*

### 4. Configure the Tunnel
Create a file named `config.yml` inside your `.cloudflared` folder (usually located in `%USERPROFILE%\.cloudflared\config.yml` on Windows):
```yaml
tunnel: <TUNNEL_ID>
credentials-file: C:\Users\<Username>\.cloudflared\<TUNNEL_ID>.json

ingress:
  - hostname: api.brgy143.gov.ph
    service: http://localhost:3000
  - hostname: portal.brgy143.gov.ph
    service: http://localhost:5173
  - service: http_status:404
```

### 5. Route Traffic (DNS Rules)
Add DNS records pointing your domains to the tunnel:
```bash
cloudflared tunnel route dns barangay-tunnel api.brgy143.gov.ph
cloudflared tunnel route dns barangay-tunnel portal.brgy143.gov.ph
```

### 6. Run the Tunnel
Run your tunnel to establish the secure connection:
```bash
cloudflared tunnel run barangay-tunnel
```
You can now access your portal at `https://portal.brgy143.gov.ph` and backend endpoints at `https://api.brgy143.gov.ph/api/v1` safely!
Update your `.env` variables to match these domains.
