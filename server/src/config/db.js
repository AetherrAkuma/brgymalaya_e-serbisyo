import mariadb from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

// Create the Connection Pool
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT) || 3307,
    connectionLimit: 5
});

export async function getConnection() {
    try {
        const conn = await pool.getConnection();
        return conn;
    } catch (err) {
        console.error('[Database Error] Connection failed:', err);
        // give the error to the caller to print on frontend
        throw err;
    }
}

console.log('[Architecture] Data Access Layer (DAL) Initialized');