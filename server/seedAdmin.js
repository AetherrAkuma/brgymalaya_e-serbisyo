import bcrypt from 'bcryptjs';
import mysql from 'mariadb';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmins = async () => {
    let conn;
    try {
        conn = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: process.env.DB_PORT || 3307
        });
        console.log("🔌 Connected to Database...");

        // 1. RECREATE THE TABLE (Matching your Screenshot)
        // We drop it first to ensure a clean slate, then create it with the exact columns.
        await conn.query("DROP TABLE IF EXISTS tbl_BarangayOfficials");
        
        const createTableQuery = `
            CREATE TABLE tbl_BarangayOfficials (
                user_id INT AUTO_INCREMENT PRIMARY KEY,   -- Yellow Key (PK)
                official_id VARCHAR(20) NOT NULL UNIQUE,  -- Red Key (Unique ID)
                full_name VARCHAR(100) NOT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                email_official VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,                -- e.g. Captain, Secretary
                account_status VARCHAR(20) DEFAULT 'Active',
                last_login DATETIME DEFAULT NULL
            );
        `;
        await conn.query(createTableQuery);
        console.log("✅ Table 'tbl_BarangayOfficials' created successfully.");

        // 2. DEFINE USERS
        // Password for everyone: 'admin123'
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('admin123', salt);

        const officials = [
            { 
                off_id: 'OFF-001', 
                name: 'Hon. Juan Dela Cruz', 
                user: 'kap_juan', 
                email: 'captain@barangay.com', 
                role: 'Captain' 
            },
            { 
                off_id: 'OFF-002', 
                name: 'Maria Santos', 
                user: 'sec_maria', 
                email: 'secretary@barangay.com', 
                role: 'Secretary' 
            },
            { 
                off_id: 'OFF-003', 
                name: 'Pedro Penduko', 
                user: 'treas_pedro', 
                email: 'treasurer@barangay.com', 
                role: 'Treasurer' 
            },
            { 
                off_id: 'OFF-004', 
                name: 'Kgd. Jose Rizal', 
                user: 'kag_jose', 
                email: 'kagawad@barangay.com', 
                role: 'Kagawad' 
            }
        ];

        // 3. INSERT USERS
        console.log("🚀 Seeding Admins...");
        for (const off of officials) {
            await conn.query(`
                INSERT INTO tbl_BarangayOfficials 
                (official_id, full_name, username, email_official, password_hash, role, account_status)
                VALUES (?, ?, ?, ?, ?, ?, 'Active')
            `, [off.off_id, off.name, off.user, off.email, passwordHash, off.role]);
            
            console.log(`   + Created: ${off.role} (${off.user})`);
        }

    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        if (conn) conn.end();
        process.exit();
    }
};

seedAdmins();