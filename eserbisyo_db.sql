-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 24, 2026 at 01:43 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `eserbisyo_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `tbl_announcements`
--

CREATE TABLE `tbl_announcements` (
  `announcement_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `target_audience` enum('All','Residents','Officials') DEFAULT 'All',
  `content_body` text NOT NULL,
  `image_path` varchar(255) DEFAULT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `status` enum('Draft','Published','Archived') DEFAULT 'Draft',
  `date_posted` datetime DEFAULT current_timestamp(),
  `expiry_date` datetime DEFAULT NULL,
  `posted_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_announcements`
--

INSERT INTO `tbl_announcements` (`announcement_id`, `title`, `target_audience`, `content_body`, `image_path`, `is_pinned`, `status`, `date_posted`, `expiry_date`, `posted_by`) VALUES
(1, 'Road Clearing Operations', 'All', 'Please be advised that road clearing will start on Monday.', NULL, 1, 'Published', '2026-02-24 17:24:55', '2026-03-03 17:24:55', NULL),
(2, 'Free Medical Mission', 'All', 'Join us at the covered court this weekend for free checkups!', NULL, 0, 'Published', '2026-02-24 17:24:55', '2026-02-27 17:24:55', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_auditlogs`
--

CREATE TABLE `tbl_auditlogs` (
  `log_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `table_affected` varchar(100) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `action_type` varchar(100) NOT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `timestamp` datetime DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL,
  `user_type` enum('Resident','Official','System') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_auditlogs`
--

INSERT INTO `tbl_auditlogs` (`log_id`, `user_id`, `table_affected`, `record_id`, `action_type`, `old_value`, `new_value`, `timestamp`, `ip_address`, `user_type`) VALUES
(1, 1, 'tbl_BarangayOfficials', 2, 'CREATE', NULL, '{\"official_id\":\"SEC-001\",\"username\":\"johndoe\",\"role\":\"Secretary\"}', '2026-02-24 20:38:04', '::1', 'Official'),
(2, 1, 'tbl_BarangayOfficials', 2, 'STATUS_CHANGE', '{\"account_status\":\"Active\"}', '{\"account_status\":\"Inactive\"}', '2026-02-24 20:38:13', '::1', 'Official'),
(3, 1, 'tbl_BarangayOfficials', 2, 'STATUS_CHANGE', '{\"account_status\":\"Inactive\"}', '{\"account_status\":\"Suspended\"}', '2026-02-24 20:38:16', '::1', 'Official'),
(4, 1, 'tbl_BarangayOfficials', 2, 'STATUS_CHANGE', '{\"account_status\":\"Suspended\"}', '{\"account_status\":\"Active\"}', '2026-02-24 20:38:18', '::1', 'Official');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_barangayofficials`
--

CREATE TABLE `tbl_barangayofficials` (
  `user_id` int(11) NOT NULL,
  `official_id` varchar(50) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email_official` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Super Admin','Secretary','Treasurer','Captain') NOT NULL,
  `account_status` enum('Active','Inactive','Suspended') DEFAULT 'Active',
  `auth_token` varchar(255) DEFAULT NULL,
  `last_login` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_barangayofficials`
--

INSERT INTO `tbl_barangayofficials` (`user_id`, `official_id`, `full_name`, `email_official`, `username`, `password_hash`, `role`, `account_status`, `auth_token`, `last_login`) VALUES
(1, 'SA-001', 'System Administrator', 'admin@eserbisyo.com', 'superadmin', '0eeaa9fdda267f5bf6f0b4fe2fabb4133c1b8689d02832052fb90d129ea3093f', 'Super Admin', 'Active', NULL, '2026-02-24 20:37:23'),
(2, 'SEC-001', 'John Doe', 'john@brgy.gov.ph', 'johndoe', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Secretary', 'Active', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_digitalsignatures`
--

CREATE TABLE `tbl_digitalsignatures` (
  `signature_id` int(11) NOT NULL,
  `official_id` int(11) NOT NULL,
  `signature_blob` varchar(255) NOT NULL,
  `file_type` varchar(50) DEFAULT NULL,
  `checksum` varchar(255) DEFAULT NULL,
  `encryption_key` varchar(255) DEFAULT NULL,
  `status` enum('Active','Revoked') DEFAULT 'Active',
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `expiry_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_documenttypes`
--

CREATE TABLE `tbl_documenttypes` (
  `doc_type_id` int(11) NOT NULL,
  `type_name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `base_fee` decimal(10,2) DEFAULT 0.00,
  `requirements` text DEFAULT NULL,
  `template_file` varchar(255) DEFAULT NULL,
  `layout_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`layout_config`)),
  `paper_size` varchar(50) DEFAULT 'A4',
  `validity_days` int(11) DEFAULT 180,
  `is_available` tinyint(1) DEFAULT 1,
  `updated_by` int(11) DEFAULT NULL,
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_documenttypes`
--

INSERT INTO `tbl_documenttypes` (`doc_type_id`, `type_name`, `description`, `base_fee`, `requirements`, `template_file`, `layout_config`, `paper_size`, `validity_days`, `is_available`, `updated_by`, `updated_at`) VALUES
(1, 'Barangay Clearance', 'Used for employment and general purposes.', 50.00, 'Valid ID, 1x1 Picture', 'template_1_1771936527884-61628698.png.enc', NULL, 'A4', 180, 1, 1, '2026-02-24 20:35:27'),
(2, 'Certificate of Indigency', 'Used for scholarship and financial aid. Free of charge.', 0.00, 'Proof of Income or Valid ID', NULL, NULL, 'A4', 180, 1, NULL, '2026-02-24 17:24:55'),
(3, 'Business Permit', NULL, 150.00, 'DTI Registration, Lease Contract', NULL, NULL, 'A4', 180, 1, 1, '2026-02-24 17:36:45');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_passwordreset`
--

CREATE TABLE `tbl_passwordreset` (
  `reset_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `ip_request` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `attempt_count` int(11) DEFAULT 0,
  `is_used` tinyint(1) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tbl_payments`
--

CREATE TABLE `tbl_payments` (
  `payment_id` int(11) NOT NULL,
  `request_id` int(11) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `or_number` varchar(100) NOT NULL,
  `payment_date` datetime DEFAULT current_timestamp(),
  `treasurer_id` int(11) DEFAULT NULL,
  `payment_status` enum('Unpaid','Paid','Refunded','Exempted') DEFAULT 'Unpaid',
  `payor_name` varchar(255) NOT NULL,
  `receipt_copy` varchar(255) DEFAULT NULL,
  `audit_hash` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_payments`
--

INSERT INTO `tbl_payments` (`payment_id`, `request_id`, `amount_paid`, `or_number`, `payment_date`, `treasurer_id`, `payment_status`, `payor_name`, `receipt_copy`, `audit_hash`) VALUES
(7, 1, 50.00, 'OR-12345', '2026-02-24 19:01:23', 1, 'Paid', 'Juan Dela Cruz', NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_requests`
--

CREATE TABLE `tbl_requests` (
  `request_id` int(11) NOT NULL,
  `resident_id` int(11) NOT NULL,
  `doc_type_id` int(11) NOT NULL,
  `reference_no` varchar(100) NOT NULL,
  `purpose` varchar(255) NOT NULL,
  `rejection_reason` text DEFAULT NULL,
  `request_status` enum('Pending','For Verification','For Payment','Processing','Ready for Pickup','Issued','Rejected','Cancelled') DEFAULT 'Pending',
  `date_requested` datetime DEFAULT current_timestamp(),
  `qr_code_string` varchar(255) DEFAULT NULL,
  `pickup_date` datetime DEFAULT NULL,
  `processed_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_requests`
--

INSERT INTO `tbl_requests` (`request_id`, `resident_id`, `doc_type_id`, `reference_no`, `purpose`, `rejection_reason`, `request_status`, `date_requested`, `qr_code_string`, `pickup_date`, `processed_by`) VALUES
(1, 1, 1, 'REQ-20260224-7448', 'Employment', NULL, 'Processing', '2026-02-24 17:56:04', 'f6cc53e3dd8a5e4ff63bb9849acbf8e0aa90f0d27bdc2c52feef5be7988fa5c4', NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `tbl_residents`
--

CREATE TABLE `tbl_residents` (
  `resident_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `date_of_birth` date NOT NULL,
  `civil_status` enum('Single','Married','Widowed','Divorced') NOT NULL,
  `address_street` varchar(255) NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `contact_number` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `id_proof_image` varchar(255) DEFAULT NULL,
  `account_status` enum('Pending','Active','Blocked') DEFAULT 'Pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_residents`
--

INSERT INTO `tbl_residents` (`resident_id`, `first_name`, `middle_name`, `last_name`, `date_of_birth`, `civil_status`, `address_street`, `email_address`, `contact_number`, `password_hash`, `id_proof_image`, `account_status`) VALUES
(1, 'test', NULL, 'testt', '2020-01-01', 'Single', 'kahit saan', 'test@gmail.com', '7d5390daa3c63194f01294d0607e7d67:32ff3ce0a21aa7d92432be3f79acecf78c4d5e16f1f52f16c2977d568e02762d', 'ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae', 'secure_dummy_id_12345.enc', 'Active');

-- --------------------------------------------------------

--
-- Table structure for table `tbl_systemsettings`
--

CREATE TABLE `tbl_systemsettings` (
  `setting_id` int(11) NOT NULL,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `data_type` enum('String','Boolean','Integer','JSON') DEFAULT 'String',
  `is_encrypted` tinyint(1) DEFAULT 0,
  `last_updated` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `updated_by` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tbl_systemsettings`
--

INSERT INTO `tbl_systemsettings` (`setting_id`, `setting_key`, `setting_value`, `description`, `category`, `data_type`, `is_encrypted`, `last_updated`, `updated_by`) VALUES
(1, 'barangay_name', 'Barangay New Name 123', 'The official name of the barangay', NULL, 'String', 0, '2026-02-24 17:35:15', 1),
(2, 'contact_email', 'admin@brgy143.gov.ph', 'Public contact email', NULL, 'String', 0, '2026-02-24 17:24:55', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `tbl_announcements`
--
ALTER TABLE `tbl_announcements`
  ADD PRIMARY KEY (`announcement_id`),
  ADD KEY `posted_by` (`posted_by`);

--
-- Indexes for table `tbl_auditlogs`
--
ALTER TABLE `tbl_auditlogs`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `tbl_barangayofficials`
--
ALTER TABLE `tbl_barangayofficials`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `official_id` (`official_id`),
  ADD UNIQUE KEY `email_official` (`email_official`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `tbl_digitalsignatures`
--
ALTER TABLE `tbl_digitalsignatures`
  ADD PRIMARY KEY (`signature_id`),
  ADD KEY `official_id` (`official_id`);

--
-- Indexes for table `tbl_documenttypes`
--
ALTER TABLE `tbl_documenttypes`
  ADD PRIMARY KEY (`doc_type_id`),
  ADD KEY `updated_by` (`updated_by`);

--
-- Indexes for table `tbl_passwordreset`
--
ALTER TABLE `tbl_passwordreset`
  ADD PRIMARY KEY (`reset_id`);

--
-- Indexes for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD UNIQUE KEY `request_id` (`request_id`),
  ADD UNIQUE KEY `or_number` (`or_number`),
  ADD KEY `treasurer_id` (`treasurer_id`);

--
-- Indexes for table `tbl_requests`
--
ALTER TABLE `tbl_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD UNIQUE KEY `reference_no` (`reference_no`),
  ADD UNIQUE KEY `qr_code_string` (`qr_code_string`),
  ADD KEY `resident_id` (`resident_id`),
  ADD KEY `doc_type_id` (`doc_type_id`),
  ADD KEY `processed_by` (`processed_by`);

--
-- Indexes for table `tbl_residents`
--
ALTER TABLE `tbl_residents`
  ADD PRIMARY KEY (`resident_id`),
  ADD UNIQUE KEY `email_address` (`email_address`);

--
-- Indexes for table `tbl_systemsettings`
--
ALTER TABLE `tbl_systemsettings`
  ADD PRIMARY KEY (`setting_id`),
  ADD UNIQUE KEY `setting_key` (`setting_key`),
  ADD KEY `updated_by` (`updated_by`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `tbl_announcements`
--
ALTER TABLE `tbl_announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_auditlogs`
--
ALTER TABLE `tbl_auditlogs`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `tbl_barangayofficials`
--
ALTER TABLE `tbl_barangayofficials`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `tbl_digitalsignatures`
--
ALTER TABLE `tbl_digitalsignatures`
  MODIFY `signature_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_documenttypes`
--
ALTER TABLE `tbl_documenttypes`
  MODIFY `doc_type_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `tbl_passwordreset`
--
ALTER TABLE `tbl_passwordreset`
  MODIFY `reset_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `tbl_requests`
--
ALTER TABLE `tbl_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_residents`
--
ALTER TABLE `tbl_residents`
  MODIFY `resident_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `tbl_systemsettings`
--
ALTER TABLE `tbl_systemsettings`
  MODIFY `setting_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `tbl_announcements`
--
ALTER TABLE `tbl_announcements`
  ADD CONSTRAINT `tbl_announcements_ibfk_1` FOREIGN KEY (`posted_by`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_digitalsignatures`
--
ALTER TABLE `tbl_digitalsignatures`
  ADD CONSTRAINT `tbl_digitalsignatures_ibfk_1` FOREIGN KEY (`official_id`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `tbl_documenttypes`
--
ALTER TABLE `tbl_documenttypes`
  ADD CONSTRAINT `tbl_documenttypes_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_payments`
--
ALTER TABLE `tbl_payments`
  ADD CONSTRAINT `tbl_payments_ibfk_1` FOREIGN KEY (`request_id`) REFERENCES `tbl_requests` (`request_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_payments_ibfk_2` FOREIGN KEY (`treasurer_id`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_requests`
--
ALTER TABLE `tbl_requests`
  ADD CONSTRAINT `tbl_requests_ibfk_1` FOREIGN KEY (`resident_id`) REFERENCES `tbl_residents` (`resident_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tbl_requests_ibfk_2` FOREIGN KEY (`doc_type_id`) REFERENCES `tbl_documenttypes` (`doc_type_id`),
  ADD CONSTRAINT `tbl_requests_ibfk_3` FOREIGN KEY (`processed_by`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE SET NULL;

--
-- Constraints for table `tbl_systemsettings`
--
ALTER TABLE `tbl_systemsettings`
  ADD CONSTRAINT `tbl_systemsettings_ibfk_1` FOREIGN KEY (`updated_by`) REFERENCES `tbl_barangayofficials` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
