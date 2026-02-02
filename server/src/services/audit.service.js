import { getConnection } from '../config/db.js';

export const logAction = async (user_id, user_type, action_type, table_affected, record_id, details, req) => {
    let conn;
    try {
        conn = await getConnection();
        
        // Capture IP Address (Required by FR13)
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        const query = `
            INSERT INTO tbl_AuditLogs 
            (user_id, user_type, action_type, table_affected, record_id, new_value, ip_address, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        // We store the 'details' (like "Updated status to Approved") in the 'new_value' column for readability
        await conn.query(query, [
            user_id, 
            user_type, 
            action_type, 
            table_affected, 
            record_id, 
            JSON.stringify(details), // Convert object to string
            ip_address
        ]);

        console.log(`[AUDIT] ${action_type} on ${table_affected} #${record_id}`);

    } catch (err) {
        console.error("Audit Log Error:", err);
        // Important: Don't crash the app if logging fails, just report it
    } finally {
        if (conn) conn.end();
    }
};