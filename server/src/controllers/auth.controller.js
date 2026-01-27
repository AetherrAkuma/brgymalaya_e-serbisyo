import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../config/db.js';

// Register a New Resident
export const registerResident = async (req, res) => {
    // 1. Add date_of_birth here
    const { first_name, middle_name, last_name, email_address, password, contact_number, address_street, date_of_birth } = req.body;
    
    let conn;
    try {
        conn = await getConnection();

        const checkEmail = await conn.query("SELECT email_address FROM tbl_Residents WHERE email_address = ?", [email_address]);
        if (checkEmail.length > 0) {
            return res.status(400).json({ success: false, message: "Email is already registered." });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 2. Add date_of_birth to the INSERT query
        const query = `
            INSERT INTO tbl_Residents 
            (first_name, middle_name, last_name, email_address, password_hash, contact_number, address_street, date_of_birth, account_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')
        `;
        
        // 3. Add date_of_birth to the values array
        await conn.query(query, [
            first_name, 
            middle_name || null, 
            last_name, 
            email_address, 
            password_hash, 
            contact_number, 
            address_street,
            date_of_birth // <--- Added here
        ]);

        res.status(201).json({ success: true, message: "Registration successful! You can now login." });

    } catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ success: false, message: "Server Error during registration." });
    } finally {
        if (conn) conn.end();
    }
};

// Add this import at the top if it's missing (should be there already)
// import jwt from 'jsonwebtoken';

export const loginUser = async (req, res) => {
    const { email_address, password } = req.body;

    let conn;
    try {
        conn = await getConnection();

        // 1. Find User
        const rows = await conn.query("SELECT * FROM tbl_Residents WHERE email_address = ?", [email_address]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        const user = rows[0];

        // 2. Check Password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        // 3. Generate Token (The "Digital ID")
        const token = jwt.sign(
            { 
                id: user.resident_id, 
                role: 'Resident',
                email: user.email_address 
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // Token expires in 8 hours (typical work day)
        );

        // 4. Send Success Response
        res.json({
            success: true,
            message: "Login Successful",
            token: token,
            user: {
                id: user.resident_id,
                name: `${user.first_name} ${user.last_name}`,
                email: user.email_address,
                role: 'Resident'
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    } finally {
        if (conn) conn.end();
    }
};