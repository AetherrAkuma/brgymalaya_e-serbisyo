const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// PHASE 1.1: TESTING ENDPOINTS
// ==========================================

// Endpoint 1: Health check to ensure API is running
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ status: 'success', message: 'E-Serbisyo API is running.' });
});

// Endpoint 2: Initialize Database Tables (Reads schema.sql and executes it)
app.post('/api/v1/setup/database', async (req, res) => {
    try {
        // Read the SQL file
        const sqlPath = path.join(__dirname, 'schema.sql');
        const sqlQuery = fs.readFileSync(sqlPath, 'utf8');

        // Execute the queries
        await db.query(sqlQuery);
        
        // Fetch the created tables to prove it worked
        const [tables] = await db.query('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);

        res.status(200).json({
            status: 'success',
            message: 'Database schema successfully initialized.',
            tablesCreated: tableNames
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Failed to initialize database.',
            error: error.message
        });
    }
});

// Endpoint 3: Check Database Health (Verify Tables)
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

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 E-Serbisyo Server is running on http://localhost:${PORT}`);
    console.log(`👉 Step 1: Send a POST request to http://localhost:${PORT}/api/v1/setup/database to create the tables.`);
    console.log(`👉 Step 2: Send a GET request to http://localhost:${PORT}/api/v1/health/db to verify them.`);
});