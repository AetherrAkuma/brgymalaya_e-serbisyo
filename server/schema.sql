-- Create Database
CREATE DATABASE IF NOT EXISTS e_serbisyo_db;
USE e_serbisyo_db;

-- 1. Residents Table (Identity Management)
CREATE TABLE IF NOT EXISTS tbl_Residents (
    resident_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    civil_status VARCHAR(50),
    address_street TEXT NOT NULL,
    email_address VARCHAR(150) UNIQUE NOT NULL,
    contact_number VARCHAR(50) NOT NULL, -- Encrypted AES256 in app
    password_hash VARCHAR(255) NOT NULL,
    id_proof_image VARCHAR(255), -- Path to R2 Storage
    account_status ENUM('Active', 'Pending', 'Banned') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Barangay Officials Table (Admin Access)
CREATE TABLE IF NOT EXISTS tbl_BarangayOfficials (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    official_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email_official VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Captain', 'Secretary', 'Treasurer', 'SuperAdmin') NOT NULL,
    account_status ENUM('Active', 'Inactive') DEFAULT 'Active',
    last_login TIMESTAMP NULL
);

-- 3. Document Types (Configuration)
CREATE TABLE IF NOT EXISTS tbl_DocumentTypes (
    doc_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL, -- e.g., Barangay Clearance
    description TEXT,
    base_fee DECIMAL(10, 2) DEFAULT 0.00,
    requirements TEXT, -- JSON string of requirements
    template_file VARCHAR(255), -- Path to PDF template
    is_available BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 4. Requests Table (Transaction History)
CREATE TABLE IF NOT EXISTS tbl_Requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    doc_type_id INT NOT NULL,
    reference_no VARCHAR(50) UNIQUE NOT NULL,
    purpose TEXT NOT NULL,
    request_status ENUM('Pending', 'Processing', 'ForPayment', 'Approved', 'Completed', 'Rejected') DEFAULT 'Pending',
    rejection_reason TEXT,
    qr_code_string TEXT, -- The encrypted string for verification
    date_requested TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pickup_date DATETIME,
    processed_by INT, -- Link to Official who approved it
    FOREIGN KEY (resident_id) REFERENCES tbl_Residents(resident_id),
    FOREIGN KEY (doc_type_id) REFERENCES tbl_DocumentTypes(doc_type_id),
    FOREIGN KEY (processed_by) REFERENCES tbl_BarangayOfficials(user_id)
);

-- 5. Payments Table (Financial Audit)
CREATE TABLE IF NOT EXISTS tbl_Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    or_number VARCHAR(50) UNIQUE NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    treasurer_id INT NOT NULL,
    payment_status ENUM('Paid', 'Void') DEFAULT 'Paid',
    receipt_copy VARCHAR(255), -- Path to digital receipt
    FOREIGN KEY (request_id) REFERENCES tbl_Requests(request_id),
    FOREIGN KEY (treasurer_id) REFERENCES tbl_BarangayOfficials(user_id)
);

-- 6. Announcements (Public Info)
CREATE TABLE IF NOT EXISTS tbl_Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content_body TEXT NOT NULL,
    target_audience ENUM('Public', 'Residents') DEFAULT 'Public',
    image_path VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    expiry_date DATE,
    posted_by INT NOT NULL,
    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (posted_by) REFERENCES tbl_BarangayOfficials(user_id)
);

-- 7. Audit Logs (Security)
CREATE TABLE IF NOT EXISTS tbl_AuditLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('Resident', 'Official') NOT NULL,
    action_type VARCHAR(100) NOT NULL, -- e.g., "Printed Clearance"
    table_affected VARCHAR(50),
    record_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. System Settings (Global Config)
CREATE TABLE IF NOT EXISTS tbl_SystemSettings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., "ENABLE_REGISTRATION"
    setting_value TEXT NOT NULL,
    description TEXT,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Digital Signatures (Security Assets)
CREATE TABLE IF NOT EXISTS tbl_DigitalSignatures (
    signature_id INT AUTO_INCREMENT PRIMARY KEY,
    official_id INT NOT NULL,
    signature_blob VARCHAR(255) NOT NULL, -- Path to encrypted image in R2
    checksum VARCHAR(255) NOT NULL, -- For integrity verification
    status ENUM('Active', 'Revoked') DEFAULT 'Active',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (official_id) REFERENCES tbl_BarangayOfficials(user_id)
);

-- 10. Password Resets (Recovery)
CREATE TABLE IF NOT EXISTS tbl_PasswordResets (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    user_type ENUM('Resident', 'Official') NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);