import { getConnection } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. LOGIN ADMIN
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    let conn;
    try {
        conn = await getConnection();

        // Check if Official exists
        const [official] = await conn.query(
            "SELECT * FROM tbl_BarangayOfficials WHERE username = ?", 
            [username]
        );

        if (!official) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, official.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        // Generate Token
        const token = jwt.sign(
            { 
                id: official.official_id, 
                role: official.role,
                is_admin: true 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: {
                name: official.full_name,
                role: official.role,
                position: official.position 
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 2. DASHBOARD STATS
export const getDashboardStats = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();

        const statusQuery = `
            SELECT request_status, COUNT(*) as count 
            FROM tbl_Requests 
            GROUP BY request_status
        `;
        const statusRows = await conn.query(statusQuery);

        const stats = {
            pending: 0,
            processing: 0,
            completed: 0
        };

        statusRows.forEach(row => {
            const status = row.request_status; 
            const count = Number(row.count);

            if (['Pending', 'pending'].includes(status)) {
                stats.pending += count;
            } 
            else if (['Approved', 'approved', 'Paid', 'paid'].includes(status)) {
                stats.processing += count;
            } 
            else if (['Released', 'released', 'Completed', 'completed', 'Rejected'].includes(status)) {
                stats.completed += count;
            }
        });

        res.json({ success: true, stats });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 3. GET ALL REQUESTS (The Missing Function)
export const getAllRequests = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();

        const query = `
            SELECT 
                r.request_id,
                r.doc_type_id, 
                r.reference_no,
                r.purpose,
                r.request_status,
                r.date_requested,
                u.first_name, 
                u.last_name
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            ORDER BY r.date_requested DESC
        `;
        
        // Note: We select first_name/last_name because u.full_name might not exist in your new schema
        const rows = await conn.query(query);
        
        // Optional: Combine names for frontend convenience
        const formattedRows = rows.map(row => ({
            ...row,
            resident_name: `${row.first_name} ${row.last_name}`
        }));

        res.json({ success: true, requests: formattedRows });

    } catch (err) {
        console.error("Fetch Queue Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};