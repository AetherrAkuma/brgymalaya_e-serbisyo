require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');
const crypto = require('crypto'); // Built-in for QR Hash generation

// Phase 1.2 Utilities
const { hashPassword, encryptData, decryptData } = require('./utils/crypto');
// Phase 1.3 Middleware
const { generateToken, verifyJWT, roleGuard } = require('./middleware/auth');
const { sqlSanitizer } = require('./middleware/sanitizer');
// Phase 1.4 File Handling
const { encryptAndSaveFile, decryptFileBuffer } = require('./utils/fileCrypto');
const upload = require('./middleware/upload');
// Phase 7 PDF Engine
const { generateBarangayPDF } = require('./utils/pdfGenerator');
// Phase 8 Audit Logger
const { logAction, logLogin, logStatusChange, logDocumentPrint, logPayment } = require('./utils/auditLogger');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS Configuration - Allow all origins for development/testing
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Safety Net Middleware for JSON Parsing Errors
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: 'Malformed JSON or incorrect Content-Type header. If uploading a file, uncheck Content-Type in your headers and use form-data or binary.'
        });
    }
    next();
});

app.use(sqlSanitizer);

// ==========================================
// PHASE 1.1: DATABASE ENDPOINTS
// ==========================================
app.post('/api/v1/setup/database', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sqlQuery);
        const [tables] = await db.query('SHOW TABLES');
        res.status(200).json({ status: 'success', tablesCreated: tables.map(t => Object.values(t)[0]) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/v1/health/db', async (req, res) => {
    try {
        const [tables] = await db.query('SHOW TABLES');
        res.status(200).json({ status: 'success', tableCount: tables.length, tables: tables.map(t => Object.values(t)[0]) });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 1.2 & 1.3: CRYPTO & AUTH TESTING
// ==========================================
app.post('/api/v1/test/crypto', (req, res) => {
    try {
        const { password, sensitive_data } = req.body;
        res.status(200).json({
            sha256: hashPassword(password),
            aes256: { encrypted: encryptData(sensitive_data), decrypted: decryptData(encryptData(sensitive_data)) }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/v1/test/generate-token', (req, res) => {
    const { id, role, username } = req.body;
    res.status(200).json({ token: generateToken({ id, role, username }) });
});

app.get('/api/v1/test/super-admin-only', verifyJWT, roleGuard(['Captain']), (req, res) => {
    res.status(200).json({ message: 'Welcome Captain!', user: req.user });
});

// ==========================================
// PHASE 1.4: SECURE FILE HANDLING
// ==========================================
app.post('/api/v1/files/upload', express.raw({ type: ['image/jpeg', 'image/png', 'application/pdf', 'application/octet-stream'], limit: '5mb' }), (req, res) => {
    try {
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: 'No file uploaded. Ensure you are sending raw binary data and the correct Content-Type.' });
        }

        const contentType = req.headers['content-type'] || 'application/octet-stream';
        let fileExtension = '.bin';
        if (contentType.includes('image/jpeg')) fileExtension = '.jpg';
        else if (contentType.includes('image/png')) fileExtension = '.png';
        else if (contentType.includes('application/pdf')) fileExtension = '.pdf';

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const savedFilename = `secure_${uniqueSuffix}${fileExtension}.enc`;

        encryptAndSaveFile(req.body, savedFilename);

        res.status(200).json({ status: 'success', filename: savedFilename, original_type: contentType });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/v1/files/:filename', verifyJWT, roleGuard(['Captain', 'Secretary', 'Treasurer', 'Captain']), (req, res) => {
    try {
        const decryptedBuffer = decryptFileBuffer(req.params.filename);
        let mimeType = 'application/octet-stream';
        if (req.params.filename.includes('.png')) mimeType = 'image/png';
        else if (req.params.filename.includes('.jpg') || req.params.filename.includes('.jpeg')) mimeType = 'image/jpeg';
        else if (req.params.filename.includes('.pdf')) mimeType = 'application/pdf';

        res.setHeader('Content-Type', mimeType);
        res.send(decryptedBuffer);
    } catch (error) {
        res.status(404).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 2: IDENTITY & ACCOUNT MANAGEMENT
// ==========================================

app.post('/api/v1/auth/resident/register', async (req, res) => {
    try {
        const {
            first_name, middle_name, last_name, date_of_birth,
            civil_status, address_street, email_address, contact_number, password
        } = req.body;

        if (!first_name || !last_name || !date_of_birth || !civil_status || !address_street || !email_address || !contact_number || !password) {
            return res.status(400).json({ error: 'All required fields must be provided.' });
        }

        const [existing] = await db.query('SELECT resident_id FROM tbl_Residents WHERE email_address = ?', [email_address]);

        // FIX: We must check if the array actually has items inside it, not just if the array exists.
        if (existing && existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email address is already registered.' });
        }

        const hashedPassword = hashPassword(password);
        const encryptedContact = encryptData(contact_number);

        const insertQuery = `
            INSERT INTO tbl_Residents 
            (first_name, middle_name, last_name, date_of_birth, civil_status, address_street, email_address, contact_number, password_hash, account_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        const [result] = await db.query(insertQuery, [
            first_name, middle_name || null, last_name, date_of_birth,
            civil_status, address_street, email_address, encryptedContact, hashedPassword
        ]);

        res.status(201).json({
            status: 'success',
            message: 'Resident registered successfully. Your account is pending approval from Barangay Officials.',
            resident_id: result.insertId
        });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint: Unified Login (Handles both Officials and Residents)
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email_or_username, password } = req.body;

        if (!email_or_username || !password) {
            return res.status(400).json({ status: 'error', message: 'Credentials are required.' });
        }

        const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

        // 1. CHECK BARANGAY OFFICIALS TABLE
        const [officials] = await db.query(
            'SELECT user_id, full_name, username, role, account_status, require_password_change FROM tbl_BarangayOfficials WHERE (email_official = ? OR username = ?) AND password_hash = ?',
            [email_or_username, email_or_username, hashedPassword]
        );

        if (officials.length > 0) {
            const official = officials[0];

            if (official.account_status !== 'Active') {
                return res.status(403).json({ status: 'error', message: `Account is ${official.account_status}.` });
            }

            await db.query('UPDATE tbl_BarangayOfficials SET last_login = NOW() WHERE user_id = ?', [official.user_id]);

            const token = generateToken({ id: official.user_id, role: official.role, username: official.username });

            // [Inference] The frontend uses 'mustChange' to trigger the security modal.
            return res.status(200).json({
                status: 'success',
                message: 'Official login successful',
                token: token,
                role: official.role,
                first_name: official.full_name,
                // ONLY true if the DB flag is 1
                mustChange: official.require_password_change === 1
            });
        }

        // ---------------------------------------------------------
        // 2. CHECK RESIDENTS TABLE (If not an official)
        // ---------------------------------------------------------
        // FIX: Ensuring the variable is strictly named 'residents'
        const [residents] = await db.query(
            'SELECT resident_id, first_name, email_address, account_status FROM tbl_Residents WHERE email_address = ? AND password_hash = ?',
            [email_or_username, hashedPassword]
        );

        if (residents.length > 0) {
            const resident = residents[0]; // The bug was likely right here!

            if (resident.account_status !== 'Active') {
                return res.status(403).json({ status: 'error', message: `Account is ${resident.account_status}. Please wait for verification.` });
            }

            // Generate Token
            const token = generateToken({ id: resident.resident_id, role: 'Resident', email: resident.email_address });

            return res.status(200).json({
                status: 'success',
                message: 'Resident login successful',
                token: token,
                role: 'Resident',
                first_name: resident.first_name
            });
        }

        // ---------------------------------------------------------
        // 3. NO MATCH FOUND IN EITHER TABLE
        // ---------------------------------------------------------
        return res.status(401).json({ status: 'error', message: 'Invalid credentials. Please check your username/email and password.' });

    } catch (error) {
        console.error("[LOGIN ERROR]:", error);
        res.status(500).json({ status: 'error', message: 'Internal server error during login.' });
    }
});

app.post('/api/v1/setup/superadmin', async (req, res) => {
    try {
        const hashedPassword = hashPassword('SuperAdmin123');
        const [existing] = await db.query('SELECT * FROM tbl_BarangayOfficials WHERE username = ?', ['superadmin']);

        if (existing.length > 0) return res.status(400).json({ error: 'Captain account already exists.' });

        const query = `
            INSERT INTO tbl_BarangayOfficials (official_id, full_name, email_official, username, password_hash, role, account_status)
            VALUES ('SA-001', 'System Administrator', 'admin@eserbisyo.com', 'superadmin', ?, 'Captain', 'Active')
        `;

        await db.query(query, [hashedPassword]);
        res.status(201).json({ status: 'success', message: 'Default Captain created.', credentials: { username: 'superadmin', password: 'SuperAdmin123' } });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 3: THE PUBLIC PORTAL
// ==========================================

app.get('/api/v1/public/announcements', async (req, res) => {
    try {
        const query = `
            SELECT announcement_id, title, content_body, image_path, target_audience, is_pinned, date_posted, status
            FROM tbl_announcements 
            WHERE (LOWER(status) = 'published' OR LOWER(status) = 'active') 
              AND (expiry_date IS NULL OR expiry_date > NOW())
            ORDER BY is_pinned DESC, date_posted DESC
        `;
        const [announcements] = await db.query(query);
        res.status(200).json({ status: 'success', data: announcements });
    } catch (error) {
        console.error("[PUBLIC ANNOUNCEMENT FETCH ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/v1/public/document-types', async (req, res) => {
    try {
        const query = `
            SELECT doc_type_id, type_name, description, base_fee, requirements 
            FROM tbl_DocumentTypes 
            WHERE is_available = 1
        `;
        const [documents] = await db.query(query);
        res.status(200).json({ status: 'success', data: documents });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/v1/public/settings', async (req, res) => {
    try {
        const query = `
            SELECT setting_key, setting_value, description 
            FROM tbl_SystemSettings 
            WHERE is_encrypted = FALSE
        `;
        const [settings] = await db.query(query);
        const formattedSettings = {};
        settings.forEach(setting => {
            formattedSettings[setting.setting_key] = setting.setting_value;
        });

        res.status(200).json({ status: 'success', data: formattedSettings });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/v1/setup/seed-public', async (req, res) => {
    try {
        await db.query(`
            INSERT IGNORE INTO tbl_Announcements (title, content_body, status, expiry_date, is_pinned) 
            VALUES 
            ('Road Clearing Operations', 'Please be advised that road clearing will start on Monday.', 'Published', DATE_ADD(NOW(), INTERVAL 7 DAY), TRUE),
            ('Free Medical Mission', 'Join us at the covered court this weekend for free checkups!', 'Published', DATE_ADD(NOW(), INTERVAL 3 DAY), FALSE)
        `);

        await db.query(`
            INSERT IGNORE INTO tbl_DocumentTypes (type_name, description, base_fee, requirements) 
            VALUES 
            ('Barangay Clearance', 'Used for employment and general purposes.', 50.00, 'Valid ID, 1x1 Picture'),
            ('Certificate of Indigency', 'Used for scholarship and financial aid. Free of charge.', 0.00, 'Proof of Income or Valid ID')
        `);

        await db.query(`
            INSERT IGNORE INTO tbl_SystemSettings (setting_key, setting_value, description, is_encrypted) 
            VALUES 
            ('barangay_name', 'Barangay 143', 'The official name of the barangay', FALSE),
            ('contact_email', 'admin@brgy143.gov.ph', 'Public contact email', FALSE)
        `);

        res.status(201).json({ status: 'success', message: 'Public portal dummy data seeded successfully!' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 4: SYSTEM CONFIGURATION & CONTENT
// ==========================================

// Endpoint 17: Update a System Setting (Captain Only)
app.put('/api/v1/admin/settings/:setting_key', verifyJWT, roleGuard(['Captain']), async (req, res) => {
    try {
        const { setting_value } = req.body;
        const { setting_key } = req.params;

        if (!setting_value) {
            return res.status(400).json({ error: 'setting_value is required.' });
        }

        const [result] = await db.query(
            'UPDATE tbl_SystemSettings SET setting_value = ?, updated_by = ?, last_updated = NOW() WHERE setting_key = ?',
            [setting_value, req.user.id, setting_key]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Setting key not found.' });
        }

        res.status(200).json({ status: 'success', message: `Setting '${setting_key}' updated successfully.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 18: Create a Document Type (Captain, Secretary)
app.post('/api/v1/admin/document-types', verifyJWT, roleGuard(['Captain', 'Secretary']), async (req, res) => {
    try {
        const { type_name, description, base_fee, requirements, validity_days, is_available } = req.body;

        if (!type_name) return res.status(400).json({ error: 'type_name is required.' });

        const insertQuery = `
            INSERT INTO tbl_DocumentTypes 
            (type_name, description, base_fee, requirements, validity_days, is_available, updated_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(insertQuery, [
            type_name, description || null, base_fee || 0.00, requirements || null,
            validity_days || 180, is_available !== undefined ? is_available : true, req.user.id
        ]);

        res.status(201).json({ status: 'success', message: 'Document type created successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 18.5: Get All Document Types (Admin View - Includes Unavailable)
app.get('/api/v1/admin/document-types', verifyJWT, roleGuard(['Captain', 'Secretary', 'Captain']), async (req, res) => {
    try {
        const query = `SELECT * FROM tbl_DocumentTypes ORDER BY type_name ASC`;
        const [documents] = await db.query(query);
        res.status(200).json({ status: 'success', data: documents });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 19: Update a Document Type
app.put('/api/v1/admin/document-types/:id', verifyJWT, roleGuard(['Captain', 'Secretary']), async (req, res) => {
    try {
        const { type_name, description, base_fee, requirements, validity_days, is_available } = req.body;
        const { id } = req.params;

        const updateQuery = `
            UPDATE tbl_DocumentTypes 
            SET type_name = ?, description = ?, base_fee = ?, requirements = ?, validity_days = ?, is_available = ?, updated_by = ?
            WHERE doc_type_id = ?
        `;

        const [result] = await db.query(updateQuery, [
            type_name, description, base_fee, requirements, validity_days, is_available, req.user.id, id
        ]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Document type not found.' });

        res.status(200).json({ status: 'success', message: 'Document type updated successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// NEW Endpoint 19.5: Update Document Layout Config (Captain / Secretary)
app.put('/api/v1/admin/document-types/:id/layout', verifyJWT, roleGuard(['Captain', 'Secretary']), async (req, res) => {
    try {
        const { id } = req.params;
        const { layout_config } = req.body; // Expected format: { "name": {"x": 10, "y": 20}, ... }

        if (!layout_config || typeof layout_config !== 'object') {
            return res.status(400).json({ error: 'A valid layout_config object is required.' });
        }

        const configString = JSON.stringify(layout_config);
        const [result] = await db.query('UPDATE tbl_DocumentTypes SET layout_config = ? WHERE doc_type_id = ?', [configString, id]);

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Document type not found.' });
        res.status(200).json({ status: 'success', message: 'Layout configuration updated successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 20: Create an Announcement (Captain, Captain, Secretary)
// ==========================================
// PHASE: ANNOUNCEMENTS MANAGER
// ==========================================

// Endpoint 38: Get All Announcements (Admin View)
app.get('/api/v1/admin/announcements', verifyJWT, roleGuard(['Captain', 'Admin', 'Secretary', 'Treasurer']), async (req, res) => {
    try {
        const query = `
            SELECT a.*, o.full_name as posted_by_name 
            FROM tbl_announcements a
            LEFT JOIN tbl_BarangayOfficials o ON a.posted_by = o.user_id
            ORDER BY a.is_pinned DESC, a.date_posted DESC
        `;
        const [announcements] = await db.query(query);
        res.status(200).json({ status: 'success', data: announcements });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 39: Create Announcement
// Endpoint 39: Create Announcement (Supports native image_path)
app.post('/api/v1/admin/announcements', verifyJWT, roleGuard(['Captain', 'Admin', 'Secretary']), async (req, res) => {
    try {
        const { title, content_body, target_audience, is_pinned, status, expiry_date, image_path } = req.body;
        const posted_by = req.user.id;

        const insertQuery = `
            INSERT INTO tbl_announcements (title, content_body, target_audience, is_pinned, status, expiry_date, image_path, posted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(insertQuery, [
            title, content_body, target_audience || 'All',
            is_pinned ? 1 : 0, status || 'Draft',
            expiry_date || null, image_path || null, posted_by
        ]);

        res.status(201).json({ status: 'success', message: 'Announcement created successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 40: Update Announcement (Supports native image_path)
app.put('/api/v1/admin/announcements/:id', verifyJWT, roleGuard(['Captain', 'Admin', 'Secretary']), async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content_body, target_audience, is_pinned, status, expiry_date, image_path } = req.body;

        if (title && content_body) {
            const updateQuery = `
                UPDATE tbl_announcements 
                SET title = ?, content_body = ?, target_audience = ?, is_pinned = ?, status = ?, expiry_date = ?, image_path = ?
                WHERE announcement_id = ?
            `;
            await db.query(updateQuery, [
                title, content_body, target_audience,
                is_pinned ? 1 : 0, status,
                expiry_date || null, image_path || null, id
            ]);
        } else {
            // Quick toggle for pin/status from the table
            const updateQuery = `UPDATE tbl_announcements SET is_pinned = ?, status = ? WHERE announcement_id = ?`;
            await db.query(updateQuery, [is_pinned ? 1 : 0, status, id]);
        }

        res.status(200).json({ status: 'success', message: 'Announcement updated successfully.' });
    } catch (error) {
        console.error("[ANNOUNCEMENT UPDATE ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 41: Delete Announcement
app.delete('/api/v1/admin/announcements/:id', verifyJWT, roleGuard(['Captain', 'Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM tbl_announcements WHERE announcement_id = ?', [id]);
        res.status(200).json({ status: 'success', message: 'Announcement deleted.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 37: Get All Residents for Admin Verification
app.put('/api/v1/admin/residents/:id/status', verifyJWT, roleGuard(['Captain', 'Secretary', 'Captain']), async (req, res) => {
    try {
        const { account_status } = req.body;
        const { id } = req.params;
        const userRole = req.user.role; // Extracted from your JWT token

        if (!['Pending', 'Active', 'Blocked'].includes(account_status)) {
            return res.status(400).json({ error: "Invalid status. Must be 'Pending', 'Active', or 'Blocked'." });
        }

        // 🛡️ STRICT SECURITY RULE: Only Captain and Captain can block accounts
        if (account_status === 'Blocked' && !['Captain', 'Captain'].includes(userRole)) {
            return res.status(403).json({
                error: "Unauthorized action. Only the Barangay Captain or Captain can block a resident's account."
            });
        }

        const [result] = await db.query(
            'UPDATE tbl_Residents SET account_status = ? WHERE resident_id = ?',
            [account_status, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Resident not found.' });

        res.status(200).json({
            status: 'success',
            message: `Resident account successfully marked as ${account_status}.`
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 37: Get All Residents for Admin Verification (All Officials Can View)
app.get('/api/v1/admin/residents', verifyJWT, roleGuard(['Captain', 'Admin', 'Secretary', 'Captain', 'Treasurer']), async (req, res) => {
    try {
        const query = `
            SELECT resident_id, first_name, middle_name, last_name, email_address, 
                   contact_number, address_street, account_status, id_proof_image
            FROM tbl_Residents
            ORDER BY CASE WHEN account_status = 'Pending' THEN 1 ELSE 2 END, last_name ASC
        `;
        const [residents] = await db.query(query);

        res.status(200).json({ status: 'success', data: residents });
    } catch (error) {
        console.error("[FETCH RESIDENTS ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Upgraded Endpoint 20.5: Manage Resident Account Status
app.put('/api/v1/admin/residents/:id/status', verifyJWT, roleGuard(['Captain', 'Captain', 'Admin', 'Secretary']), async (req, res) => {
    try {
        const { account_status } = req.body;
        const { id } = req.params;

        if (!['Pending', 'Active', 'Blocked'].includes(account_status)) {
            return res.status(400).json({ error: "Invalid status. Must be 'Pending', 'Active', or 'Blocked'." });
        }

        const [result] = await db.query(
            'UPDATE tbl_Residents SET account_status = ? WHERE resident_id = ?',
            [account_status, id]
        );

        if (result.affectedRows === 0) return res.status(404).json({ error: 'Resident not found.' });

        res.status(200).json({ status: 'success', message: `Resident account successfully marked as ${account_status}.` });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 5: THE DOCUMENT REQUEST ENGINE
// ==========================================

// Endpoint 21: Submit a Document Request (Resident Only)
// FIX: Added upload.single('id_proof_image') to parse the FormData!
// Endpoint 21: Create Document Request (With Secure Server-Side File Loophole)
// UPDATE: Changed from upload.single to upload.fields
app.post('/api/v1/requests', verifyJWT, roleGuard(['Resident']), upload.fields([
    { name: 'id_proof_image', maxCount: 1 },
    { name: 'supporting_docs', maxCount: 5 } // The Loophole Array
]), async (req, res) => {
    try {
        const { doc_type_id, purpose } = req.body;
        const resident_id = req.user.id;

        if (!doc_type_id || !purpose) {
            return res.status(400).json({ status: 'error', message: 'doc_type_id and purpose are required.' });
        }

        // Active Request Constraint (5.2)
        const [existingActive] = await db.query(`
            SELECT request_id FROM tbl_Requests 
            WHERE resident_id = ? AND doc_type_id = ? 
            AND request_status IN ('Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup')
        `, [resident_id, doc_type_id]);

        if (existingActive.length > 0) {
            return res.status(403).json({
                status: 'error',
                message: 'You already have an active request for this document type. Please wait for it to be completed or rejected before filing another.'
            });
        }

        // --- NEW: Generate Reference Number EARLY ---
        // We need this generated first so we can attach it to the supporting document filenames!
        const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        const reference_no = `REQ-${dateString}-${randomStr}`;

        // --- Handle the ID Proof Upload ---
        // UPDATE: req.file is now req.files['id_proof_image'][0]
        if (req.files && req.files['id_proof_image'] && req.files['id_proof_image'][0].buffer) {
            const idFile = req.files['id_proof_image'][0];
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

            let ext = '.bin';
            if (idFile.mimetype === 'image/jpeg') ext = '.jpg';
            else if (idFile.mimetype === 'image/png') ext = '.png';
            else if (idFile.mimetype === 'application/pdf') ext = '.pdf';

            const savedFilename = `idproof_${resident_id}_${uniqueSuffix}${ext}.enc`;

            // Encrypt and save to the vault
            encryptAndSaveFile(idFile.buffer, savedFilename);

            // Update the resident's profile with their new ID proof
            await db.query('UPDATE tbl_Residents SET id_proof_image = ? WHERE resident_id = ?', [savedFilename, resident_id]);
        }

        // --- NEW: Process Supporting Documents (The Loophole) ---
        if (req.files && req.files['supporting_docs']) {
            req.files['supporting_docs'].forEach((file, index) => {
                if (file.buffer) {
                    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

                    let ext = '.bin';
                    if (file.mimetype === 'image/jpeg') ext = '.jpg';
                    else if (file.mimetype === 'image/png') ext = '.png';
                    else if (file.mimetype === 'application/pdf') ext = '.pdf';

                    // CRITICAL: We embed the reference_no right into the filename
                    const savedSupportName = `support_${reference_no}_${index}_${uniqueSuffix}${ext}.enc`;

                    // Encrypt and save using your existing utility!
                    encryptAndSaveFile(file.buffer, savedSupportName);
                }
            });
            console.log(`[SYSTEM] Saved and encrypted ${req.files['supporting_docs'].length} supporting files for ${reference_no}.`);
        }

        // --- Insert the Request ---
        // This remains 100% compliant with the PDF schema (No supporting_docs column!)
        const insertQuery = `
            INSERT INTO tbl_Requests (resident_id, doc_type_id, reference_no, purpose, request_status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        const [result] = await db.query(insertQuery, [resident_id, doc_type_id, reference_no, purpose]);

        res.status(201).json({
            status: 'success',
            message: 'Document request submitted successfully.',
            reference_no: reference_no,
            request_id: Number(result.insertId) // Safely converted BigInt to Number
        });

    } catch (error) {
        console.error("[REQUEST SUBMIT ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 22: View My Requests (Resident Only)
app.get('/api/v1/requests/resident/me', verifyJWT, roleGuard(['Resident']), async (req, res) => {
    try {
        const resident_id = req.user.id;

        const query = `
            SELECT r.request_id, r.reference_no, dt.type_name, r.purpose, r.request_status, r.date_requested, r.pickup_date, r.rejection_reason
            FROM tbl_Requests r
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            WHERE r.resident_id = ?
            ORDER BY r.date_requested DESC
        `;
        const [requests] = await db.query(query, [resident_id]);

        res.status(200).json({ status: 'success', data: requests });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 23: Get Pending Requests (Secretary / Captain)
app.get('/api/v1/requests/pending', verifyJWT, roleGuard(['Secretary', 'Captain']), async (req, res) => {
    try {
        const query = `
            SELECT r.request_id, r.reference_no, res.first_name, res.last_name, res.id_proof_image, dt.type_name, r.purpose, r.date_requested
            FROM tbl_Requests r
            JOIN tbl_Residents res ON r.resident_id = res.resident_id
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            WHERE r.request_status = 'Pending'
            ORDER BY r.date_requested ASC
        `;
        const [pendingRequests] = await db.query(query);

        res.status(200).json({ status: 'success', data: pendingRequests });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});


// Endpoint 24: Initial Verification (Secretary / Captain)
// Upgraded Endpoint 24: Initial Verification (With Audit Logging)
app.put('/api/v1/requests/:request_id/verify', verifyJWT, roleGuard(['Admin', 'Secretary', 'Captain', 'Captain', 'Treasurer']), async (req, res) => {
    try {
        const { action, rejection_reason } = req.body; // action: 'Approve' or 'Reject'
        const { request_id } = req.params;
        const official_id = req.user.id;

        if (!['Approve', 'Reject'].includes(action)) {
            return res.status(400).json({ error: "Invalid action. Must be 'Approve' or 'Reject'." });
        }

        // 1. Get current status and reference number for the audit log
        const [current] = await db.query('SELECT request_status, reference_no, resident_id FROM tbl_Requests WHERE request_id = ?', [request_id]);
        if (current.length === 0) return res.status(404).json({ error: 'Request not found.' });

        const oldStatus = current[0].request_status;
        const refNo = current[0].reference_no;
        const resident_id = current[0].resident_id;

        let newStatus = action === 'Reject' ? 'Rejected' : 'For Payment';

        // 2. Update the database
        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = ?, rejection_reason = ?, processed_by = ?
            WHERE request_id = ? AND request_status = 'Pending'
        `;
        const [result] = await db.query(updateQuery, [newStatus, rejection_reason || null, official_id, request_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Request is already processed or does not exist.' });
        }

        // 3. Log the change to the Audit Trail (Phase 8 Requirement)
        await logStatusChange(official_id, request_id, oldStatus, newStatus, `Admin ${action}ed request ${refNo}`);

        // Email Hook Simulation (FR14)
        console.log(`[EMAIL SIMULATION] Sent to Resident ID ${resident_id}: Your request ${refNo} is now ${newStatus}.`);

        res.status(200).json({
            status: 'success',
            message: `Request successfully marked as ${newStatus}.`
        });

    } catch (error) {
        console.error("[VERIFICATION ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 24.3: Get Admin Dashboard Statistics
// Enhanced Dashboard Stats: Corrected for tbl_Requests and tbl_Payments
app.get('/api/v1/admin/dashboard-stats', verifyJWT, async (req, res) => {
    try {
        // 1. Get Request Status Counts from tbl_Requests
        const [reqStats] = await db.query(`
            SELECT 
                SUM(CASE WHEN request_status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN request_status = 'For Payment' THEN 1 ELSE 0 END) as payment_count,
                SUM(CASE WHEN request_status = 'Processing' THEN 1 ELSE 0 END) as processing_count,
                SUM(CASE WHEN request_status = 'Ready for Pickup' THEN 1 ELSE 0 END) as ready_count,
                COUNT(*) as total_requests
            FROM tbl_Requests
        `);

        // 2. Get Collection Stats (Handling public funds, not profit)
        const [finStats] = await db.query(`
            SELECT SUM(amount_paid) as total_collections 
            FROM tbl_Payments 
            WHERE payment_status = 'Paid'
        `);

        res.status(200).json({
            status: 'success',
            data: {
                pending: Number(reqStats[0].pending_count || 0),
                forPayment: Number(reqStats[0].payment_count || 0),
                processing: Number(reqStats[0].processing_count || 0),
                ready: Number(reqStats[0].ready_count || 0),
                totalRequests: Number(reqStats[0].total_requests || 0),
                totalCollections: Number(finStats[0].total_collections || 0)
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 29: Process Payment (Treasurer/Admin Only)
app.put('/api/v1/payments/:request_id', verifyJWT, roleGuard(['Treasurer', 'Captain', 'Captain']), async (req, res) => {
    try {
        const { request_id } = req.params;
        const { or_number, amount_paid } = req.body;
        const treasurer_id = req.user.id;

        if (!or_number || !amount_paid) {
            return res.status(400).json({ status: 'error', message: 'OR Number and Amount Paid are required.' });
        }

        // 1. Verify the request is actually waiting for payment
        const [request] = await db.query(
            'SELECT reference_no, request_status FROM tbl_Requests WHERE request_id = ?',
            [request_id]
        );

        if (request.length === 0) return res.status(404).json({ error: 'Request not found.' });
        if (request[0].request_status !== 'For Payment') {
            return res.status(400).json({ error: 'Request is not in the payment stage.' });
        }

        // 2. Update status to 'Processing' (Ready for PDF Generation)
        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = 'Processing', processed_by = ? 
            WHERE request_id = ?
        `;
        await db.query(updateQuery, [treasurer_id, request_id]);

        // 3. Log the Financial Transaction to the Audit Trail (Phase 8)
        await logPayment(treasurer_id, request_id, amount_paid, or_number, `Payment received for ${request[0].reference_no}`);

        res.status(200).json({
            status: 'success',
            message: 'Payment recorded. Request is now in the processing queue.'
        });

    } catch (error) {
        console.error("[PAYMENT ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 24.5: Update Resident ID Proof (Resident Only)
app.put('/api/v1/residents/me/id-proof', verifyJWT, roleGuard(['Resident']), async (req, res) => {
    try {
        const { id_proof_filename } = req.body;
        const resident_id = req.user.id;

        if (!id_proof_filename) return res.status(400).json({ error: 'id_proof_filename is required.' });

        await db.query('UPDATE tbl_Residents SET id_proof_image = ? WHERE resident_id = ?', [id_proof_filename, resident_id]);
        res.status(200).json({ status: 'success', message: 'ID Proof updated successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 24.6: Get My Profile (Resident Only)
app.get('/api/v1/residents/me/profile', verifyJWT, roleGuard(['Resident']), async (req, res) => {
    try {
        const residentId = req.user.id;

        // 1. Match the real column names: address_street and contact_number
        const [rows] = await db.query(
            'SELECT first_name, last_name, email_address, contact_number, address_street, account_status FROM tbl_Residents WHERE resident_id = ?',
            [residentId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'User not found.' });
        }

        const user = rows[0];

        // 2. Decrypt the contact number (using your Phase 1 utility)
        // If it was encrypted with encryptData, we use decryptData here.
        try {
            if (user.contact_number) {
                user.contact_number = decryptData(user.contact_number);
            }
        } catch (decErr) {
            console.error("Decryption failed, showing raw value instead.");
        }

        res.status(200).json({ status: 'success', data: user });
    } catch (error) {
        console.error("PROFILE FETCH ERROR:", error.message);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 42: Get Current Official's Profile
app.get('/api/v1/admin/profile', verifyJWT, async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT official_id, full_name, email_official, username, role, account_status FROM tbl_barangayofficials WHERE user_id = ?',
            [req.user.id]
        );
        if (user.length === 0) return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ status: 'success', data: user[0] });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 42b: Live Security Check (Database Triggered)
app.get('/api/v1/admin/profile/security-check', verifyJWT, async (req, res) => {
    try {
        const [user] = await db.query(
            'SELECT require_password_change, role FROM tbl_barangayofficials WHERE user_id = ?',
            [req.user.id]
        );
        if (user.length === 0) return res.status(404).json({ error: 'Official not found' });
        
        res.status(200).json({ 
            status: 'success', 
            mustChange: user[0].require_password_change === 1,
            role: user[0].role
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 43: Update Profile Password
app.put('/api/v1/admin/profile/password', verifyJWT, async (req, res) => {
    try {
        const { current_password, new_password } = req.body;
        const userId = req.user.id;

        // [Inference] We fetch the current hash to verify identity or allow forced reset
        const [user] = await db.query('SELECT password_hash FROM tbl_BarangayOfficials WHERE user_id = ?', [userId]);

        // [Unverified] This assumes the 'ForcePasswordChange' modal sends the temporary password as current_password
        const hashedCurrent = crypto.createHash('sha256').update(current_password).digest('hex');

        // Skip current password check ONLY if backend logic allows a "forced reset" keyword 
        // OR simply verify the current password provided matches the temp one.
        if (current_password !== 'SYSTEM_FORCED_RESET' && hashedCurrent !== user[0].password_hash) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const hashedNew = crypto.createHash('sha256').update(new_password).digest('hex');

        // CRITICAL: Set require_password_change = 0 so they aren't asked again
        await db.query(
            'UPDATE tbl_BarangayOfficials SET password_hash = ?, require_password_change = 0 WHERE user_id = ?',
            [hashedNew, userId]
        );

        res.status(200).json({ status: 'success', message: 'Password updated and account secured.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 6: FINANCIAL ENCODING & FINAL VALIDATION
// ==========================================

// Endpoint 25: Get Treasurer's Payment Queue (Treasurer / Captain)
app.get('/api/v1/payments/queue', verifyJWT, roleGuard(['Treasurer', 'Captain']), async (req, res) => {
    try {
        const query = `
            SELECT r.request_id, r.reference_no, res.first_name, res.last_name, dt.type_name, dt.base_fee, r.date_requested
            FROM tbl_Requests r
            JOIN tbl_Residents res ON r.resident_id = res.resident_id
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            WHERE r.request_status = 'For Payment'
            ORDER BY r.date_requested ASC
        `;
        const [paymentQueue] = await db.query(query);
        res.status(200).json({ status: 'success', data: paymentQueue });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 25.5: Get All Requests for Admin Queue
app.get('/api/v1/admin/requests', verifyJWT, roleGuard(['Admin', 'Captain', 'Secretary', 'Captain', 'Treasurer']), async (req, res) => {
    try {
        const query = `
            SELECT 
                r.request_id, r.reference_no, r.purpose, r.request_status, r.date_requested,
                dt.type_name, dt.base_fee,
                res.first_name, res.last_name, res.id_proof_image, res.address_street
            FROM tbl_Requests r
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            JOIN tbl_Residents res ON r.resident_id = res.resident_id
            ORDER BY 
                CASE r.request_status 
                    WHEN 'Pending' THEN 1 
                    WHEN 'For Clearance' THEN 2 
                    WHEN 'Processing' THEN 3
                    WHEN 'Ready for Pickup' THEN 4
                    ELSE 5 
                END,
                r.date_requested ASC
        `;

        const [requests] = await db.query(query);
        res.status(200).json({ status: 'success', data: requests });
    } catch (error) {
        console.error("[ADMIN REQUESTS ERROR]:", error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 26.3: Decrypt and Stream Files for Admin Viewing (FIXED)
app.get('/api/v1/admin/view-file/:filename', verifyJWT, roleGuard(['Admin', 'Captain', 'Secretary', 'Captain', 'Treasurer']), async (req, res) => {
    try {
        const { filename } = req.params;

        // Use the utility function correctly by passing just the filename
        const decryptedBuffer = decryptFileBuffer(filename);

        let contentType = 'application/octet-stream';
        if (filename.toLowerCase().includes('.jpg') || filename.toLowerCase().includes('.jpeg')) contentType = 'image/jpeg';
        else if (filename.toLowerCase().includes('.png')) contentType = 'image/png';
        else if (filename.toLowerCase().includes('.pdf')) contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', 'inline');
        res.send(decryptedBuffer);

    } catch (error) {
        console.error("[FILE VIEW ERROR]:", error);
        res.status(404).json({ status: 'error', message: 'File not found or decryption failed.' });
    }
});

// Endpoint 26.4: List Supporting Files for a Specific Reference No
app.get('/api/v1/admin/request-files/:refNo', verifyJWT, roleGuard(['Admin', 'Captain', 'Secretary', 'Captain']), async (req, res) => {
    try {
        const { refNo } = req.params;
        const uploadDir = path.join(__dirname, 'uploads');

        // Scan the directory for files matching 'support_REQ-XXXXXX'
        const files = fs.readdirSync(uploadDir);
        const matchingFiles = files.filter(f => f.includes(`support_${refNo}`));

        res.status(200).json({ status: 'success', files: matchingFiles });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Error scanning files.' });
    }
});

// Endpoint 26: Process a Payment / Update Payment Status (Treasurer / Captain)
app.post('/api/v1/payments', verifyJWT, roleGuard(['Treasurer', 'Captain']), async (req, res) => {
    try {
        const { request_id, amount_paid, or_number, payor_name, payment_status } = req.body;
        const treasurer_id = req.user.id;

        // Ensure critical fields exist
        if (!request_id || amount_paid === undefined || !or_number || !payor_name) {
            return res.status(400).json({ error: 'request_id, amount_paid, or_number, and payor_name are required.' });
        }

        // Apply toggable payment status (defaults to 'Paid' if not supplied)
        const final_status = payment_status || 'Paid';
        if (!['Unpaid', 'Paid', 'Refunded', 'Exempted'].includes(final_status)) {
            return res.status(400).json({ error: "Invalid payment_status. Must be 'Unpaid', 'Paid', 'Refunded', or 'Exempted'." });
        }

        // 1. Upsert the payment record into tbl_Payments (Insert if new, Update if exists)
        const insertPaymentQuery = `
            INSERT INTO tbl_Payments (request_id, amount_paid, or_number, treasurer_id, payment_status, payor_name)
            VALUES (?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                amount_paid = VALUES(amount_paid),
                or_number = VALUES(or_number),
                treasurer_id = VALUES(treasurer_id),
                payment_status = VALUES(payment_status),
                payor_name = VALUES(payor_name)
        `;
        await db.query(insertPaymentQuery, [request_id, amount_paid, or_number, treasurer_id, final_status, payor_name]);

        // 2. Intelligent request routing depending on the payment outcome
        let next_request_status = 'For Payment';
        if (final_status === 'Paid' || final_status === 'Exempted') {
            next_request_status = 'Processing'; // Cleared for printing
        } else if (final_status === 'Refunded') {
            next_request_status = 'Cancelled';
        }

        // Update the request status
        const updateRequestQuery = `
            UPDATE tbl_Requests 
            SET request_status = ? 
            WHERE request_id = ?
        `;
        await db.query(updateRequestQuery, [next_request_status, request_id]);

        res.status(201).json({
            status: 'success',
            message: `Payment successfully encoded as ${final_status}. Request is now ${next_request_status}.`
        });
    } catch (error) {
        // Handle Duplicate OR Number cleanly
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Duplicate entry detected. The OR Number already exists on another transaction.' });
        }
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 27: Mark Document as Exempted / Free (Treasurer / Captain)
app.post('/api/v1/payments/exempt/:request_id', verifyJWT, roleGuard(['Treasurer', 'Captain']), async (req, res) => {
    try {
        const { request_id } = req.params;
        const treasurer_id = req.user.id;
        const { payor_name } = req.body; // usually the resident's name

        if (!payor_name) return res.status(400).json({ error: 'payor_name is required for the audit log.' });

        // Generate a pseudo OR number for exempted logs
        const pseudo_or = `EXEMPT-${Date.now()}`;

        const insertPaymentQuery = `
            INSERT INTO tbl_Payments (request_id, amount_paid, or_number, treasurer_id, payment_status, payor_name)
            VALUES (?, 0.00, ?, ?, 'Exempted', ?)
        `;
        await db.query(insertPaymentQuery, [request_id, pseudo_or, treasurer_id, payor_name]);

        const updateRequestQuery = `
            UPDATE tbl_Requests 
            SET request_status = 'Processing' 
            WHERE request_id = ? AND request_status = 'For Payment'
        `;
        await db.query(updateRequestQuery, [request_id]);

        res.status(201).json({ status: 'success', message: 'Document marked as Exempted/Free. Request is now Processing.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 28: Update Request Status (Approve/Reject)
app.put('/api/v1/admin/requests/:id/status', verifyJWT, roleGuard(['Admin', 'Captain', 'Secretary', 'Treasurer']), async (req, res) => {
    try {
        const { id } = req.params;
        const { new_status, rejection_reason } = req.body;
        const adminId = req.user.id;

        // 1. Get current status for the audit log
        const [current] = await db.query('SELECT request_status, reference_no FROM tbl_Requests WHERE request_id = ?', [id]);
        if (current.length === 0) return res.status(404).json({ status: 'error', message: 'Request not found.' });

        const oldStatus = current[0].request_status;
        const refNo = current[0].reference_no;

        // 2. Update the status and rejection reason (if any)
        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = ?, rejection_reason = ?, processed_by = ? 
            WHERE request_id = ?
        `;
        await db.query(updateQuery, [new_status, rejection_reason || null, adminId, id]);

        // 3. Log the change to the Audit Trail
        await logStatusChange(adminId, id, oldStatus, new_status, `Admin ${new_status} request ${refNo}`);

        res.status(200).json({
            status: 'success',
            message: `Request ${new_status === 'Rejected' ? 'rejected' : 'verified'} successfully.`
        });

    } catch (error) {
        console.error("[STATUS UPDATE ERROR]:", error);
        res.status(500).json({ status: 'error', message: 'Failed to update request status.' });
    }
});

// Endpoint 28: Mark Request as Ready for Pickup (Secretary / Captain)
app.put('/api/v1/requests/:request_id/ready', verifyJWT, roleGuard(['Secretary', 'Captain']), async (req, res) => {
    try {
        const { request_id } = req.params;

        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = 'Ready for Pickup' 
            WHERE request_id = ? AND request_status = 'Processing'
        `;
        const [result] = await db.query(updateQuery, [request_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Request must be in Processing state to be marked as Ready for Pickup.' });
        }

        console.log(`[EMAIL SIMULATION] Your request is printed and Ready for Pickup at the Barangay Hall.`);

        res.status(200).json({ status: 'success', message: 'Request marked as Ready for Pickup.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 29: Issue Document (Secretary / Captain)
app.put('/api/v1/requests/:request_id/issue', verifyJWT, roleGuard(['Secretary', 'Captain']), async (req, res) => {
    try {
        const { request_id } = req.params;

        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = 'Issued', pickup_date = NOW()
            WHERE request_id = ? AND request_status = 'Ready for Pickup'
        `;
        const [result] = await db.query(updateQuery, [request_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Request must be Ready for Pickup before it can be Issued.' });
        }

        res.status(200).json({ status: 'success', message: 'Document successfully issued and recorded in the database.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 7: DOCUMENT GENERATION & CRYPTOGRAPHY
// ==========================================

// Endpoint 30: Signature Vault - Upload Signature (Captain / Captain)
app.post('/api/v1/admin/signatures/upload', verifyJWT, roleGuard(['Captain', 'Captain']), express.raw({ type: 'image/png', limit: '2mb' }), async (req, res) => {
    try {
        if (!Buffer.isBuffer(req.body)) return res.status(400).json({ error: 'No PNG signature provided in binary body.' });

        const filename = `sig_${req.user.id}_${Date.now()}.png.enc`;
        encryptAndSaveFile(req.body, filename);

        // Update tbl_DigitalSignatures
        await db.query(`
            INSERT INTO tbl_DigitalSignatures (official_id, signature_blob, status)
            VALUES (?, ?, 'Active')
            ON DUPLICATE KEY UPDATE signature_blob = VALUES(signature_blob), uploaded_at = NOW()
        `, [req.user.id, filename]);

        res.status(200).json({ status: 'success', message: 'Digital signature securely vaulted.', filename });
    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// Endpoint 30.2: Get My Active Signature (Captain / Captain Only)
app.get('/api/v1/admin/signatures/me', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const [sig] = await db.query(
            "SELECT signature_blob FROM tbl_DigitalSignatures WHERE official_id = ? AND status = 'Active' LIMIT 1",
            [req.user.id]
        );
        res.status(200).json({ status: 'success', data: sig[0] || null });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 34.5: Get All Barangay Officials (Captain Only)
app.get('/api/v1/admin/officials', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const query = `
            SELECT user_id, official_id, full_name, email_official, username, role, account_status, last_login 
            FROM tbl_BarangayOfficials 
            WHERE role != 'Captain'
            ORDER BY full_name ASC
        `;
        const [officials] = await db.query(query);
        res.status(200).json({ status: 'success', data: officials });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 31: PDF Generation & QR Stamping (Secretary / Captain)
app.get('/api/v1/requests/:request_id/generate-pdf', verifyJWT, roleGuard(['Secretary', 'Captain']), async (req, res) => {
    try {
        const { request_id } = req.params;

        // 1. Fetch full request data with resident details, layout_config, AND template_file
        const query = `
            SELECT r.*, res.first_name, res.last_name, res.address_street, dt.type_name, dt.layout_config, dt.template_file
            FROM tbl_Requests r
            JOIN tbl_Residents res ON r.resident_id = res.resident_id
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            WHERE r.request_id = ? AND r.request_status = 'Processing'
        `;
        const [rows] = await db.query(query, [request_id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Request not found or not cleared for printing.' });
        const requestData = rows[0];

        // 2. Parse Layout Config
        let layout = {};
        try {
            layout = JSON.parse(requestData.layout_config || '{}');
        } catch (e) {
            console.error("Layout Config Parse Error, using defaults.");
        }

        // 3. Fetch Active Captain Signature
        const [sigRows] = await db.query("SELECT signature_blob FROM tbl_DigitalSignatures WHERE status = 'Active' LIMIT 1");
        let sigBuffer = null;
        if (sigRows.length > 0) {
            sigBuffer = decryptFileBuffer(sigRows[0].signature_blob);
        }

        // 4. Fetch Document Template (Background) - Phase 7.1 Integration
        let templateBuffer = null;
        if (requestData.template_file) {
            try {
                templateBuffer = decryptFileBuffer(requestData.template_file);
            } catch (e) {
                console.error("Template decryption failed, using blank page:", e.message);
            }
        }

        // 5. Generate Cryptographic QR String (Phase 7.3)
        // Format: Hash(RefNo + Secret) - SHA256 per FR6
        const secretKey = process.env.JWT_SECRET || 'brgy_secret';
        const qrHash = crypto.createHash('sha256').update(requestData.reference_no + secretKey).digest('hex');
        const verificationUrl = `https://brgy-eserbisyo.gov.ph/verify/${qrHash}`;

        // Save hash to DB
        await db.query("UPDATE tbl_Requests SET qr_code_string = ? WHERE request_id = ?", [qrHash, request_id]);

        // 6. Generate the PDF with the layout config and template
        const pdfBuffer = await generateBarangayPDF(requestData, sigBuffer, verificationUrl, layout, templateBuffer);

        // 7. Serve the PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${requestData.reference_no}.pdf`);
        res.send(pdfBuffer);

    } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});



// ==========================================
// PHASE 7: DOCUMENT GENERATION & CRYPTOGRAPHY (Continued)
// ==========================================

// Endpoint 30.5: Template Upload (Background Document Template)
// Using multer for file upload
app.post('/api/v1/admin/document-types/:id/template', verifyJWT, roleGuard(['Captain', 'Secretary']), upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ error: 'No template file uploaded.' });
        }

        const fileBuffer = req.file.buffer;
        const mimetype = req.file.mimetype;

        let fileExtension = '.bin';
        if (mimetype.includes('image/jpeg')) fileExtension = '.jpg';
        else if (mimetype.includes('image/png')) fileExtension = '.png';
        else if (mimetype.includes('application/pdf')) fileExtension = '.pdf';

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const savedFilename = `template_${id}_${uniqueSuffix}${fileExtension}.enc`;

        encryptAndSaveFile(fileBuffer, savedFilename);

        // Update tbl_DocumentTypes.template_file
        await db.query(
            'UPDATE tbl_DocumentTypes SET template_file = ?, updated_by = ? WHERE doc_type_id = ?',
            [savedFilename, req.user.id, id]
        );

        res.status(200).json({
            status: 'success',
            message: 'Document template uploaded and encrypted successfully.',
            filename: savedFilename
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 30.8: Test Print Layout Configurations (Generates Dummy PDF)
app.post('/api/v1/admin/document-types/:id/test-pdf', verifyJWT, roleGuard(['Captain', 'Secretary', 'Admin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { layout_config } = req.body;

        const [docRows] = await db.query('SELECT template_file FROM tbl_DocumentTypes WHERE doc_type_id = ?', [id]);
        if (docRows.length === 0) return res.status(404).json({ error: 'Document type not found.' });

        let templateBuffer = null;
        if (docRows[0].template_file) {
            try {
                templateBuffer = decryptFileBuffer(docRows[0].template_file);
            } catch (e) {
                console.error("Template decryption failed:", e.message);
            }
        }

        const [sigRows] = await db.query("SELECT signature_blob FROM tbl_DigitalSignatures WHERE status = 'Active' LIMIT 1");
        let sigBuffer = null;
        if (sigRows.length > 0) {
            try { sigBuffer = decryptFileBuffer(sigRows[0].signature_blob); } catch (e) { }
        }

        const dummyData = {
            first_name: "JUAN",
            last_name: "DELA CRUZ",
            purpose: "FOR MEDICAL ASSISTANCE",
            reference_no: "TEST-0000-XYZ"
        };

        let parsedLayout = {};
        try {
            parsedLayout = typeof layout_config === 'string' ? JSON.parse(layout_config) : (layout_config || {});
        } catch (e) {
            console.error("Test print layout parse error:", e);
        }

        const pdfBuffer = await generateBarangayPDF(dummyData, sigBuffer, "dummyqrhash123", parsedLayout, templateBuffer);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=test_print.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 32: Public QR Scanner Verification (7.4)
app.get('/api/v1/public/verify/:qr_hash', async (req, res) => {
    try {
        const { qr_hash } = req.params;
        const query = `
            SELECT r.reference_no, r.request_status, dt.type_name, res.first_name, res.last_name, r.pickup_date
            FROM tbl_Requests r
            JOIN tbl_Residents res ON r.resident_id = res.resident_id
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id
            WHERE r.qr_code_string = ?
        `;
        const [rows] = await db.query(query, [qr_hash]);

        if (rows.length === 0) {
            return res.status(200).json({ status: 'invalid', message: 'This document record was not found or may be a forgery.' });
        }

        const doc = rows[0];
        const isValid = (doc.request_status === 'Issued');

        res.status(200).json({
            status: isValid ? 'Valid' : 'Revoked/Invalid',
            message: isValid ? 'This is an authentic Barangay Document.' : 'This document is no longer valid or has not been officially issued.',
            details: {
                reference: doc.reference_no,
                document: doc.type_name,
                owner: `${doc.first_name} ${doc.last_name}`,
                issued_on: doc.pickup_date
            }
        });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// ==========================================
// PHASE 8: SYSTEM ADMINISTRATION & AUDITING
// ==========================================

// Endpoint 33: Create Official Account (Captain Only)
app.post('/api/v1/admin/officials', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const { official_id, full_name, email_official, username, password, role } = req.body;

        // Validate required fields
        if (!official_id || !full_name || !email_official || !username || !password || !role) {
            return res.status(400).json({ error: 'All fields are required: official_id, full_name, email_official, username, password, role' });
        }

        // Validate role
        const validRoles = ['Admin', 'Secretary', 'Treasurer', 'Captain', 'Captain'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
        }

        // Check for duplicate username or email
        const [existing] = await db.query(
            'SELECT user_id FROM tbl_BarangayOfficials WHERE username = ? OR email_official = ?',
            [username, email_official]
        );
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists.' });
        }

        // Hash password and create official
        const hashedPassword = hashPassword(password);

        const insertQuery = `
            INSERT INTO tbl_BarangayOfficials 
            (official_id, full_name, email_official, username, password_hash, role, account_status, require_password_change)
            VALUES (?, ?, ?, ?, ?, ?, 'Active', 1)
        `;

        const [result] = await db.query(insertQuery, [
            official_id, full_name, email_official, username, hashedPassword, role
        ]);

        // Audit Log
        await logAction({
            user_id: req.user.id,
            user_type: 'Official',
            table_affected: 'tbl_BarangayOfficials',
            record_id: result.insertId,
            action_type: 'CREATE',
            old_value: null,
            new_value: { official_id, username, role },
            ip_address: req.ip
        });

        res.status(201).json({
            status: 'success',
            message: `Official account created successfully.`,
            official_id: result.insertId
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 34: Update Official Account Status (Captain Only)
app.put('/api/v1/admin/officials/:id/status', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const { id } = req.params;
        const { account_status } = req.body;

        // Validate status
        const validStatuses = ['Active', 'Inactive', 'Suspended'];
        if (!validStatuses.includes(account_status)) {
            return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        }

        // Get current status for audit
        const [current] = await db.query('SELECT account_status, username, role FROM tbl_BarangayOfficials WHERE user_id = ?', [id]);
        if (current.length === 0) {
            return res.status(404).json({ error: 'Official account not found.' });
        }

        // Prevent Captain from deactivating themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot modify your own account status.' });
        }

        const [result] = await db.query(
            'UPDATE tbl_BarangayOfficials SET account_status = ? WHERE user_id = ?',
            [account_status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Official account not found.' });
        }

        // Audit Log
        await logAction({
            user_id: req.user.id,
            user_type: 'Official',
            table_affected: 'tbl_BarangayOfficials',
            record_id: id,
            action_type: 'STATUS_CHANGE',
            old_value: { account_status: current[0].account_status },
            new_value: { account_status },
            ip_address: req.ip
        });

        res.status(200).json({
            status: 'success',
            message: `Official account status updated to ${account_status}.`
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 35: View Audit Logs (Captain Only) - Forensic Dashboard
// Endpoint 35: View Audit Logs (Captain Only) - Forensic Dashboard
app.get('/api/v1/admin/audit-logs', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        const safeLimit = Math.min(Math.max(limit, 1), 500);

        // UPGRADED QUERY: Joins Officials and Residents tables to pull real names
        const query = `
            SELECT 
                a.log_id, a.user_id, a.user_type, a.table_affected, a.record_id, 
                a.action_type, a.old_value, a.new_value, a.timestamp, a.ip_address,
                o.full_name as official_name, o.role as official_role,
                r.first_name as res_first, r.last_name as res_last
            FROM tbl_AuditLogs a
            LEFT JOIN tbl_BarangayOfficials o ON a.user_id = o.user_id AND a.user_type = 'Official'
            LEFT JOIN tbl_Residents r ON a.user_id = r.resident_id AND a.user_type = 'Resident'
            ORDER BY a.timestamp DESC
            LIMIT ? OFFSET ?
        `;

        const [logs] = await db.query(query, [safeLimit, offset]);

        // Parse JSON fields
        const formattedLogs = logs.map(log => ({
            ...log,
            old_value: log.old_value ? JSON.parse(log.old_value) : null,
            new_value: log.new_value ? JSON.parse(log.new_value) : null
        }));

        res.status(200).json({
            status: 'success',
            data: formattedLogs,
            pagination: { limit: safeLimit, offset: offset }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 34.6: Delete Official Account (Captain and Captain)
app.delete('/api/v1/admin/officials/:id', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent self-deletion to avoid system lockout
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'You cannot delete your own account while logged in.' });
        }

        // Fetch target data for the forensic audit log
        const [target] = await db.query('SELECT username, role FROM tbl_BarangayOfficials WHERE user_id = ?', [id]);
        if (target.length === 0) return res.status(404).json({ error: 'Official not found.' });

        // Log the deletion to tbl_auditlogs before removal
        await logAction({
            user_id: req.user.id,
            user_type: 'Official',
            table_affected: 'tbl_BarangayOfficials',
            record_id: id,
            action_type: 'DELETE',
            old_value: { username: target[0].username, role: target[0].role },
            new_value: null,
            ip_address: req.ip
        });

        // Permanently remove from tbl_BarangayOfficials
        await db.query('DELETE FROM tbl_BarangayOfficials WHERE user_id = ?', [id]);

        res.status(200).json({ status: 'success', message: 'Official account permanently removed.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 33.5: Get All Staff (Captain and Captain)
app.get('/api/v1/admin/officials', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const query = `
            SELECT user_id, official_id, full_name, email_official, username, role, account_status, last_login 
            FROM tbl_BarangayOfficials 
            WHERE role != 'Captain'
            ORDER BY full_name ASC
        `;
        const [officials] = await db.query(query);
        res.status(200).json({ status: 'success', data: officials });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 36: View System Settings (Captain Only)
app.get('/api/v1/admin/settings', verifyJWT, roleGuard(['Captain', 'Captain']), async (req, res) => {
    try {
        const query = `
            SELECT setting_id, setting_key, setting_value, description, category, data_type, is_encrypted, last_updated
            FROM tbl_SystemSettings
            ORDER BY category, setting_key
        `;

        const [settings] = await db.query(query);

        res.status(200).json({
            status: 'success',
            data: settings
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
});