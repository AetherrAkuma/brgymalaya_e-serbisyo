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

// Placeholder for Login (We will add this next)
export const loginUser = async (req, res) => {
    res.json({ message: "Login logic coming soon" });
};