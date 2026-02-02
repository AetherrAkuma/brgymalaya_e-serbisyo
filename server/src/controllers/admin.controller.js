import { getConnection } from '../config/db.js';
import { getDecryptedFile } from '../middleware/upload.middleware.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { logAction } from '../services/audit.service.js';


// HELPER: Scan the 'uploads' folder to find a file matching the Reference No.
const findFileForRequest = (refNo) => {
    const uploadDir = './uploads'; 
    if (!fs.existsSync(uploadDir)) return null;
    
    const files = fs.readdirSync(uploadDir);
    // Look for file starting with "REQ-XXXX_"
    return files.find(file => file.startsWith(`${refNo}_`));
};

// 1. LOGIN ADMIN
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    let conn;
    try {
        conn = await getConnection();
        const [official] = await conn.query("SELECT * FROM tbl_BarangayOfficials WHERE username = ?", [username]);

        if (!official) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const isMatch = await bcrypt.compare(password, official.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid Credentials" });

        const token = jwt.sign(
            { id: official.user_id, role: official.role, is_admin: true }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' }
        );

        res.json({
            success: true,
            token,
            user: { name: official.full_name, role: official.role, position: official.position }
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
        const statusRows = await conn.query("SELECT request_status, COUNT(*) as count FROM tbl_Requests GROUP BY request_status");

        const stats = { pending: 0, processing: 0, completed: 0 };

        statusRows.forEach(row => {
            const status = row.request_status; 
            const count = Number(row.count);
            if (['Pending', 'pending'].includes(status)) stats.pending += count;
            else if (['Approved', 'approved', 'Paid', 'paid', 'ForPayment'].includes(status)) stats.processing += count;
            else if (['Released', 'released', 'Completed', 'completed', 'Rejected'].includes(status)) stats.completed += count;
        });

        res.json({ success: true, stats });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 3. GET ALL REQUESTS (Updated with File Scanning)
export const getAllRequests = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();

        const query = `
            SELECT 
                r.request_id, r.reference_no, r.purpose, r.request_status, r.date_requested, 
                u.first_name, u.last_name,
                d.type_name, d.base_fee
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            ORDER BY r.date_requested DESC
        `;
        
        const rows = await conn.query(query);

        // MAP: Add 'attachment_found' by checking the hard drive
        const formattedRows = rows.map(row => ({
            ...row,
            resident_name: `${row.first_name} ${row.last_name}`,
            attachment_found: findFileForRequest(row.reference_no) // <--- THIS IS THE FIX
        }));

        res.json({ success: true, requests: formattedRows });

    } catch (err) {
        console.error("Fetch Queue Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 4. GET SINGLE REQUEST DETAILS
export const getRequestDetails = async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await getConnection();
        
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

        // Check for file here too, just in case
        request.attachment_found = findFileForRequest(request.reference_no);

        res.json({ success: true, request });

    } catch (err) {
        console.error("Fetch Details Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 5. UPDATE REQUEST STATUS
export const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    // Treasurer inputs: OR Number & Amount
    const { status, reason, or_number, amount_paid } = req.body; 

    let conn;
    try {
        conn = await getConnection();
        
        // --- 🛡️ SECURITY CHECK: PREVENT DUPLICATE RECEIPTS ---
        if (status === 'Approved' && or_number) {
            // Check if this OR Number already exists in the system
            const [dupeCheck] = await conn.query(
                "SELECT payment_id FROM tbl_Payments WHERE or_number = ?", 
                [or_number]
            );
            
            if (dupeCheck.length > 0) {
                // STOP THE PROCESS IMMEDIATELY
                return res.status(400).json({ 
                    success: false, 
                    message: `SECURITY ALERT: OR Number ${or_number} has already been used!` 
                });
            }
        }
        // -------------------------------------------------------

        // 1. Update the Main Request Status
        await conn.query(
            "UPDATE tbl_Requests SET request_status = ?, processed_by = ? WHERE request_id = ?",
            [status, req.user.id, id]
        );

        // 2. If Rejected, save the reason
        if (status === 'Rejected' && reason) {
            await conn.query("UPDATE tbl_Requests SET rejection_reason = ? WHERE request_id = ?", [reason, id]);
        }

        // 3. IF APPROVED (TREASURER CONFIRMED PAYMENT): Save to Money Table
        if (status === 'Approved' && or_number && amount_paid) {
            // Double check we don't pay twice for the same request
            const [existing] = await conn.query("SELECT payment_id FROM tbl_Payments WHERE request_id = ?", [id]);
            
            if (existing.length === 0) {
                await conn.query(`
                    INSERT INTO tbl_Payments 
                    (request_id, amount_paid, or_number, payment_date, treasurer_id, payment_status, payor_name)
                    VALUES (?, ?, ?, NOW(), ?, 'Paid', 
                    (SELECT CONCAT(first_name, ' ', last_name) FROM tbl_Residents WHERE resident_id = (SELECT resident_id FROM tbl_Requests WHERE request_id = ?))
                    )
                `, [id, amount_paid, or_number, req.user.id, id]);
            }
        }

        // --- 🕵️ AUDIT TRAIL: LOG THE ACTION (FR13) ---
        // This runs silently in the background
        const auditDetails = {
            previous_status: 'ForPayment', // Simplified for now
            new_status: status,
            or_number: or_number || 'N/A',
            amount: amount_paid || '0.00',
            reason: reason || 'N/A'
        };

        await logAction(
            req.user.id,                // Who did it?
            'Admin',                    // Role
            `UPDATE_STATUS_${status.toUpperCase()}`, // Action Type
            'tbl_Requests',             // Table Affected
            id,                         // Record ID
            auditDetails,               // New Values
            req                         // Request Object (for IP Address)
        );
        // ----------------------------------------------

        res.json({ success: true, message: `Request successfully updated to ${status}` });

    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 6. VIEW SECURE FILE (The "Lens")
export const viewSecureFile = async (req, res) => {
    const { filename } = req.params;

    try {
        // 1. Decrypt from Vault
        const fileBuffer = getDecryptedFile(filename);

        if (!fileBuffer) {
            return res.status(404).send("File not found or damaged.");
        }

        // 2. Set Content Type
        const ext = path.extname(filename).replace('.enc', '').toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        if (ext === '.pdf') contentType = 'application/pdf';

        // 3. Send Clean Data
        res.setHeader('Content-Type', contentType);
        res.send(fileBuffer);

    } catch (err) {
        console.error("Decryption Error:", err);
        res.status(500).send("Security Error: Could not decrypt file.");
    }
};