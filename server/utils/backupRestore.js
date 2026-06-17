const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const db = require('../config/db');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure backups directory exists
if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Programmatically dumps all database tables (schema and data) into a SQL string.
 * This is pure JavaScript and does not require mysqldump to be installed.
 */
async function generateSqlDump() {
    let sqlDump = `-- E-Serbisyo Database Backup\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n\n`;
    sqlDump += `SET FOREIGN_KEY_CHECKS = 0;\n\n`;

    // 1. Get all base tables
    const [tables] = await db.query("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
    for (const tableObj of tables) {
        const tableName = Object.values(tableObj)[0];
        sqlDump += `-- -----------------------------------------------------\n`;
        sqlDump += `-- Table Structure for \`${tableName}\`\n`;
        sqlDump += `-- -----------------------------------------------------\n`;
        sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;

        // Get Create Table script
        const [createTableResult] = await db.query(`SHOW CREATE TABLE \`${tableName}\``);
        const createTableSql = createTableResult[0]['Create Table'];
        sqlDump += `${createTableSql};\n\n`;

        // Get Data
        const [rows] = await db.query(`SELECT * FROM \`${tableName}\``);
        if (rows.length > 0) {
            sqlDump += `-- Data Dump for \`${tableName}\`\n`;
            sqlDump += `INSERT INTO \`${tableName}\` VALUES \n`;
            
            const valueStrings = [];
            for (const row of rows) {
                const values = Object.values(row).map(val => {
                    if (val === null) return 'NULL';
                    if (val instanceof Date) {
                        // Format dates to MySQL standard format
                        return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                    }
                    if (typeof val === 'object') {
                        // JSON column
                        const escapedJson = JSON.stringify(val).replace(/(['\\])/g, '\\$1');
                        return `'${escapedJson}'`;
                    }
                    if (typeof val === 'string') {
                        // Escape single quotes and backslashes
                        const escapedStr = val.replace(/(['\\])/g, '\\$1');
                        return `'${escapedStr}'`;
                    }
                    if (typeof val === 'boolean') {
                        return val ? '1' : '0';
                    }
                    return val;
                });
                valueStrings.push(`(${values.join(', ')})`);
            }
            sqlDump += `${valueStrings.join(',\n')};\n\n`;
        }
    }

    sqlDump += `SET FOREIGN_KEY_CHECKS = 1;\n`;
    return sqlDump;
}

/**
 * Creates a backup ZIP containing the database SQL dump and all files in server/uploads.
 */
async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup_${timestamp}.zip`;
    const zipPath = path.join(BACKUP_DIR, filename);

    // 1. Generate database dump
    const sqlDump = await generateSqlDump();
    const tempSqlPath = path.join(BACKUP_DIR, 'backup.sql');
    fs.writeFileSync(tempSqlPath, sqlDump, 'utf8');

    try {
        const zip = new AdmZip();

        // 2. Add SQL Dump to Zip
        zip.addLocalFile(tempSqlPath);

        // 3. Add uploads folder contents
        if (fs.existsSync(UPLOADS_DIR)) {
            const files = fs.readdirSync(UPLOADS_DIR);
            for (const file of files) {
                const filePath = path.join(UPLOADS_DIR, file);
                const stat = fs.statSync(filePath);
                if (stat.isFile()) {
                    zip.addLocalFile(filePath, 'uploads');
                }
            }
        }

        // 4. Write zip file to disk
        zip.writeZip(zipPath);
        return { success: true, filename, path: zipPath };
    } finally {
        // Clean up temp SQL file
        if (fs.existsSync(tempSqlPath)) {
            fs.unlinkSync(tempSqlPath);
        }
    }
}

/**
 * Lists all backups present in the backups folder.
 */
function listBackups() {
    if (!fs.existsSync(BACKUP_DIR)) return [];
    
    return fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('backup_') && file.endsWith('.zip'))
        .map(file => {
            const filePath = path.join(BACKUP_DIR, file);
            const stat = fs.statSync(filePath);
            return {
                filename: file,
                size: stat.size,
                createdAt: stat.mtime
            };
        })
        .sort((a, b) => b.createdAt - a.createdAt); // Newest first
}

/**
 * Restores database tables and uploads from a backup ZIP.
 * WARNING: This overrides existing tables and files.
 */
async function restoreBackup(filename) {
    const zipPath = path.join(BACKUP_DIR, filename);
    if (!fs.existsSync(zipPath)) {
        throw new Error('Backup file not found.');
    }

    const tempExtractDir = path.join(BACKUP_DIR, 'temp_extract');
    if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempExtractDir);

    try {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(tempExtractDir, true);

        // 1. Restore Database from backup.sql
        const sqlPath = path.join(tempExtractDir, 'backup.sql');
        if (fs.existsSync(sqlPath)) {
            const sqlContent = fs.readFileSync(sqlPath, 'utf8');

            // Split SQL content by statement end (semicolon + newline)
            const queries = sqlContent
                .split(/;(?:\r?\n)+/)
                .map(q => q.trim())
                .filter(q => q.length > 0 && !q.startsWith('--'));

            // Run database queries statement-by-statement inside a connection pool
            const connection = await db.getConnection();
            try {
                await connection.query('SET FOREIGN_KEY_CHECKS = 0');
                for (const query of queries) {
                    await connection.query(query);
                }
                await connection.query('SET FOREIGN_KEY_CHECKS = 1');
            } finally {
                connection.release();
            }
        }

        // 2. Restore Uploaded Files
        const extractedUploadsDir = path.join(tempExtractDir, 'uploads');
        if (fs.existsSync(extractedUploadsDir)) {
            if (!fs.existsSync(UPLOADS_DIR)) {
                fs.mkdirSync(UPLOADS_DIR, { recursive: true });
            }

            const files = fs.readdirSync(extractedUploadsDir);
            for (const file of files) {
                const sourcePath = path.join(extractedUploadsDir, file);
                const destPath = path.join(UPLOADS_DIR, file);
                fs.copyFileSync(sourcePath, destPath);
            }
        }

        return { success: true };
    } finally {
        // Clean up temp extraction folder
        if (fs.existsSync(tempExtractDir)) {
            fs.rmSync(tempExtractDir, { recursive: true, force: true });
        }
    }
}

/**
 * Deletes a backup ZIP file from storage.
 */
function deleteBackup(filename) {
    const filePath = path.join(BACKUP_DIR, filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
    }
    return false;
}

module.exports = {
    createBackup,
    listBackups,
    restoreBackup,
    deleteBackup
};
