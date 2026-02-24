-- E-Serbisyo Database Schema
-- Run this script to initialize the 10 core tables based on Table 3.6

-- 1. Barangay Officials (Created first as it is referenced by many tables)
CREATE TABLE IF NOT EXISTS tbl_BarangayOfficials (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    official_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email_official VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- SHA256 Hash
    role ENUM('Super Admin', 'Secretary', 'Treasurer', 'Captain') NOT NULL,
    account_status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    auth_token VARCHAR(255),
    last_login DATETIME
);

-- 2. Residents
CREATE TABLE IF NOT EXISTS tbl_Residents (
    resident_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    civil_status ENUM('Single', 'Married', 'Widowed', 'Divorced') NOT NULL,
    address_street VARCHAR(255) NOT NULL,
    email_address VARCHAR(255) UNIQUE NOT NULL,
    contact_number VARCHAR(255) NOT NULL, -- Sized for AES256 Encrypted String
    password_hash VARCHAR(255) NOT NULL,  -- SHA256 Hash
    id_proof_image VARCHAR(255),          -- Encrypted File Path
    account_status ENUM('Pending', 'Active', 'Blocked') DEFAULT 'Pending'
);

-- 3. Document Types
CREATE TABLE IF NOT EXISTS tbl_DocumentTypes (
    doc_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(150) NOT NULL,
    description TEXT,
    base_fee DECIMAL(10, 2) DEFAULT 0.00,
    requirements TEXT,
    template_file VARCHAR(255),
    layout_config JSON,
    paper_size VARCHAR(50) DEFAULT 'A4',
    validity_days INT DEFAULT 180,
    is_available BOOLEAN DEFAULT TRUE,
    updated_by INT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE SET NULL
);

-- 4. Digital Signatures
CREATE TABLE IF NOT EXISTS tbl_DigitalSignatures (
    signature_id INT AUTO_INCREMENT PRIMARY KEY,
    official_id INT NOT NULL,
    signature_blob VARCHAR(255) NOT NULL, -- Path to Encrypted Blob
    file_type VARCHAR(50),
    checksum VARCHAR(255),
    encryption_key VARCHAR(255),
    status ENUM('Active', 'Revoked') DEFAULT 'Active',
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    FOREIGN KEY (official_id) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE CASCADE
);

-- 5. Announcements
CREATE TABLE IF NOT EXISTS tbl_Announcements (
    announcement_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    target_audience ENUM('All', 'Residents', 'Officials') DEFAULT 'All',
    content_body TEXT NOT NULL,
    image_path VARCHAR(255),
    is_pinned BOOLEAN DEFAULT FALSE,
    status ENUM('Draft', 'Published', 'Archived') DEFAULT 'Draft',
    date_posted DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiry_date DATETIME,
    posted_by INT,
    FOREIGN KEY (posted_by) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE SET NULL
);

-- 6. System Settings
CREATE TABLE IF NOT EXISTS tbl_SystemSettings (
    setting_id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    category VARCHAR(100),
    data_type ENUM('String', 'Boolean', 'Integer', 'JSON') DEFAULT 'String',
    is_encrypted BOOLEAN DEFAULT FALSE,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE SET NULL
);

-- 7. Requests (The Core Workflow Table)
CREATE TABLE IF NOT EXISTS tbl_Requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    resident_id INT NOT NULL,
    doc_type_id INT NOT NULL,
    reference_no VARCHAR(100) UNIQUE NOT NULL,
    purpose VARCHAR(255) NOT NULL,
    rejection_reason TEXT,
    request_status ENUM('Pending', 'For Verification', 'For Payment', 'Processing', 'Ready for Pickup', 'Issued', 'Rejected', 'Cancelled') DEFAULT 'Pending',
    date_requested DATETIME DEFAULT CURRENT_TIMESTAMP,
    qr_code_string VARCHAR(255) UNIQUE,
    pickup_date DATETIME,
    processed_by INT,
    FOREIGN KEY (resident_id) REFERENCES tbl_Residents(resident_id) ON DELETE CASCADE,
    FOREIGN KEY (doc_type_id) REFERENCES tbl_DocumentTypes(doc_type_id) ON DELETE RESTRICT,
    FOREIGN KEY (processed_by) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE SET NULL
);

-- 8. Payments
CREATE TABLE IF NOT EXISTS tbl_Payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT UNIQUE NOT NULL,
    amount_paid DECIMAL(10, 2) NOT NULL,
    or_number VARCHAR(100) UNIQUE NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    treasurer_id INT,
    payment_status ENUM('Unpaid', 'Paid', 'Refunded', 'Exempted') DEFAULT 'Unpaid',
    payor_name VARCHAR(255) NOT NULL,
    receipt_copy VARCHAR(255),
    audit_hash VARCHAR(255),
    FOREIGN KEY (request_id) REFERENCES tbl_Requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (treasurer_id) REFERENCES tbl_BarangayOfficials(user_id) ON DELETE SET NULL
);

-- 9. Audit Logs (Immutable Ledger)
CREATE TABLE IF NOT EXISTS tbl_AuditLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Intentionally left without strict FK to support both Residents and Officials
    table_affected VARCHAR(100),
    record_id INT,
    action_type VARCHAR(100) NOT NULL,
    old_value JSON,
    new_value JSON,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_type ENUM('Resident', 'Official', 'System') NOT NULL
);

-- 10. Password Resets
CREATE TABLE IF NOT EXISTS tbl_PasswordReset (
    reset_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL, -- Can map to Resident or Official
    token_hash VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    ip_request VARCHAR(45),
    user_agent TEXT,
    expires_at DATETIME NOT NULL,
    attempt_count INT DEFAULT 0,
    is_used BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);