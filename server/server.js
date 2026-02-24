const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

// Phase 1.2 Utilities
const { hashPassword, encryptData, decryptData } = require('./utils/crypto');
// Phase 1.3 Middleware
const { generateToken, verifyJWT, roleGuard } = require('./middleware/auth');
const { sqlSanitizer } = require('./middleware/sanitizer');
// Phase 1.4 File Handling
const { encryptAndSaveFile, decryptFileBuffer } = require('./utils/fileCrypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Safety Net Middleware for JSON Parsing Errors (Fixes the PNG/JSON crash)
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

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
    console.log(`👉 Phase 3 Setup: POST http://localhost:${PORT}/api/v1/setup/seed-public`);
});