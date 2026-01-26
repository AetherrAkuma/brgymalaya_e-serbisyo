// 👇 CORRECT IMPORTS (Do not import admin.controller.js here!)
import { getConnection } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 1. LOGIN CONTROLLER
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

        // Generate Admin Token (Includes is_admin flag)
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
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};

// 2. DASHBOARD STATS CONTROLLER
export const getDashboardStats = async (req, res) => {
    let conn;
    try {
        conn = await getConnection();

        // Count Requests by Status
        const statusQuery = `
            SELECT request_status, COUNT(*) as count 
            FROM tbl_Requests 
            GROUP BY request_status
        `;
        const statusRows = await conn.query(statusQuery);

        // Format data for frontend (Initialize with 0)
        const stats = {
            pending: 0,
            processing: 0,
            completed: 0
        };

        statusRows.forEach(row => {
            if (row.request_status === 'Pending') stats.pending = Number(row.count);
            else if (['Approved', 'Paid'].includes(row.request_status)) stats.processing += Number(row.count);
            else if (['Released', 'Completed'].includes(row.request_status)) stats.completed += Number(row.count);
        });

        res.json({ success: true, stats });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};