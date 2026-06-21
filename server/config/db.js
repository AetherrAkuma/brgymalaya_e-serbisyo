const mysql = require('mysql2/promise');
require('dotenv').config();

// Create the connection pool (DAL Layer Pattern)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'eserbisyo_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Required to run the schema.sql file
});

let isDbConnected = false;
let firstCheck = true;

async function checkConnection() {
    try {
        const connection = await pool.getConnection();
        connection.release();
        if (!isDbConnected) {
            console.log('✅ Connected to MariaDB/MySQL securely.');
            isDbConnected = true;
        }
    } catch (err) {
        if (isDbConnected || firstCheck) {
            console.error(`❌ Database connection failed/offline: ${err.message}. Retrying...`);
            isDbConnected = false;
        }
    } finally {
        firstCheck = false;
        // Ping every 10 seconds (respecting resource usage and rate limits)
        setTimeout(checkConnection, 10000);
    }
}

// Start continuous background checking
checkConnection();

module.exports = pool;