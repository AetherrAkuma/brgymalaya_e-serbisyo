# SYSTEM INTEGRATION AND ARCHITECTURE — MONTHLY PROGRESS REPORT

**MPR NO:** 5  
**DATE SUBMITTED:** July 14, 2026  
**SECTION:** BSINFOTECH 3C  
**PROJECT TITLE:** E-Serbisyo: Web-Based Document Request and Information System using QR Code Authentication

**STUDENTS NAME:**
1. CHUA, REYMART M. – PROJECT LEADER
2. MORALES, JOHN REY F. – TECHNICAL LEADER
3. TOMAS, TJ C. – QUALITY ASSURANCE LEADER
4. KAMILAN, DIANA F. – DOCUMENTATION LEADER
5. TAÑA, LARA MHAY CLAIRE L. – COMMUNICATION LEADER
6. REGUALOS, CHRIS TOKIYO T. – COMMUNICATION LEADER

---

## 1. Tasks Planned for the Month

- Implement Email Verification System for resident registration (FR14 expansion)
- Add First-Time Jobseeker (RA 11261) fee exemption flow for Treasurer
- Overhaul Audit Trail system with structured schema, expanded coverage, and improved frontend viewer (FR13 enhancement)
- Fix Cloudflare tunnel query parameter issues affecting verification links
- Ensure all state-changing endpoints are properly audit-logged with no gaps
- Create database migration scripts to keep XAMPP schema in sync with codebase changes

---

## 2. Tasks Accomplished

### 2.1 Email Verification System (FR14 — Email for Authentication)

- Created `server/utils/disposableDomains.json` — a comprehensive list of 2,145 known disposable email domains used to block temporary email addresses during registration
- Built `server/utils/emailValidator.js` with three validation layers:
  - **Format check:** regex validation ensuring proper email structure
  - **MX record lookup:** DNS query via `dns.promises.resolveMx` to verify the domain can receive mail
  - **Disposable domain detection:** O(1) Set lookup against the 2,145-domain blocklist
- Added `tbl_EmailVerification` database table to track verification tokens, expiry (1 hour), IP, and user-agent per request
- Modified the registration endpoint to:
  - Normalize emails to lowercase before storage and duplicate check
  - Validate format, block disposable domains, verify MX records
  - Generate a cryptographically secure 32-byte random token, store its SHA-256 hash
  - Send a styled HTML verification email with a one-click link
- Implemented `POST /api/v1/auth/verify-email` — idempotent endpoint that handles fresh verification, already-verified tokens, and invalid/expired tokens gracefully
- Implemented `GET /api/v1/auth/verify-status` — allows the frontend to check verification status without consuming the token (supports page refresh)
- Built `VerifyEmail.jsx` — a three-state React page covering:
  - "Check Your Email" landing state after registration
  - Verified state with success animation and automatic URL cleanup via `setSearchParams`
  - Failed/expired state with clear error messaging
  - Expiration (1 hour) and one-time-use chips for user transparency
- Updated `Register.jsx` with proper email regex and post-registration redirect to `/verify-email`
- Added `/verify-email` route in `App.jsx`

### 2.2 First-Time Jobseeker Fee Exemption (RA 11261)

- Implemented jobseeker detection via `purpose.includes('[FIRST-TIME JOBSEEKER]')` on the request row
- Modified `PaymentsQueue.jsx` — exemption-only modal that hides cash/change fields, shows RA 11261 info card, and includes a required OR Number field for physical audit trail
- Modified `Dashboard.jsx` (Treasurer quick-payment encoder) — separate exemption box with OR-only input, change calculator hidden for jobseekers
- Modified `RequestsQueue.jsx` — same exemption modal pattern with required OR field
- Updated backend exemption endpoint `POST /api/v1/payments/exempt/:request_id` to accept and require `or_number` from the request body
- Removed the auto-generated pseudo OR number fallback (`EXEMPT-` prefix); OR number is now mandatory for all exemption transactions

### 2.3 Audit Trail Overhaul (FR13 — Audit Trail)

**Schema Upgrade:**
- Added `outcome ENUM('success','failure')` column to `tbl_AuditLogs` to track result status of every action
- Added `user_agent TEXT` column to capture client context
- Added performance indexes on `timestamp`, `action_type`, and `outcome`
- Created `server/migrations/001_audit_schema_upgrade.sql` for existing database migration with backfill queries for old action types

**Dot-Notation Action Types:**
- Standardized all action types to machine-friendly dot notation:
  - `user.login`, `user.password_change`, `user.password_reset`, `user.forgot_password`
  - `resident.register`, `resident.status_change`, `resident.quick_register`
  - `document.print`, `document.signature_upload`, `document.auto_delete_id_proof`
  - `document_type.create`, `document_type.update`, `document_type.layout_update`, `document_type.template_upload`
  - `payment.encode`, `payment.exempt`
  - `requests.status_change`, `request.create`
  - `announcement.create`, `announcement.approve`, `announcement.reject`, `announcement.delete`
  - `official.create`, `official.status_change`, `official.delete`
  - `registration.reject`
  - `system.backup`, `system.restore`, `system.backup_delete`, `system.settings_update`

**Expanded Coverage (16 previously unlogged endpoints):**
| Endpoint | Action Type |
|---|---|
| `POST /auth/resident/register` | `resident.register` |
| `POST /auth/login` (success) | `user.login` (via `logLogin`) |
| `POST /auth/login` (failure) | `user.login` + `outcome: 'failure'` |
| `POST /auth/forgot-password` | `user.forgot_password` |
| `POST /auth/reset-password` | `user.password_reset` |
| `PUT /admin/residents/:id/status` | `resident.status_change` |
| `PUT /admin/settings/:setting_key` | `system.settings_update` |
| `POST /admin/document-types` | `document_type.create` |
| `PUT /admin/document-types/:id` | `document_type.update` |
| `PUT /admin/document-types/:id/layout` | `document_type.layout_update` |
| `POST /admin/document-types/:id/template` | `document_type.template_upload` |
| `POST /admin/announcements` | `announcement.create` |
| `DELETE /admin/announcements/:id` | `announcement.delete` |
| `POST /requests` | `request.create` |
| `PUT /residents/me/password` | `user.password_change` |
| `POST /admin/signatures/upload` | `document.signature_upload` |

**Frontend Viewer Enhancement:**
- Replaced verbose narrative text with structured, data-dense card layout
- Header row: transaction ID, outcome chip, human-readable action label, relative timestamp
- Body: actor name with role, target table with record ID chip, locale timestamp, IP address, truncated user-agent
- Auto-generated diff table showing changed fields with red (old) and green (new) highlighting
- Expandable raw JSON panel for forensic inspection
- Human-readable action labels via a comprehensive action metadata map (30+ action types)

**Audit Logger Refactoring:**
- `logAction()` now accepts `outcome` and `user_agent` parameters (both optional with sensible defaults)
- All convenience functions (`logLogin`, `logStatusChange`, `logDocumentPrint`, `logPayment`) forward these parameters
- Action types in convenience functions are auto-derived (e.g., `payment.encode` vs `payment.exempt` based on amount)

### 2.4 Bug Fixes & Infrastructure

- Fixed `textStyle: 'center'` typo → `textAlign: 'center'` on ResetPassword.jsx success page (invalid MUI prop)
- Changed email verification from GET to POST to resolve Cloudflare tunnel query parameter mangling
- Verification endpoint made idempotent — returns `{ already_verified: true }` for already-used links without error
- Added GET verify-status endpoint for page-refresh resilience
- Migration script executed against XAMPP MySQL database — columns added, indexes created, 31 existing log entries backfilled to dot-notation action types

---

## 3. Current System Status

- **100% of High-priority FRs are fully implemented and operational:**
  - FR1 (Secure Login) — JWT authentication with role-based access control
  - FR2 (Resident Account Management) — Registration with email verification and admin approval workflow
  - FR3 (Secure Database) — MySQL with encrypted sensitive fields
  - FR4 (Document Generation) — Automated PDF generation with QR code stamping
  - FR5 (Announcements) — Real-time publishing with expiry controls
  - FR6 (Encryption) — AES-256-CBC for data, SHA-256 for passwords
  - FR7 (QR Verification) — Multi-method (webcam, file upload, manual) document authenticity verification
  - FR8 (Super Admin CRUD) — Full data management capabilities
  - FR9 (System Settings) — Configurable barangay information and account management

- **All Medium-priority FRs are fully implemented:**
  - FR10 (Responsive UI) — Adaptive design across mobile, tablet, and desktop
  - FR11 (Backup & Restore) — Automated database backups with rotation and restore
  - FR12 (Request History) — Complete status change tracking per request
  - FR13 (Audit Trail) — **Enhanced with structured schema, expanded coverage, and improved viewer**
  - FR14 (Email) — **Enhanced with verification on registration, plus existing notification and password reset flows**

- **Low-priority FRs not yet implemented:**
  - FR15 (Advanced Analytics) — Pending
  - FR16 (Import/Export) — Pending
  - FR17 (Feature Toggles) — Pending

---

## 4. Problems Encountered

### 4.1 Cloudflare Tunnel Query Parameter Mangling
- **Issue:** Cloudflare Tunnel was stripping or mangling query parameters in GET requests, causing email verification links to fail. The system was sending verification URLs with `?token=...&email=...` via GET, but Cloudflare's network layer was interfering.
- **Resolution:** Changed the verification endpoint from GET to POST, sending `token` and `email` in the request body. This bypassed the query parameter issue entirely. Added a separate GET `/verify-status` endpoint for status checks without token consumption.

### 4.2 MX Record Lookup Edge Cases
- **Issue:** Some legitimate email domains (particularly smaller or older mail servers) do not respond to MX record queries within a reasonable timeout, causing false rejections during registration.
- **Resolution:** Wrapped the MX check in a try/catch with a warning log. If the MX lookup fails or times out, the registration proceeds with a server-side warning rather than blocking the user.

### 4.3 OR Number Enforcement for Exemptions
- **Issue:** The exemption flow originally generated auto-prefixed OR numbers (`EXEMPT-{timestamp}`), but the barangay requires a physical OR number for every transaction, including exemptions, for audit trail compliance.
- **Resolution:** Removed the auto-generation fallback. OR number is now a required field on all three exemption views (PaymentsQueue, Dashboard, RequestsQueue) with frontend validation and backend 400 rejection if missing.

### 4.4 Schema Migration for Existing Data
- **Issue:** Adding new columns (`outcome`, `user_agent`) to `tbl_AuditLogs` and changing action types to dot notation required backfilling 31 existing log entries. The `CREATE TABLE IF NOT EXISTS` statements in schema.sql don't alter existing tables.
- **Resolution:** Created a standalone migration script (`server/migrations/001_audit_schema_upgrade.sql`) with ALTER TABLE statements and targeted UPDATE queries to convert old action types to the new standard.

### 4.5 Audit Log Coverage Gaps
- **Issue:** Initial audit logging was only implemented on 20 out of 78 API endpoints, leaving 16 state-changing operations unlogged (including registration, login, password changes, document type CRUD, and announcement creation/deletion).
- **Resolution:** Systematically identified all state-changing endpoints without audit logging and added appropriate `logAction()` calls. The 16 gap endpoints now produce structured audit entries with full context.

---

## 5. Actions Taken / Solutions

- **Email Verification Pipeline:** Built a three-layer email validation system (format → MX → disposable check) integrated into the registration flow, with a dedicated verification table, secure token generation, and a three-state React frontend
- **Jobseeker Exemption Flow:** Modified three Treasurer-facing views to detect First-Time Jobseeker requests and present an exemption-only modal with mandatory OR number field
- **Audit Trail Architecture:** Redesigned the audit log schema to follow industry-standard core fields (Timestamp, Actor, Action, Target, Outcome, Context), updated all 36+ logging call sites, and built a data-dense frontend viewer with automatic diff rendering
- **Cloudflare Workaround:** Migrated verification from GET to POST to avoid tunnel interference; added an independent GET status endpoint for resilience
- **Database Migration:** Ran ALTER TABLE and backfill queries against the live XAMPP database; verified all 31 existing entries were correctly migrated and no old action types remain
- **Full Syntax Validation:** All server-side JavaScript files pass `node --check` syntax validation

---

## 6. Plan for Next Month

- Deploy the system to production using Cloudflare Tunnel with a custom domain once domain acquisition is finalized
- Implement FR15 (Advanced Analytics and Performance Reports) with data visualizations for resident demographics and service usage metrics
- Implement FR16 (Import/Export of Documents and Data) for resident master lists and request history
- Implement FR17 (Feature Toggle System) for Super Admin to enable/disable major modules
- Conduct comprehensive User Acceptance Testing (UAT) with barangay officials and residents
- Gather feedback and perform final UI/UX refinements
- Complete final project documentation and presentation materials

---

**Prepared by:**

John Rey F. Morales
Technical Leader

**Date:** July 14, 2026

**Checked By:**

PROF. ERNANIE M. CARLOS JR., MIT
Subject Adviser

**Date:** _______________
