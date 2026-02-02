import { getConnection } from '../config/db.js';
import { getDecryptedFile } from '../middleware/upload.middleware.js';
import { logAction } from '../services/audit.service.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

// --- HELPER: Scan disk for attached files ---
const findFileForRequest = (refNo) => {
    const uploadDir = path.resolve('uploads'); 
    if (!fs.existsSync(uploadDir)) return null;
    try {
        const files = fs.readdirSync(uploadDir);
        // Find file starting with Ref No
        return files.find(file => file.startsWith(`${refNo}_`));
    } catch (err) {
        return null;
    }
};

// ... (Login, Stats, GetAllRequests, GetRequestDetails, UpdateRequestStatus - KEEP THESE AS IS) ...
// I am including them here briefly so you don't lose them, but the main change is at the bottom.

export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;
    let conn;
    try {
        conn = await getConnection();
        const [official] = await conn.query("SELECT * FROM tbl_BarangayOfficials WHERE username = ?", [username]);
        if (!official) return res.status(401).json({ success: false, message: "Invalid Credentials" });
        const isMatch = await bcrypt.compare(password, official.password_hash);
        if (!isMatch) return res.status(401).json({ success: false, message: "Invalid Credentials" });
        const token = jwt.sign({ id: official.user_id, role: official.role, is_admin: true }, process.env.JWT_SECRET, { expiresIn: '8h' });
        res.json({ success: true, token, user: { name: official.full_name, role: official.role, position: official.position } });
    } catch (err) { res.status(500).json({ success: false, message: "Server Error" }); } finally { if (conn) conn.end(); }
};

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
            else if (['Approved', 'approved', 'ForPayment'].includes(status)) stats.processing += count;
            else if (['Released', 'released', 'Completed', 'completed', 'Rejected'].includes(status)) stats.completed += count;
        });
        res.json({ success: true, stats });
    } catch (err) { res.status(500).json({ success: false, message: "Server Error" }); } finally { if (conn) conn.end(); }
};

export const getAllRequests = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();
        const query = `
            SELECT r.request_id, r.reference_no, r.purpose, r.request_status, r.date_requested, 
                u.first_name, u.last_name, d.type_name, d.base_fee
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            ORDER BY r.date_requested DESC
        `;
        const rows = await conn.query(query);
        const formattedRows = rows.map(row => ({
            ...row,
            resident_name: `${row.first_name} ${row.last_name}`,
            attachment_found: findFileForRequest(row.reference_no)
        }));
        res.json({ success: true, requests: formattedRows });
    } catch (err) { res.status(500).json({ success: false, message: "Server Error" }); } finally { if (conn) conn.end(); }
};

export const getRequestDetails = async (req, res) => {
    const { id } = req.params;
    let conn;
    try {
        conn = await getConnection();
        const query = `
            SELECT r.*, u.first_name, u.middle_name, u.last_name, u.address_street, u.civil_status, u.contact_number,
                d.type_name, d.base_fee, d.requirements
            FROM tbl_Requests r
            JOIN tbl_Residents u ON r.resident_id = u.resident_id
            JOIN tbl_DocumentTypes d ON r.doc_type_id = d.doc_type_id
            WHERE r.request_id = ?
        `;
        const [request] = await conn.query(query, [id]);
        if (!request) return res.status(404).json({ success: false, message: "Request not found" });
        request.attachment_found = findFileForRequest(request.reference_no);
        res.json({ success: true, request });
    } catch (err) { res.status(500).json({ success: false, message: "Server Error" }); } finally { if (conn) conn.end(); }
};

// 5. UPDATE REQUEST STATUS (DEBUG VERSION)
// 5. UPDATE REQUEST STATUS (FIXED: Handling Empty Arrays Correctly)
export const updateRequestStatus = async (req, res) => {
    const { id } = req.params;
    const { status, reason, or_number, amount_paid } = req.body; 

    let conn;
    try {
        conn = await getConnection();
        
        console.log(`[DEBUG] Updating Request #${id} to ${status}`);

        // A. DUPLICATE CHECK (Fixed Destructuring)
        if (status === 'Approved' && or_number) {
            // REMOVED [ ] around dupeCheck so we get the whole array
            const dupeCheck = await conn.query("SELECT payment_id FROM tbl_Payments WHERE or_number = ?", [or_number]);
            
            // Now safely check if array has items
            if (dupeCheck && dupeCheck.length > 0) {
                return res.status(400).json({ success: false, message: `SECURITY ALERT: OR Number ${or_number} has already been used!` });
            }
        }

        // B. UPDATE STATUS
        await conn.query(
            "UPDATE tbl_Requests SET request_status = ?, processed_by = ? WHERE request_id = ?",
            [status, req.user.id, id]
        );

        if (status === 'Rejected' && reason) {
            await conn.query("UPDATE tbl_Requests SET rejection_reason = ? WHERE request_id = ?", [reason, id]);
        }

        // C. INSERT PAYMENT
        if (status === 'Approved' && or_number && amount_paid) {
            // REMOVED [ ] around existing
            const existing = await conn.query("SELECT payment_id FROM tbl_Payments WHERE request_id = ?", [id]);
            
            if (existing.length === 0) {
                console.log("[DEBUG] Inserting Payment...");
                await conn.query(`
                    INSERT INTO tbl_Payments 
                    (request_id, amount_paid, or_number, payment_date, treasurer_id, payment_status, payor_name)
                    VALUES (?, ?, ?, NOW(), ?, 'Paid', 
                    (SELECT CONCAT(first_name, ' ', last_name) FROM tbl_Residents WHERE resident_id = (SELECT resident_id FROM tbl_Requests WHERE request_id = ?))
                    )
                `, [id, amount_paid, or_number, req.user.id, id]);
            }
        }

        // D. AUDIT TRAIL
        try {
            const auditDetails = { previous_status: 'ForPayment', new_status: status, or_number: or_number || 'N/A', amount: amount_paid || '0.00' };
            await logAction(req.user.id, 'Admin', `UPDATE_STATUS_${status.toUpperCase()}`, 'tbl_Requests', id, auditDetails, req);
        } catch (auditErr) {
            console.error("[CRITICAL] Audit Log Failed:", auditErr);
        }

        res.json({ success: true, message: `Request updated to ${status}` });

    } catch (err) {
        console.error("Update Status Error:", err);
        res.status(500).json({ success: false, message: err.message || "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 6. VIEW SECURE FILE (WITH DEBUGGING)
// 6. VIEW SECURE FILE (THE NUCLEAR FIX: Base64 Mode)
export const viewSecureFile = async (req, res) => {
    const { filename } = req.params;
    
    // 1. Find the file using the robust path helper (defined at the top of your file)
    // Ensure you still have the getUploadsPath() and findFileForRequest() helpers from the previous step!
    const uploadDir = path.resolve('uploads'); // Hardcoded absolute path for safety
    const filePath = path.join(uploadDir, filename);

    console.log(`[BASE64 REQUEST] Reading: ${filePath}`);

    try {
        let fileBuffer;

        // 2. Try Decrypting First
        if (filename.endsWith('.enc')) {
            try {
                fileBuffer = getDecryptedFile(filename);
            } catch (err) {
                console.warn("Decryption failed, falling back to raw...");
            }
        }

        // 3. Fallback to Raw Read
        if (!fileBuffer) {
            if (fs.existsSync(filePath)) {
                fileBuffer = fs.readFileSync(filePath);
            } else {
                console.error("[ERROR] File not found");
                return res.status(404).json({ success: false, message: "File not found" });
            }
        }

        // 4. Convert to Base64 String
        const base64Image = fileBuffer.toString('base64');
        
        // 5. Determine MIME Type
        const cleanName = filename.replace(/\.enc$/, '');
        const ext = path.extname(cleanName).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') mimeType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        if (ext === '.pdf') mimeType = 'application/pdf';

        // 6. Send as JSON
        const dataURI = `data:${mimeType};base64,${base64Image}`;
        res.json({ success: true, image: dataURI });

    } catch (err) {
        console.error("View File Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};