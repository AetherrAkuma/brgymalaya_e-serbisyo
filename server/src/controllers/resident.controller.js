import { getConnection } from '../config/db.js';
import { saveEncryptedFile } from '../middleware/upload.middleware.js';

// 1. SUBMIT NEW REQUEST
export const createRequest = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const { doc_type_id, purpose } = req.body;
        const resident_id = req.user.id; 

        // A. GENERATE REFERENCE NUMBER
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const refNo = `REQ-${dateStr}-${randomSuffix}`;

        // B. FETCH STORAGE PATH FROM SETTINGS
        // This allows the Admin to dictate where files go (C:/, D:/, etc.)
        const [setting] = await conn.query("SELECT setting_value FROM tbl_SystemSettings WHERE setting_key = 'FILE_STORAGE_PATH'");
        const storagePath = setting[0]?.setting_value || './uploads'; // Default if setting is missing

        // C. SAVE ENCRYPTED FILE
        if (req.file) {
            // We pass the dynamic 'storagePath' to the helper
            saveEncryptedFile(req.file.buffer, req.file.originalname, refNo, storagePath);
        }

        // D. SAVE TO DATABASE
        const query = `
            INSERT INTO tbl_Requests 
            (resident_id, doc_type_id, reference_no, purpose, request_status, date_requested) 
            VALUES (?, ?, ?, ?, 'Pending', NOW())
        `;

        await conn.query(query, [resident_id, doc_type_id, refNo, purpose]);

        res.json({ 
            success: true, 
            message: "Request submitted successfully!", 
            reference_no: refNo 
        });

    } catch (err) {
        console.error("Submit Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 2. GET MY REQUESTS (For Resident Dashboard)
export const getMyRequests = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const resident_id = req.user.id;

        const query = `
            SELECT 
                r.request_id, 
                r.reference_no, 
                d.type_name, 
                r.request_status, 
                r.date_requested, 
                d.base_fee
            FROM tbl_Requests r
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            WHERE r.resident_id = ?
            ORDER BY r.date_requested DESC
        `;

        const [requests] = await conn.query(query, [resident_id]);

        res.json({ success: true, requests });

    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};