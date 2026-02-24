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

// Test the connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Connected to MariaDB/MySQL securely.');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err.message);
    });

module.exports = pool;