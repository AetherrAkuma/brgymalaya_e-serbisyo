const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

// Import our Phase 1.2 Cryptography Utilities
const { hashPassword, encryptData, decryptData } = require('./utils/crypto');

// Import our Phase 1.3 Security Middleware
const { generateToken, verifyJWT, roleGuard } = require('./middleware/auth');
const { sqlSanitizer } = require('./middleware/sanitizer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(sqlSanitizer); // Applies sanitization globally to ALL incoming JSON and queries

// ==========================================
// PHASE 1.1: DATABASE ENDPOINTS
// ==========================================

app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'E-Serbisyo API is running.' });
});

app.post('/api/v1/setup/database', async (req, res) => {
    try {
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');
        await db.query(sqlQuery);
        const [tables] = await db.query('SHOW TABLES');
        res.status(200).json({
            status: 'success',
            message: 'Database schema successfully initialized.',
            tablesCreated: tables.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Failed to initialize database.', error: error.message });
    }
});

app.get('/api/v1/health/db', async (req, res) => {
    try {
        const [tables] = await db.query('SHOW TABLES');
        res.status(200).json({ 
            status: 'success', 
            database: process.env.DB_NAME || 'eserbisyo_db',
            tableCount: tables.length,
            tables: tables.map(t => Object.values(t)[0])
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 1.2: CRYPTOGRAPHY TESTING ENDPOINT
// ==========================================

// Endpoint 4: Test Cryptography Engine (FR6)
app.post('/api/v1/test/crypto', (req, res) => {
    try {
        const { password, sensitive_data } = req.body;

        // Validation
        if (!password || !sensitive_data) {
            return res.status(400).json({ 
                error: "Please provide 'password' and 'sensitive_data' in the JSON body." 
            });
        }

        // Process data through our utils
        const hashedPassword = hashPassword(password);
        const encryptedData = encryptData(sensitive_data);
        const decryptedData = decryptData(encryptedData);

        // Return the results to prove it works
        res.status(200).json({
            status: 'success',
            message: 'Cryptography engine verified successfully.',
            sha256_test: {
                original_password: password,
                hashed_password: hashedPassword
            },
            aes256_test: {
                original_data: sensitive_data,
                encrypted_string: encryptedData,
                decrypted_data: decryptedData,
                is_match: sensitive_data === decryptedData
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
});

// ==========================================
// PHASE 1.3: TESTING RBAC & MIDDLEWARE
// ==========================================

// Endpoint 5: Generate a dummy token to test roles
app.post('/api/v1/test/generate-token', (req, res) => {
    const { id, role, username } = req.body;
    if (!id || !role || !username) {
        return res.status(400).json({ error: "Provide id, role, and username to generate a token." });
    }
    const token = generateToken({ id, role, username });
    res.status(200).json({ status: 'success', token });
});

// Endpoint 6: Test strict Super Admin access
app.get('/api/v1/test/super-admin-only', verifyJWT, roleGuard(['Super Admin']), (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Welcome Super Admin! RBAC is working properly.',
        user: req.user
    });
});

// Endpoint 7: Test Staff access (Secretary or Treasurer)
app.get('/api/v1/test/staff-only', verifyJWT, roleGuard(['Secretary', 'Treasurer', 'Super Admin']), (req, res) => {
    res.status(200).json({ 
        status: 'success', 
        message: 'Welcome Staff Member! RBAC is working properly.',
        user: req.user
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
    console.log(`👉 Test Crypto: POST http://localhost:${PORT}/api/v1/test/crypto`);
    console.log(`👉 Test Token Generation: POST http://localhost:${PORT}/api/v1/test/generate-token`);
});