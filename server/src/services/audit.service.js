import { getConnection } from '../config/db.js'; // Ensure path matches your db.js location

export const logAction = async (user_id, user_type, action_type, table_affected, record_id, details, req) => {
    let conn;
    try {
        conn = await getConnection();
        
        // 1. Capture IP Address (Required by FR13)
        // We look for the "Forwarded" header (if using Cloudflare) or the direct socket address
        const ip_address = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0';

        // 2. Prepare the Log Entry
        const query = `
            INSERT INTO tbl_AuditLogs 
            (user_id, user_type, action_type, table_affected, record_id, new_value, ip_address, timestamp) 
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        // 3. Save to Database
        await conn.query(query, [
            user_id, 
            user_type, 
            action_type, 
            table_affected, 
            record_id, 
            JSON.stringify(details), // Store the details (like OR No.) as a text string
            ip_address
        ]);

        console.log(`[AUDIT] ${action_type} on ${table_affected} #${record_id} by User ${user_id}`);

    } catch (err) {
        // Critical: We log the error but we DO NOT crash the app. 
        // The transaction should succeed even if the log fails (though ideally, both succeed).
        console.error("Audit Log Failed:", err);
    } finally {
        if (conn) conn.end();
    }
};