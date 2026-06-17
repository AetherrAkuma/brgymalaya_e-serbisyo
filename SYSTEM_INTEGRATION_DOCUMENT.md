# E-Serbisyo Barangay System: Integration & Customization Documentation

This document provides complete instructions for developers and administrators to manage, customize, test, and deploy the E-Serbisyo system's new core integrations: **Nodemailer SMTP Service**, **Dynamic QR Document Scanner**, **Scheduled Database & File Backups**, and **Multipart ID Verification Registration**.

---

## 📂 Table of Contents
1. [Core Features Overview](#-core-features-overview)
2. [Default Credentials & Test Accounts](#-default-credentials--test-accounts)
3. [Environment Configuration & Setup](#-environment-configuration--setup)
4. [Verification & Manual Test Procedures](#-verification--manual-test-procedures)
5. [Developer Customization Guide (Emails & Backups)](#-developer-customization-guide-emails--backups)
6. [Technitium Split-Horizon DNS & Local SSL Proxy Setup](#-technitium-split-horizon-dns--local-ssl-proxy-setup)


---

## 🌟 Core Features Overview

| Feature | Description | File References |
| :--- | :--- | :--- |
| **Email SMTP Service** | Sends real-time HTML notifications for account status changes, document payments, processing status, and claims. Falls back to console printing when disabled. | [emailSender.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/utils/emailSender.js) |
| **QR Code Verification** | Implements a public scanner page on `/verify/:hash?` utilizing webcam, local file uploading, or manual search to verify document hashes dynamically. | [VerifyQR.jsx](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/client/src/pages/public/VerifyQR.jsx) |
| **Backup & Restore** | Generates database dumps and compresses them with encrypted `uploads/` files in ZIP archives. Restores tables query-by-query and decompresses archives. | [backupRestore.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/utils/backupRestore.js) |
| **Automated Backups** | Executes a daily background cron job at midnight to backup the system and rotates/cleans up backups, retaining only the last 7 files. | [server.js:L2090](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js#L2090) |
| **ID Verification Signup** | Accepts resident ID proof attachments (JPG/PNG/PDF) during registration, encrypts file buffers, and registers them to unlock admin verification. | [Login.jsx:L62](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/client/src/pages/public/Login.jsx#L62) |

---

## 🔑 Default Credentials & Test Accounts

### 1. Default Super Admin
Run `POST /api/v1/setup/superadmin` (can be triggered from **[test-api.html](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/test-api.html)**) to seed:
* **Username**: `superadmin`
* **Password**: `SuperAdmin123`
* **Role**: `Captain` (Full access to Backup Console & System Settings)

### 2. QR Verification Tester
Run `POST /api/v1/test/qr-seed` (can be triggered from **[test-api.html](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/test-api.html)**) to seed:
* **Email**: `test-verifier@malaya.gov.ph`
* **Password**: `dummypasswordhash`
* **Document Ref No**: `REQ-TEST-VERIFY-xxxx`
* **Document Verification Hash**: `verify_test_cryptographic_hash_999`
* **Document Status**: `Issued`

---

## ⚙️ Environment Configuration & Setup

### 1. Backend Environment Variables
Update the [server/.env](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/.env) file to configure SMTP transport and verification URLs:

```env
# Email SMTP Settings (For Nodemailer)
EMAIL_SERVICE_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=eserbisyobaranggaymalaya@gmail.com
SMTP_PASS=dqylnftfnywultoj
SMTP_FROM="E-Serbisyo Barangay Malaya" <eserbisyobaranggaymalaya@gmail.com>

# QR Code Verification Settings (Appended to stamped PDF QR codes)
VERIFICATION_BASE_URL=http://localhost:5173/verify
```

> [!NOTE]
> **Gmail SMTP Setup**: The `SMTP_PASS` must be a **16-character Google App Password** (not your regular account password). Ensure **2-Step Verification** is enabled on the account before generating it.

### 2. Frontend Environment Variables
Update the [client/.env](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/client/.env) file to connect the client to the API:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

---

## 🧪 Verification & Manual Test Procedures

Use the developer testing dashboard **[test-api.html](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/test-api.html)** for verification:

### 1. Verification Test: SMTP Email
1. Open [test-api.html](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/test-api.html) in your browser.
2. Scroll to the **Custom Integration Tests** section at the bottom.
3. Input your email address in the **Email SMTP Tester** field.
4. Click **Send Test Email**.
5. Check the result window. It will display a success response, and a test message will land in your inbox.

### 2. Verification Test: QR Scanner
1. Open [test-api.html](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/test-api.html).
2. Go to the **QR Document Seeder** block and click **Seed & Generate test-qr.png**.
3. It will seed a dummy issued document in your local database and save a file named `test-qr.png` in the project root directory.
4. Navigate to `http://localhost:5173/verify` in your browser.
5. Select the **Upload Image** tab and upload the generated `test-qr.png`.
6. Confirm that the scanner parses the file and immediately displays the green **"DOCUMENT VERIFIED AUTHENTIC"** badge with owner *Maria Dela Cruz*.

### 3. Verification Test: Database Backups
1. Log in to the portal as Captain (`superadmin` / `SuperAdmin123`).
2. Go to **Database Backups** on the left menu drawer.
3. Click **Create New Backup**. You will see it added to the backups list.
4. Click **Download** to verify download streams, or click **Restore** to test the system synchronization.

---

## 🛠️ Developer Customization Guide (Emails & Backups)

### 1. Customizing Email HTML Templates
Email HTML content is defined inline within [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js). Search for `await sendEmail(` to modify styling or text:

* **Resident Registration Approval Notification**:
  Modifiable at line **586** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
  ```javascript
  await sendEmail(
      email_address,
      `Account Registration Update - ${account_status}`,
      `Hi ${first_name},<br/><br/>Your resident account status for E-Serbisyo Barangay Malaya ${statusDescription}`
  );
  ```

* **Document Request Verified (For Payment)**:
  Modifiable at line **842** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
  ```javascript
  emailSubject = `Document Request Approved - Reference #${refNo}`;
  emailHtml = `Hi ${first_name},<br/><br/>Your request for <b>${type_name}</b> (Reference No: <b>${refNo}</b>) has been approved!...`;
  ```

* **Document Request Rejected**:
  Modifiable at line **845** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
  ```javascript
  emailSubject = `Document Request Rejected - Reference #${refNo}`;
  emailHtml = `Hi ${first_name},<br/><br/>Your request for <b>${type_name}</b> (Reference No: <b>${refNo}</b>) was rejected. Reason: ...`;
  ```

* **Document Ready for Pickup**:
  Modifiable at line **1342** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
  ```javascript
  await sendEmail(
      email_address,
      `Document Ready for Pickup - Reference #${reference_no}`,
      `Hi ${first_name},<br/><br/>Your requested document <b>${type_name}</b> (Reference No: <b>${reference_no}</b>) is now printed and <b>Ready for Pickup</b>...`
  );
  ```

### 2. Customizing Auto-Backup Rotation Count
By default, the cron scheduler deletes old backups to keep only the last **7** files to prevent disk usage overflows. 

To increase or decrease this rotation limit, modify line **2102** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
```javascript
// Change "7" to your preferred rotation count (e.g. 30 to retain a month of backups)
const backups = listBackups();
if (backups.length > 7) {
    const olderBackups = backups.slice(7);
    for (const oldBackup of olderBackups) {
        deleteBackup(oldBackup.filename);
    }
}
```

### 3. Customizing the Cron Schedule Time
The daily backup job is scheduled using a standard cron expression `0 0 * * *` (Daily at Midnight). 

To change this schedule (e.g., to run every Sunday at midnight: `0 0 * * 0`, or every hour: `0 * * * *`), update the expression at line **2094** in [server.js](file:///c:/Users/reyma/Desktop/Development/Barangay%20System/server/server.js):
```javascript
cron.schedule('0 0 * * *', async () => {
    // Scheduled backup logic...
});
```

---

## 🌐 Technitium Split-Horizon DNS & Local SSL Proxy Setup

This section details how to configure local DNS resolution and direct local HTTPS requests inside the Barangay Hall Local Area Network (LAN) using **Technitium DNS Server** and **Caddy Server** as a reverse proxy.

### 📋 Architectural Overview
When a device connects to the Barangay Hall Wi-Fi or Ethernet switches:
1. It queries **Technitium DNS** for `portal.brgy143.gov.ph`.
2. Technitium DNS resolves it directly to the local server's private IP (`192.168.1.100`) rather than querying public root servers.
3. The client browser connects to the private IP over HTTPS (ports 443/8443).
4. **Caddy Server** intercept the request, validates the certificate, and reverse proxies it to the local Express backend (port 3000) or Vite client (port 5173).

---

### 🛠️ Step 1: Technitium DNS Zone Setup
Once physically at the Barangay Hall:
1. Open the Technitium Admin Console at `http://<technitium-ip>:5380`.
2. Click on the **Zones** tab in the top navigation.
3. Click **Create Zone** in the top-right corner.
   * **Zone Name**: `brgy143.gov.ph` (or your chosen domain name)
   * **Zone Type**: Primary
4. Inside the newly created zone, click **Add Record**:
   * **Record 1 (Client Portal)**:
     * **Name**: `portal`
     * **Type**: `A`
     * **IPv4 Address**: `192.168.1.100` (Your local server machine IP)
   * **Record 2 (API Endpoint)**:
     * **Name**: `api`
     * **Type**: `A`
     * **IPv4 Address**: `192.168.1.100` (Your local server machine IP)
5. Navigate to the **Settings** tab -> **Forwarders**. Ensure public resolvers (such as `1.1.1.1` and `8.8.8.8`) are configured so that normal internet queries resolve successfully.

---

### 🔒 Step 2: Local SSL Reverse Proxy (Caddy) Setup
Since browser camera access (required for scanning certificate QR codes) is restricted on non-secure connections, the local domain must run over HTTPS. **Caddy** handles local certificates and reverse proxying automatically.

1. **Install Caddy** on the local server machine:
   * Download the executable from the [Caddy Website](https://caddyserver.com/download).
   * Or install via Chocolatey: `choco install caddy`
2. Create a file named `Caddyfile` (no extension) in your Caddy installation folder (or in the root folder of your project for easy management):
   ```caddyfile
   portal.brgy143.gov.ph {
       # Reverse proxy to the Vite client server
       reverse_proxy localhost:5173
       
       # Generate and trust certificates using Caddy's internal local CA
       tls internal
   }

   api.brgy143.gov.ph {
       # Reverse proxy to the Express API server
       reverse_proxy localhost:3000
       
       # Generate and trust certificates using Caddy's internal local CA
       tls internal
   }
   ```
3. Run Caddy in your terminal:
   ```bash
   caddy run --config ./Caddyfile
   ```
4. **Trust the Local Certificate**:
   * When Caddy runs with `tls internal`, it establishes its own root Certificate Authority (CA) on the server.
   * On the server host machine, Caddy will try to install this root CA into the local system store automatically.
   * To allow other devices (staff laptops/smartphones) on the LAN to trust the HTTPS certificate without warnings, copy Caddy's root certificate (located at `%APPDATA%\caddy\pki\authorities\local\root.crt` on Windows) and install/trust it on those devices' certificate managers.

---

### 📶 Step 3: Router/DHCP Configuration
To ensure all devices on the Barangay network automatically query your Technitium DNS server:
1. Log in to your local router's admin panel (usually `http://192.168.1.1` or `http://192.168.0.1`).
2. Locate the **DHCP Server Settings**.
3. Change the **Primary DNS Server (DNS 1)** value to your DNS server's local IP address (e.g., `192.168.1.100`).
4. Set the **Secondary DNS Server (DNS 2)** to a public fallback (e.g., `1.1.1.1`).
5. Save settings and restart the router. Devices will acquire the new DNS server IP next time they reconnect.
