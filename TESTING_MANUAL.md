# E-Serbisyo Verification Test Guide

Use this guide to test the newly integrated Email SMTP, QR Document Scanner, and Cloudflare Tunnel features yourself.

---

## 🧪 Test 1: Email SMTP Verification
This script tests your backend SMTP settings (Gmail App Passwords, Mailtrap, Resend, etc.) directly from your terminal.

1. Open a terminal in the `server` folder.
2. Run the test script followed by a recipient email address:
   ```bash
   node test-smtp.js your-personal-email@example.com
   ```
3. Check the command output:
   * If `EMAIL_SERVICE_ENABLED=true` and settings are correct, it will print `SUCCESS!` and send an email to your address.
   * If `EMAIL_SERVICE_ENABLED=false`, it will log a simulated email to the console without sending.
   * If there are authentication/connection issues, it will capture and print the error from Nodemailer.

---

## 🧪 Test 2: QR Document Scanner Verification
This script inserts a dummy authentic document in your database and generates a physical QR image file (`test-qr.png`) at your project root. You can then upload this image in your browser to verify it.

1. Open a terminal in the `server` folder.
2. Run the seeder script:
   ```bash
   node test-qr-seed.js
   ```
3. You will see a `test-qr.png` file created in your root directory.
4. Open your browser and navigate to the verification page:
   `http://localhost:5173/verify`
5. Go to the **Upload Image** tab.
6. Click **Select Document QR Image** and choose the generated `test-qr.png` file from your project root.
7. Confirm that it immediately displays a green card: **"DOCUMENT VERIFIED AUTHENTIC"** with the resident name: *Maria Dela Cruz*.

---

## 🧪 Test 3: Online Tunnel Verification
This test verifies that the system can be exposed over the internet via Cloudflare Tunnel (needed for remote QR verification).

1. Run `start-system.bat` — it automatically starts two tunnels.
2. Wait for the tunnel URLs to appear in the console (may take up to 90 seconds).
3. Open the **Public App** URL on any device with internet — the frontend should load over HTTPS.
4. Open the **Public API** URL — `/api/v1/health` should return a JSON health status.
5. The tunnel URLs change each restart; the script handles this automatically.
