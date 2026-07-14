/**
 * Audit Logger Utility
 * Implements FR13: Audit Trail for all users and system activities
 * Core Schema Fields:
 *   Timestamp: ISO-8601 UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
 *   Actor: Unique identifier (user ID)
 *   Action: Standardised verb (e.g. user.login, document.delete)
 *   Target: Resource affected (ID and type)
 *   Outcome: Result status (success or failure)
 *   Context: Network metadata (source IP + user-agent)
 */

const db = require('../config/db');

/**
 * Logs an action to the tbl_AuditLogs table
 * @param {Object} params
 * @param {number} params.user_id - Actor (unique identifier)
 * @param {string} params.user_type - 'Resident', 'Official', or 'System'
 * @param {string} params.table_affected - Target resource type (e.g. 'tbl_Requests')
 * @param {number|null} params.record_id - Target resource ID
 * @param {string} params.action_type - Standardised verb (e.g. 'user.login', 'document.delete')
 * @param {string} [params.outcome='success'] - 'success' or 'failure'
 * @param {Object|null} [params.old_value=null] - Previous state (JSON-stringified)
 * @param {Object|null} [params.new_value=null] - New state (JSON-stringified)
 * @param {string} [params.ip_address='0.0.0.0'] - Context: source IP
 * @param {string|null} [params.user_agent=null] - Context: user-agent string
 */
async function logAction({ user_id, user_type, table_affected, record_id, action_type, outcome = 'success', old_value = null, new_value = null, ip_address = '0.0.0.0', user_agent = null }) {
    try {
        const query = `
            INSERT INTO tbl_AuditLogs 
            (user_id, user_type, table_affected, record_id, action_type, outcome, old_value, new_value, ip_address, user_agent)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const oldValueStr = old_value ? JSON.stringify(old_value) : null;
        const newValueStr = new_value ? JSON.stringify(new_value) : null;

        await db.query(query, [
            user_id, user_type, table_affected, record_id, action_type, outcome,
            oldValueStr, newValueStr, ip_address, user_agent
        ]);

        console.log(`[AUDIT] ${user_type} ID ${user_id} | ${action_type} → ${outcome} | ${table_affected}#${record_id}`);
    } catch (error) {
        console.error('[AUDIT LOGGING ERROR]', error.message);
    }
}

/**
 * Login event
 */
async function logLogin(user_id, user_type, ip_address, user_agent = null, outcome = 'success') {
    await logAction({
        user_id, user_type,
        table_affected: 'auth',
        record_id: user_id,
        action_type: 'user.login',
        outcome,
        old_value: null,
        new_value: { login_time: new Date().toISOString() },
        ip_address,
        user_agent
    });
}

/**
 * Document / resource status change
 */
async function logStatusChange(user_id, user_type, table_affected, record_id, old_status, new_status, ip_address, user_agent = null, outcome = 'success') {
    await logAction({
        user_id, user_type, table_affected, record_id,
        action_type: `${table_affected.replace('tbl_', '').toLowerCase()}.status_change`,
        outcome,
        old_value: { status: old_status },
        new_value: { status: new_status },
        ip_address, user_agent
    });
}

/**
 * Document printed
 */
async function logDocumentPrint(user_id, user_type, request_id, reference_no, ip_address, user_agent = null, outcome = 'success') {
    await logAction({
        user_id, user_type,
        table_affected: 'tbl_Requests',
        record_id: request_id,
        action_type: 'document.print',
        outcome,
        old_value: null,
        new_value: { reference_no, printed_at: new Date().toISOString() },
        ip_address, user_agent
    });
}

/**
 * Payment encoded or exempted
 */
async function logPayment(user_id, user_type, request_id, amount, or_number, ip_address, user_agent = null, outcome = 'success') {
    const action = Number(amount) === 0 ? 'payment.exempt' : 'payment.encode';
    await logAction({
        user_id, user_type,
        table_affected: 'tbl_Payments',
        record_id: request_id,
        action_type: action,
        outcome,
        old_value: null,
        new_value: { amount, or_number, encoded_at: new Date().toISOString() },
        ip_address, user_agent
    });
}

module.exports = {
    logAction,
    logLogin,
    logStatusChange,
    logDocumentPrint,
    logPayment
};
