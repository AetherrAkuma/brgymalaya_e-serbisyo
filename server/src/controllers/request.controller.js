import { getConnection } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

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

// POST /api/requests/create
export const createRequest = async (req, res) => {
    // We get resident_id from the middleware (req.user)
    const resident_id = req.user.id; 
    const { doc_type_id, purpose } = req.body;

    // Generate a Reference Number (e.g., REQ-173772...)
    const reference_no = `REQ-${Date.now().toString().slice(-6)}`;

    let conn;
    try {
        conn = await getConnection();

        // Check if doc_type exists
        const checkDoc = await conn.query("SELECT * FROM tbl_DocumentTypes WHERE doc_type_id = ?", [doc_type_id]);
        if (checkDoc.length === 0) return res.status(400).json({ message: "Invalid Document Type" });

        // Insert Request
        const query = `
            INSERT INTO tbl_Requests 
            (resident_id, doc_type_id, reference_no, purpose, request_status)
            VALUES (?, ?, ?, ?, 'Pending')
        `;

        await conn.query(query, [resident_id, doc_type_id, reference_no, purpose]);

        res.status(201).json({ 
            success: true, 
            message: "Request Submitted Successfully",
            reference_no: reference_no
        });

    } catch (err) {
        console.error("Create Request Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// GET /api/requests/history
export const getMyRequests = async (req, res) => {
    const resident_id = req.user.id; 

    let conn;
    try {
        conn = await getConnection();
        
        // We JOIN tables to get the text name of the document (not just the ID)
        const query = `
            SELECT 
                r.request_id, 
                r.reference_no, 
                d.type_name, 
                r.request_status, 
                r.request_date,
                d.base_fee
            FROM tbl_Requests r
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            WHERE r.resident_id = ?
            ORDER BY r.request_date DESC
        `;

        const rows = await conn.query(query, [resident_id]);
        res.json({ success: true, data: rows });

    } catch (err) {
        console.error("History Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

