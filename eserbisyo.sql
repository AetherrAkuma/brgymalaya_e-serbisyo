-- 1. CLEANUP (Start Fresh)
DROP DATABASE IF EXISTS `e_serbisyo_db`;
CREATE DATABASE `e_serbisyo_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `e_serbisyo_db`;

-- ==========================================
-- 2. INDEPENDENT TABLES (Create these first)
-- ==========================================

-- Residents Table
CREATE TABLE `tbl_residents` (
  `resident_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `civil_status` varchar(50) DEFAULT NULL,
  `address_street` text NOT NULL,
  `email_address` varchar(150) NOT NULL,
  `contact_number` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_proof_image` varchar(255) DEFAULT NULL,
  `account_status` enum('Active','Pending','Banned') DEFAULT 'Pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`resident_id`),
  UNIQUE KEY `email_address` (`email_address`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Officials Table (Admins)
CREATE TABLE `tbl_barangayofficials` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `official_id` varchar(20) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email_official` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) NOT NULL,
  `account_status` varchar(20) DEFAULT 'Active',
  `last_login` datetime DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `official_id` (`official_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Document Types (Price List)
CREATE TABLE `tbl_documenttypes` (
  `doc_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `base_fee` decimal(10,2) DEFAULT 0.00,
  `requirements` text DEFAULT NULL,
  `template_file` varchar(255) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`doc_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- System Settings
CREATE TABLE `tbl_systemsettings` (
  `setting_id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `last_updated` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 3. DEPENDENT TABLES (Link to the ones above)
-- ==========================================

-- Requests (Links to Resident & DocType & Official)
CREATE TABLE `tbl_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `resident_id` int(11) NOT NULL,
  `doc_type_id` int(11) NOT NULL,
  `reference_no` varchar(50) NOT NULL,
  `purpose` text NOT NULL,
  `request_status` enum('Pending','Processing','ForPayment','Approved','Completed','Rejected') DEFAULT 'Pending',
  `rejection_reason` text DEFAULT NULL,
  `qr_code_string` text DEFAULT NULL,
  `date_requested` timestamp NULL DEFAULT current_timestamp(),
  `pickup_date` datetime DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  UNIQUE KEY `reference_no` (`reference_no`),
  KEY `resident_id` (`resident_id`),
  KEY `doc_type_id` (`doc_type_id`),
  KEY `processed_by` (`processed_by`),
  CONSTRAINT `fk_request_resident` FOREIGN KEY (`resident_id`) REFERENCES `tbl_residents` (`resident_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_request_doctype` FOREIGN KEY (`doc_type_id`) REFERENCES `tbl_documenttypes` (`doc_type_id`),
  CONSTRAINT `fk_request_official` FOREIGN KEY (`processed_by`) REFERENCES `tbl_barangayofficials` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Payments (Links to Request & Official)
CREATE TABLE `tbl_payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `request_id` int(11) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `or_number` varchar(50) NOT NULL,
  `payment_date` timestamp NULL DEFAULT current_timestamp(),
  `treasurer_id` int(11) NOT NULL,
  `payment_status` enum('Paid','Void') DEFAULT 'Paid',
  `receipt_copy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  UNIQUE KEY `or_number` (`or_number`),
  KEY `request_id` (`request_id`),
  KEY `treasurer_id` (`treasurer_id`),
  CONSTRAINT `fk_payment_request` FOREIGN KEY (`request_id`) REFERENCES `tbl_requests` (`request_id`),
  CONSTRAINT `fk_payment_official` FOREIGN KEY (`treasurer_id`) REFERENCES `tbl_barangayofficials` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Announcements (Links to Official)
CREATE TABLE `tbl_announcements` (
  `announcement_id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `content_body` text NOT NULL,
  `target_audience` enum('Public','Residents') DEFAULT 'Public',
  `image_path` varchar(255) DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `expiry_date` date DEFAULT NULL,
  `posted_by` int(11) NOT NULL,
  `date_posted` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`announcement_id`),
  KEY `posted_by` (`posted_by`),
  CONSTRAINT `fk_announcement_official` FOREIGN KEY (`posted_by`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Digital Signatures (Links to Official)
CREATE TABLE `tbl_digitalsignatures` (
  `signature_id` int(11) NOT NULL AUTO_INCREMENT,
  `official_id` int(11) NOT NULL,
  `signature_blob` varchar(255) NOT NULL,
  `checksum` varchar(255) NOT NULL,
  `status` enum('Active','Revoked') DEFAULT 'Active',
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`signature_id`),
  KEY `official_id` (`official_id`),
  CONSTRAINT `fk_signature_official` FOREIGN KEY (`official_id`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Audit Logs
CREATE TABLE `tbl_auditlogs` (
  `log_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_type` enum('Resident','Official') NOT NULL,
  `action_type` varchar(100) NOT NULL,
  `table_affected` varchar(50) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`log_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Password Resets
CREATE TABLE `tbl_passwordresets` (
  `reset_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `user_type` enum('Resident','Official') NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`reset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ==========================================
-- 4. SEED DATA (Default Accounts & Settings)
-- ==========================================

-- Default Officials (Password: admin123)
INSERT INTO `tbl_barangayofficials` (`user_id`, `official_id`, `full_name`, `username`, `email_official`, `password_hash`, `role`, `account_status`) VALUES
(1, 'OFF-001', 'Hon. Juan Dela Cruz', 'kap_juan', 'captain@barangay.com', '$2b$10$eq/.he49wVP78C5XzAUUnew9LSxXqheOfAkt.yEyNdXpb.vOsS2uq', 'Captain', 'Active'),
(2, 'OFF-002', 'Maria Santos', 'sec_maria', 'secretary@barangay.com', '$2b$10$eq/.he49wVP78C5XzAUUnew9LSxXqheOfAkt.yEyNdXpb.vOsS2uq', 'Secretary', 'Active'),
(3, 'OFF-003', 'Pedro Penduko', 'treas_pedro', 'treasurer@barangay.com', '$2b$10$eq/.he49wVP78C5XzAUUnew9LSxXqheOfAkt.yEyNdXpb.vOsS2uq', 'Treasurer', 'Active'),
(4, 'OFF-004', 'Kgd. Jose Rizal', 'kag_jose', 'kagawad@barangay.com', '$2b$10$eq/.he49wVP78C5XzAUUnew9LSxXqheOfAkt.yEyNdXpb.vOsS2uq', 'Kagawad', 'Active');

-- Default Document Types
INSERT INTO `tbl_documenttypes` (`doc_type_id`, `type_name`, `base_fee`, `requirements`, `is_available`) VALUES
(1, 'Barangay Clearance', 50.00, '["Valid ID", "Cedula"]', 1),
(2, 'Certificate of Indigency', 0.00, '["Letter of Request"]', 1),
(3, 'Barangay ID', 100.00, '["1x1 Picture", "Valid ID"]', 1),
(4, 'Business Clearance', 500.00, '["DTI Registration", "Contract of Lease"]', 1);

-- Default Settings
INSERT INTO `tbl_systemsettings` (`setting_key`, `setting_value`, `description`) VALUES
('BARANGAY_NAME', 'Barangay Malaya', 'Official Name of the LGU');