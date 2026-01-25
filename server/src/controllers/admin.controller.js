import { getConnection } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// POST /api/admin/auth/login
export const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    let conn;
    try {
        conn = await getConnection();

        // 1. Check if Official exists (using Username, not Email)
        const [official] = await conn.query(
            "SELECT * FROM tbl_BarangayOfficials WHERE username = ?", 
            [username]
        );

        if (!official) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        // 2. Verify Password
        const isMatch = await bcrypt.compare(password, official.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid Credentials" });
        }

        // 3. Generate "Admin Access Token"
        // We include the ROLE in the token so the frontend knows what to show
        const token = jwt.sign(
            { 
                id: official.official_id, 
                role: official.role,
                is_admin: true 
            }, 
            process.env.JWT_SECRET, 
            { expiresIn: '8h' } // Admins get 8-hour sessions (shift length)
        );

        // 4. Send Response
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