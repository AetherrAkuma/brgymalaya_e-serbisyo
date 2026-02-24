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
// const upload = require('./middleware/upload'); // <-- Commented out as we are using raw binary now
const { encryptAndSaveFile, decryptFileBuffer } = require('./utils/fileCrypto');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// NEW: Safety Net Middleware for JSON Parsing Errors (Fixes the PNG/JSON crash)
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({ 
            error: 'Malformed JSON or incorrect Content-Type header. If uploading a file, uncheck Content-Type in your headers and use form-data.' 
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

// Endpoint 8: Upload a file securely (Encrypts at rest) using RAW BINARY
app.post('/api/v1/files/upload', express.raw({ type: ['image/jpeg', 'image/png', 'application/pdf', 'application/octet-stream'], limit: '5mb' }), (req, res) => {
    try {
        // Since we are using raw binary upload, the file buffer is directly in req.body
        if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: 'No file uploaded. Ensure you are sending raw binary data and the correct Content-Type.' });
        }

        // Determine extension from the Content-Type header
        const contentType = req.headers['content-type'] || 'application/octet-stream';
        let fileExtension = '.bin';
        if (contentType.includes('image/jpeg')) fileExtension = '.jpg';
        else if (contentType.includes('image/png')) fileExtension = '.png';
        else if (contentType.includes('application/pdf')) fileExtension = '.pdf';

        // Create a unique filename with a .enc extension to denote it is encrypted
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const savedFilename = `secure_${uniqueSuffix}${fileExtension}.enc`;

        // Encrypt the raw buffer and save it
        encryptAndSaveFile(req.body, savedFilename);

        res.status(200).json({
            status: 'success',
            message: 'File encrypted and saved successfully using raw binary upload.',
            filename: savedFilename,
            original_type: contentType
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// Endpoint 9: View a secure file (Decrypts in-memory, requires authorization)
app.get('/api/v1/files/:filename', verifyJWT, roleGuard(['Super Admin', 'Secretary', 'Treasurer', 'Captain']), (req, res) => {
    try {
        const filename = req.params.filename;
        
        // Decrypt the file back to its original buffer
        const decryptedBuffer = decryptFileBuffer(filename);

        // Guess the mime type based on the filename (removing the .enc part)
        let mimeType = 'application/octet-stream';
        if (filename.includes('.png')) mimeType = 'image/png';
        else if (filename.includes('.jpg') || filename.includes('.jpeg')) mimeType = 'image/jpeg';
        else if (filename.includes('.pdf')) mimeType = 'application/pdf';

        // Send the decrypted buffer directly to the browser
        res.setHeader('Content-Type', mimeType);
        res.send(decryptedBuffer);

    } catch (error) {
        res.status(404).json({ status: 'error', message: error.message });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
    console.log(`👉 Test File Upload: POST http://localhost:${PORT}/api/v1/files/upload (use Binary tab)`);
});