import express from 'express';
import { getConnection } from '../config/db.js';

const router = express.Router();

// GET /api/system/info
router.get('/info', async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        // Query the database
        const rows = await conn.query("SELECT * FROM tbl_SystemSettings WHERE setting_key = 'BARANGAY_NAME'");
        
        // Send response
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Database Error:', error);
        res.status(500).json({ success: false, error: 'Database Connection Failed' });
    } finally {
        if (conn) conn.end(); // Always release the connection back to the pool
    }
});

export default router;