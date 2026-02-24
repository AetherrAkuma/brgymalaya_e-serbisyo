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

app.use(cors());
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

app.get('/api/v1/test/super-admin-only', verifyJWT, roleGuard(['Super Admin']), (req, res) => {
    res.status(200).json({ message: 'Welcome Super Admin!', user: req.user });
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

app.get('/api/v1/files/:filename', verifyJWT, roleGuard(['Super Admin', 'Secretary', 'Treasurer', 'Captain']), (req, res) => {
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
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email address is already registered.' });
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

app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email_or_username, password } = req.body;

        if (!email_or_username || !password) {
            return res.status(400).json({ error: 'Please provide email/username and password.' });
        }

        const hashedPassword = hashPassword(password);

        // 1. Check Officials Table
        const [officials] = await db.query(
            'SELECT user_id, full_name, username, role, account_status FROM tbl_BarangayOfficials WHERE (email_official = ? OR username = ?) AND password_hash = ?',
            [email_or_username, email_or_username, hashedPassword]
        );

        if (officials.length > 0) {
            const official = officials[0];
            if (official.account_status !== 'Active') return res.status(403).json({ error: `Account is ${official.account_status}. Please contact the Super Admin.` });
            
            await db.query('UPDATE tbl_BarangayOfficials SET last_login = NOW() WHERE user_id = ?', [official.user_id]);
            const token = generateToken({ id: official.user_id, role: official.role, username: official.username });
            return res.status(200).json({ status: 'success', message: 'Official login successful', token, role: official.role });
        }

        // 2. Check Residents Table
        const [residents] = await db.query(
            'SELECT resident_id, first_name, last_name, email_address, account_status FROM tbl_Residents WHERE email_address = ? AND password_hash = ?',
            [email_or_username, hashedPassword]
        );

        if (residents.length > 0) {
            const resident = residents[0];
            if (resident.account_status === 'Pending') return res.status(403).json({ error: 'Your account is still pending verification by Barangay Officials.' });
            if (resident.account_status === 'Blocked') return res.status(403).json({ error: 'Your account has been blocked. Please visit the Barangay Hall.' });

            const token = generateToken({ id: resident.resident_id, role: 'Resident', username: resident.email_address });
            return res.status(200).json({ status: 'success', message: 'Resident login successful', token, role: 'Resident' });
        }

        return res.status(401).json({ error: 'Invalid credentials. Please check your username/email and password.' });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.post('/api/v1/setup/superadmin', async (req, res) => {
    try {
        const hashedPassword = hashPassword('SuperAdmin123');
        const [existing] = await db.query('SELECT * FROM tbl_BarangayOfficials WHERE username = ?', ['superadmin']);
        
        if (existing.length > 0) return res.status(400).json({ error: 'Super Admin account already exists.' });

        const query = `
            INSERT INTO tbl_BarangayOfficials (official_id, full_name, email_official, username, password_hash, role, account_status)
            VALUES ('SA-001', 'System Administrator', 'admin@eserbisyo.com', 'superadmin', ?, 'Super Admin', 'Active')
        `;
        
        await db.query(query, [hashedPassword]);
        res.status(201).json({ status: 'success', message: 'Default Super Admin created.', credentials: { username: 'superadmin', password: 'SuperAdmin123' } });
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
            SELECT announcement_id, title, content_body, image_path, target_audience, is_pinned, date_posted
            FROM tbl_Announcements 
            WHERE status = 'Published' 
              AND (expiry_date IS NULL OR expiry_date > NOW())
            ORDER BY is_pinned DESC, date_posted DESC
        `;
        const [announcements] = await db.query(query);
        res.status(200).json({ status: 'success', data: announcements });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

app.get('/api/v1/public/document-types', async (req, res) => {
    try {
        const query = `
            SELECT doc_type_id, type_name, description, base_fee, requirements, validity_days 
            FROM tbl_DocumentTypes 
            WHERE is_available = TRUE
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

// Endpoint 17: Update a System Setting (Super Admin Only)
app.put('/api/v1/admin/settings/:setting_key', verifyJWT, roleGuard(['Super Admin']), async (req, res) => {
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

// Endpoint 18: Create a Document Type (Super Admin, Secretary)
app.post('/api/v1/admin/document-types', verifyJWT, roleGuard(['Super Admin', 'Secretary']), async (req, res) => {
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

// Endpoint 19: Update a Document Type
app.put('/api/v1/admin/document-types/:id', verifyJWT, roleGuard(['Super Admin', 'Secretary']), async (req, res) => {
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

// NEW Endpoint 19.5: Update Document Layout Config (Super Admin / Secretary)
app.put('/api/v1/admin/document-types/:id/layout', verifyJWT, roleGuard(['Super Admin', 'Secretary']), async (req, res) => {
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

// Endpoint 20: Create an Announcement (Super Admin, Captain, Secretary)
app.post('/api/v1/admin/announcements', verifyJWT, roleGuard(['Super Admin', 'Secretary', 'Captain']), async (req, res) => {
    try {
        const { title, content_body, target_audience, is_pinned, status, expiry_date } = req.body;

        if (!title || !content_body) return res.status(400).json({ error: 'title and content_body are required.' });

        const insertQuery = `
            INSERT INTO tbl_Announcements 
            (title, content_body, target_audience, is_pinned, status, expiry_date, posted_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(insertQuery, [
            title, content_body, target_audience || 'All', is_pinned || false, 
            status || 'Draft', expiry_date || null, req.user.id
        ]);

        res.status(201).json({ status: 'success', message: 'Announcement created successfully.' });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 20.5: Manage Resident Account Status (Super Admin / Secretary)
app.put('/api/v1/admin/residents/:id/status', verifyJWT, roleGuard(['Super Admin', 'Secretary']), async (req, res) => {
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
app.post('/api/v1/requests', verifyJWT, roleGuard(['Resident']), async (req, res) => {
    try {
        const { doc_type_id, purpose } = req.body;
        const resident_id = req.user.id; // Automatically grabbed securely from the JWT

        if (!doc_type_id || !purpose) {
            return res.status(400).json({ error: 'doc_type_id and purpose are required.' });
        }

        // Active Request Constraint (5.2): Check if Resident already has a pending/processing request for this EXACT document type
        const [existingActive] = await db.query(`
            SELECT request_id FROM tbl_Requests 
            WHERE resident_id = ? AND doc_type_id = ? 
            AND request_status IN ('Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup')
        `, [resident_id, doc_type_id]);

        if (existingActive.length > 0) {
            return res.status(403).json({ 
                error: 'You already have an active request for this document type. Please wait for it to be completed or rejected before filing another.' 
            });
        }

        // Generate a Unique Reference Number (e.g., REQ-20260130-1234)
        const dateString = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(1000 + Math.random() * 9000);
        const reference_no = `REQ-${dateString}-${randomStr}`;

        // Insert the Request
        const insertQuery = `
            INSERT INTO tbl_Requests (resident_id, doc_type_id, reference_no, purpose, request_status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;
        const [result] = await db.query(insertQuery, [resident_id, doc_type_id, reference_no, purpose]);

        // Email Hook Simulation (5.4)
        console.log(`[EMAIL SIMULATION] Sent to Resident ID ${resident_id}: Your request ${reference_no} has been received and is Pending Verification.`);

        res.status(201).json({ 
            status: 'success', 
            message: 'Document request submitted successfully.',
            reference_no: reference_no,
            request_id: result.insertId
        });

    } catch (error) {
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

// Endpoint 23: Get Pending Requests (Secretary / Super Admin)
app.get('/api/v1/requests/pending', verifyJWT, roleGuard(['Secretary', 'Super Admin']), async (req, res) => {
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

// Endpoint 24: Initial Verification (Secretary / Super Admin)
app.put('/api/v1/requests/:request_id/verify', verifyJWT, roleGuard(['Secretary', 'Super Admin']), async (req, res) => {
    try {
        const { action, rejection_reason } = req.body; // action: 'Approve' or 'Reject'
        const { request_id } = req.params;
        const official_id = req.user.id;

        if (!['Approve', 'Reject'].includes(action)) {
            return res.status(400).json({ error: "Invalid action. Must be 'Approve' or 'Reject'." });
        }

        if (action === 'Reject' && !rejection_reason) {
            return res.status(400).json({ error: "A rejection_reason is required when rejecting a request." });
        }

        // Get document type info to check the fee
        const [reqData] = await db.query(`
            SELECT r.resident_id, dt.base_fee 
            FROM tbl_Requests r 
            JOIN tbl_DocumentTypes dt ON r.doc_type_id = dt.doc_type_id 
            WHERE r.request_id = ?
        `, [request_id]);

        if (reqData.length === 0) return res.status(404).json({ error: 'Request not found.' });

        const resident_id = reqData[0].resident_id;
        const base_fee = parseFloat(reqData[0].base_fee);
        
        let newStatus = '';
        if (action === 'Reject') {
            newStatus = 'Rejected';
        } else if (action === 'Approve') {
            // All approved requests must route to the Treasurer for transaction logging, even if free
            newStatus = 'For Payment'; 
        }

        const updateQuery = `
            UPDATE tbl_Requests 
            SET request_status = ?, rejection_reason = ?, processed_by = ?
            WHERE request_id = ? AND request_status = 'Pending'
        `;
        const [result] = await db.query(updateQuery, [newStatus, rejection_reason || null, official_id, request_id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({ error: 'Request is either already processed or does not exist.' });
        }

        // Email Hook Simulation (5.4)
        console.log(`[EMAIL SIMULATION] Sent to Resident ID ${resident_id}: Your request status is now ${newStatus}.`);

        res.status(200).json({ 
            status: 'success', 
            message: `Request successfully marked as ${newStatus}.`,
            routed_to: newStatus
        });

    } catch (error) {
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

// ==========================================
// PHASE 6: FINANCIAL ENCODING & FINAL VALIDATION
// ==========================================

// Endpoint 25: Get Treasurer's Payment Queue (Treasurer / Super Admin)
app.get('/api/v1/payments/queue', verifyJWT, roleGuard(['Treasurer', 'Super Admin']), async (req, res) => {
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

// Endpoint 26: Process a Payment / Update Payment Status (Treasurer / Super Admin)
app.post('/api/v1/payments', verifyJWT, roleGuard(['Treasurer', 'Super Admin']), async (req, res) => {
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

// Endpoint 27: Mark Document as Exempted / Free (Treasurer / Super Admin)
app.post('/api/v1/payments/exempt/:request_id', verifyJWT, roleGuard(['Treasurer', 'Super Admin']), async (req, res) => {
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

// Endpoint 28: Mark Request as Ready for Pickup (Secretary / Super Admin)
app.put('/api/v1/requests/:request_id/ready', verifyJWT, roleGuard(['Secretary', 'Super Admin']), async (req, res) => {
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

// Endpoint 29: Issue Document (Secretary / Super Admin)
app.put('/api/v1/requests/:request_id/issue', verifyJWT, roleGuard(['Secretary', 'Super Admin']), async (req, res) => {
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

// Endpoint 30: Signature Vault - Upload Signature (Super Admin / Captain)
app.post('/api/v1/admin/signatures/upload', verifyJWT, roleGuard(['Super Admin', 'Captain']), express.raw({ type: 'image/png', limit: '2mb' }), async (req, res) => {
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

// Endpoint 31: PDF Generation & QR Stamping (Secretary / Super Admin)
app.get('/api/v1/requests/:request_id/generate-pdf', verifyJWT, roleGuard(['Secretary', 'Super Admin']), async (req, res) => {
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
app.post('/api/v1/admin/document-types/:id/template', verifyJWT, roleGuard(['Super Admin', 'Secretary']), upload.single('file'), async (req, res) => {
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

// Endpoint 33: Create Official Account (Super Admin Only)
app.post('/api/v1/admin/officials', verifyJWT, roleGuard(['Super Admin']), async (req, res) => {
    try {
        const { official_id, full_name, email_official, username, password, role } = req.body;

        // Validate required fields
        if (!official_id || !full_name || !email_official || !username || !password || !role) {
            return res.status(400).json({ error: 'All fields are required: official_id, full_name, email_official, username, password, role' });
        }

        // Validate role
        const validRoles = ['Secretary', 'Treasurer', 'Captain'];
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
            (official_id, full_name, email_official, username, password_hash, role, account_status)
            VALUES (?, ?, ?, ?, ?, ?, 'Active')
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

// Endpoint 34: Update Official Account Status (Super Admin Only)
app.put('/api/v1/admin/officials/:id/status', verifyJWT, roleGuard(['Super Admin']), async (req, res) => {
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

        // Prevent Super Admin from deactivating themselves
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

// Endpoint 35: View Audit Logs (Super Admin Only) - Forensic Dashboard
app.get('/api/v1/admin/audit-logs', verifyJWT, roleGuard(['Super Admin']), async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;
        
        // Ensure reasonable limits
        const safeLimit = Math.min(Math.max(limit, 1), 500);
        
        const query = `
            SELECT log_id, user_id, user_type, table_affected, record_id, action_type, old_value, new_value, timestamp, ip_address
            FROM tbl_AuditLogs
            ORDER BY timestamp DESC
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
            pagination: {
                limit: safeLimit,
                offset: offset
            }
        });
    } catch (error) { 
        res.status(500).json({ status: 'error', message: error.message }); 
    }
});

// Endpoint 36: View System Settings (Super Admin Only)
app.get('/api/v1/admin/settings', verifyJWT, roleGuard(['Super Admin']), async (req, res) => {
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