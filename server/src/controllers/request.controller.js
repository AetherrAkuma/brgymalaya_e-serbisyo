import { getConnection } from '../config/db.js';

// GET /api/requests/types
export const getDocumentTypes = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        // Fetch only "Available" documents
        const types = await conn.query("SELECT * FROM tbl_DocumentTypes WHERE is_available = TRUE");
        
        res.json({ 
            success: true, 
            data: types 
        });
    } catch (err) {
        console.error("Error fetching doc types:", err);
        res.status(500).json({ success: false, message: "Database Error" });
    } finally {
        if (conn) conn.end();
    }
};