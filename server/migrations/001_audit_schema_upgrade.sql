-- ============================================================
-- Migration 001: Audit Log Schema Upgrade
-- Run this ONCE against your existing XAMPP MySQL database
-- after pulling the new schema changes.
-- ============================================================

-- 1. Add outcome column (with default 'success' for existing rows)
ALTER TABLE tbl_AuditLogs
  ADD COLUMN outcome ENUM('success', 'failure') NOT NULL DEFAULT 'success'
  AFTER action_type;

-- 2. Add user_agent column
ALTER TABLE tbl_AuditLogs
  ADD COLUMN user_agent TEXT
  AFTER ip_address;

-- 3. Add performance indexes
ALTER TABLE tbl_AuditLogs
  ADD INDEX idx_timestamp (timestamp),
  ADD INDEX idx_action (action_type),
  ADD INDEX idx_outcome (outcome);

-- 4. Backfill existing old-style action types to dot notation
UPDATE tbl_AuditLogs SET action_type = 'user.login'               WHERE action_type = 'LOGIN';
UPDATE tbl_AuditLogs SET action_type = 'document.status_change'   WHERE action_type = 'STATUS_CHANGE';
UPDATE tbl_AuditLogs SET action_type = 'payment.encode'           WHERE action_type = 'PAYMENT_ENCODED';
UPDATE tbl_AuditLogs SET action_type = 'document.print'           WHERE action_type = 'DOCUMENT_PRINTED';
UPDATE tbl_AuditLogs SET action_type = 'announcement.approve'     WHERE action_type = 'APPROVE_ANNOUNCEMENT';
UPDATE tbl_AuditLogs SET action_type = 'announcement.reject'      WHERE action_type = 'REJECT_ANNOUNCEMENT';
UPDATE tbl_AuditLogs SET action_type = 'registration.reject'      WHERE action_type = 'REJECT_REGISTRATION';
UPDATE tbl_AuditLogs SET action_type = 'official.create'          WHERE action_type = 'CREATE'           AND table_affected = 'tbl_BarangayOfficials';
UPDATE tbl_AuditLogs SET action_type = 'official.status_change'   WHERE action_type = 'STATUS_CHANGE'    AND table_affected = 'tbl_BarangayOfficials';
UPDATE tbl_AuditLogs SET action_type = 'official.delete'          WHERE action_type = 'DELETE'           AND table_affected = 'tbl_BarangayOfficials';
UPDATE tbl_AuditLogs SET action_type = 'system.backup'            WHERE action_type = 'BACKUP_CREATED';
UPDATE tbl_AuditLogs SET action_type = 'system.restore'           WHERE action_type = 'SYSTEM_RESTORED';
UPDATE tbl_AuditLogs SET action_type = 'system.backup_delete'     WHERE action_type = 'BACKUP_DELETED';
UPDATE tbl_AuditLogs SET action_type = 'document.auto_delete_id_proof' WHERE action_type = 'AUTO_DELETE_ID_PROOF';
UPDATE tbl_AuditLogs SET action_type = 'resident.quick_register'  WHERE action_type = 'QUICK_REGISTER_RESIDENT';

-- 5. Backfill per-table status_change actions (for tbl_Requests records)
UPDATE tbl_AuditLogs t
  JOIN tbl_Requests r ON r.request_id = t.record_id
  SET t.action_type = 'requests.status_change'
  WHERE t.action_type = 'STATUS_CHANGE' AND t.table_affected = 'tbl_Requests';

-- Note: Remaining old-style UPDATE/CREATE/DELETE action types are ambiguous;
-- they should be migrated manually if found in the audit log viewer.
