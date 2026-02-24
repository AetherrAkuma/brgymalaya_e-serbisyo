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

// Endpoint 10: Resident Registration (FR2)
app.post('/api/v1/auth/resident/register', async (req, res) => {
    try {
        const {
            first_name, middle_name, last_name, date_of_birth,
            civil_status, address_street, email_address, contact_number, password
        } = req.body;

        // Basic validation
        if (!first_name || !last_name || !date_of_birth || !civil_status || !address_street || !email_address || !contact_number || !password) {
            return res.status(400).json({ error: 'All required fields must be provided.' });
        }

        // Check if email already exists
        const [existing] = await db.query('SELECT resident_id FROM tbl_Residents WHERE email_address = ?', [email_address]);
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email address is already registered.' });
        }

        // Apply Cryptography
        const hashedPassword = hashPassword(password);
        const encryptedContact = encryptData(contact_number);

        // Insert Resident (Status defaults to 'Pending' via database schema, but explicit here for clarity)
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

// Endpoint 11: Universal Login (FR1 & FR2)
app.post('/api/v1/auth/login', async (req, res) => {
    try {
        const { email_or_username, password } = req.body;

        if (!email_or_username || !password) {
            return res.status(400).json({ error: 'Please provide email/username and password.' });
        }

        const hashedPassword = hashPassword(password);

        // 1. Check Officials Table First (Admins)
        const [officials] = await db.query(
            'SELECT user_id, full_name, username, role, account_status FROM tbl_BarangayOfficials WHERE (email_official = ? OR username = ?) AND password_hash = ?',
            [email_or_username, email_or_username, hashedPassword]
        );

        if (officials.length > 0) {
            const official = officials[0];
            
            if (official.account_status !== 'Active') {
                return res.status(403).json({ error: `Account is ${official.account_status}. Please contact the Super Admin.` });
            }

            // Update last login timestamp
            await db.query('UPDATE tbl_BarangayOfficials SET last_login = NOW() WHERE user_id = ?', [official.user_id]);

            const token = generateToken({ id: official.user_id, role: official.role, username: official.username });
            return res.status(200).json({ status: 'success', message: 'Official login successful', token, role: official.role });
        }

        // 2. Check Residents Table if not found in Officials
        const [residents] = await db.query(
            'SELECT resident_id, first_name, last_name, email_address, account_status FROM tbl_Residents WHERE email_address = ? AND password_hash = ?',
            [email_or_username, hashedPassword]
        );

        if (residents.length > 0) {
            const resident = residents[0];
            
            // Check Account Status Rules
            if (resident.account_status === 'Pending') {
                return res.status(403).json({ error: 'Your account is still pending verification by Barangay Officials.' });
            }
            if (resident.account_status === 'Blocked') {
                return res.status(403).json({ error: 'Your account has been blocked. Please visit the Barangay Hall.' });
            }

            const token = generateToken({ id: resident.resident_id, role: 'Resident', username: resident.email_address });
            return res.status(200).json({ status: 'success', message: 'Resident login successful', token, role: 'Resident' });
        }

        // 3. No match found in either table
        return res.status(401).json({ error: 'Invalid credentials. Please check your username/email and password.' });

    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 12: Seed Default Super Admin (For initial testing)
app.post('/api/v1/setup/superadmin', async (req, res) => {
    try {
        const hashedPassword = hashPassword('SuperAdmin123');
        const [existing] = await db.query('SELECT * FROM tbl_BarangayOfficials WHERE username = ?', ['superadmin']);
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Super Admin account already exists.' });
        }

        const query = `
            INSERT INTO tbl_BarangayOfficials (official_id, full_name, email_official, username, password_hash, role, account_status)
            VALUES ('SA-001', 'System Administrator', 'admin@eserbisyo.com', 'superadmin', ?, 'Super Admin', 'Active')
        `;
        
        await db.query(query, [hashedPassword]);
        res.status(201).json({ 
            status: 'success', 
            message: 'Default Super Admin created.',
            credentials: { username: 'superadmin', password: 'SuperAdmin123' }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
    console.log(`👉 Phase 2 Setup: POST http://localhost:${PORT}/api/v1/setup/superadmin`);
});