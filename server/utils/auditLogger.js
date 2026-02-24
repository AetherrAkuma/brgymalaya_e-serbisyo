/**
 * Audit Logger Utility
 * Implements FR13: Audit Trail for all users and system activities
 * Logs to tbl_AuditLogs with: User ID, Action, Timestamp (PH Time), IP Address
 */

const db = require('../config/db');

/**
 * Logs an action to the tbl_AuditLogs table
 * @param {Object} params - Log parameters
 * @param {number} params.user_id - The ID of the user performing the action
 * @param {string} params.user_type - 'Resident', 'Official', or 'System'
 * @param {string} params.table_affected - Database table name (e.g., 'tbl_Requests')
 * @param {number} params.record_id - The ID of the record being modified
 * @param {string} params.action_type - Action performed (e.g., 'CREATE', 'UPDATE', 'DELETE', 'LOGIN')
 * @param {Object} params.old_value - Previous state (will be JSON stringified)
 * @param {Object} params.new_value - New state (will be JSON stringified)
 * @param {string} params.ip_address - Client IP address
 */
async function logAction({ user_id, user_type, table_affected, record_id, action_type, old_value, new_value, ip_address }) {
    try {
        const query = `
            INSERT INTO tbl_AuditLogs 
            (user_id, user_type, table_affected, record_id, action_type, old_value, new_value, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        // Stringify JSON objects for storage (per ERD: JSON column type)
        const oldValueStr = old_value ? JSON.stringify(old_value) : null;
        const newValueStr = new_value ? JSON.stringify(new_value) : null;

        await db.query(query, [
            user_id,
            user_type,
            table_affected,
            record_id,
            action_type,
            oldValueStr,
            newValueStr,
            ip_address || '0.0.0.0'
        ]);

        console.log(`[AUDIT] ${user_type} ID ${user_id} performed ${action_type} on ${table_affected}#${record_id}`);
    } catch (error) {
        // Log failure should not break the main operation
        console.error('[AUDIT LOGGING ERROR]', error.message);
    }
}

/**
 * Convenience function for login events
 */
async function logLogin(user_id, user_type, ip_address) {
    await logAction({
        user_id,
        user_type,
        table_affected: 'auth',
        record_id: user_id,
        action_type: 'LOGIN',
        old_value: null,
        new_value: { login_time: new Date().toISOString() },
        ip_address
    });
}

/**
 * Convenience function for document status changes
 */
async function logStatusChange(user_id, user_type, table_affected, record_id, old_status, new_status, ip_address) {
    await logAction({
        user_id,
        user_type,
        table_affected,
        record_id,
        action_type: 'STATUS_CHANGE',
        old_value: { status: old_status },
        new_value: { status: new_status },
        ip_address
    });
}

/**
 * Convenience function for document printing
 */
async function logDocumentPrint(user_id, user_type, request_id, reference_no, ip_address) {
    await logAction({
        user_id,
        user_type,
        table_affected: 'tbl_Requests',
        record_id: request_id,
        action_type: 'DOCUMENT_PRINTED',
        old_value: null,
        new_value: { reference_no, printed_at: new Date().toISOString() },
        ip_address
    });
}

/**
 * Convenience function for payment encoding
 */
async function logPayment(user_id, user_type, request_id, amount, or_number, ip_address) {
    await logAction({
        user_id,
        user_type,
        table_affected: 'tbl_Payments',
        record_id: request_id,
        action_type: 'PAYMENT_ENCODED',
        old_value: null,
        new_value: { amount, or_number, encoded_at: new Date().toISOString() },
        ip_address
    });
}

module.exports = {
    logAction,
    logLogin,
    logStatusChange,
    logDocumentPrint,
    logPayment
};
