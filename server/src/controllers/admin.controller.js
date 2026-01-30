import { getConnection } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. LOGIN ADMIN
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    let conn;
    try {
        conn = await getConnection();

        if (conn.code == "ECONNREFUSED") {
            return res.status(503).json({ success: false, message: "Database connection failed. Please try again later." });
        }

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

        // 👇 FIXED QUERY: Changed 'r.request_date' to 'r.date_requested'
        const query = `
            SELECT 
                r.request_id,
                r.reference_no,
                r.purpose,
                r.request_status,
                r.date_requested, 
                u.first_name, 
                u.last_name,
                d.type_name,
                d.base_fee
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            ORDER BY r.date_requested DESC
        `;
        
        const rows = await conn.query(query);

        // Combine names for the frontend table
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

// 4. GET SINGLE REQUEST DETAILS (The Missing Piece)
export const getRequestDetails = async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await getConnection();
        
        // Fetch Request + Resident Info + Document Type Info
        const query = `
            SELECT 
                r.*, 
                u.first_name, u.middle_name, u.last_name, u.address_street, u.civil_status, u.contact_number,
                d.type_name, d.base_fee, d.requirements
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            WHERE r.request_id = ?
        `;
        const [request] = await conn.query(query, [id]);

        if (!request) return res.status(404).json({ success: false, message: "Request not found" });

        res.json({ success: true, request });

    } catch (err) {
        console.error("Fetch Details Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 5. UPDATE REQUEST STATUS (The Action Logic)
export const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reason } = req.body; // status = 'Approved', 'Rejected', etc.

    let conn;
    try {
        conn = await getConnection();
        
        // Update the status and set the processed_by to the current admin's ID
        await conn.query(
            "UPDATE tbl_Requests SET request_status = ?, processed_by = ? WHERE request_id = ?",
            [status, req.user.id, id]
        );

        // If Rejected, save the reason
        if (status === 'Rejected' && reason) {
            await conn.query("UPDATE tbl_Requests SET rejection_reason = ? WHERE request_id = ?", [reason, id]);
        }

        res.json({ success: true, message: `Request updated to ${status}` });

    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};