import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getConnection } from '../config/db.js';

// Register a New Resident
export const registerResident = async (req, res) => {
    const { first_name, middle_name, last_name, email_address, password, contact_number, address_street } = req.body;
    
    let conn;
    try {
        conn = await getConnection();

        // 1. Check if email already exists
        const checkEmail = await conn.query("SELECT email_address FROM tbl_Residents WHERE email_address = ?", [email_address]);
        if (checkEmail.length > 0) {
            return res.status(400).json({ success: false, message: "Email is already registered." });
        }

        // 2. Hash the Password (Security Requirement)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 3. Insert into Database
        const query = `
            INSERT INTO tbl_Residents 
            (first_name, middle_name, last_name, email_address, password_hash, contact_number, address_street, account_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Active')
        `;
        
        await conn.query(query, [
            first_name, 
            middle_name || null, 
            last_name, 
            email_address, 
            password_hash, 
            contact_number, 
            address_street
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