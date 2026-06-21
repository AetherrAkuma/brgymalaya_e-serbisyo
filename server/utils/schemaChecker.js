const fs = require('fs');
const path = require('path');

/**
 * Parses the tables and columns from schema.sql file content.
 * @param {string} sqlContent 
 * @returns {object} A map of tables to columns and their types
 */
function parseSchemaSql(sqlContent) {
    // Remove comments
    const noComments = sqlContent
        .replace(/--.*$/gm, '') // Remove single line comments
        .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove block comments

    // Regex to capture CREATE TABLE definitions
    const tableRegex = /CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)\s*\(([\s\S]*?)\);/gi;
    const schema = {};
    let match;

    while ((match = tableRegex.exec(noComments)) !== null) {
        const tableName = match[1];
        const body = match[2];
        const columns = {};
        const createSql = match[0].trim();

        const lines = body.split('\n');
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;

            // Skip table level constraints
            const upperLine = line.toUpperCase();
            if (upperLine.startsWith('PRIMARY KEY') ||
                upperLine.startsWith('FOREIGN KEY') ||
                upperLine.startsWith('UNIQUE KEY') ||
                upperLine.startsWith('KEY') ||
                upperLine.startsWith('UNIQUE') ||
                upperLine.startsWith('CONSTRAINT')) {
                continue;
            }

            // Extract column name and type
            // Matches: col_name TYPE_DEFINITION
            const typeMatch = line.match(/^\s*[`"]?(\w+)[`"]?\s+([a-zA-Z]+(?:\s*\([^)]+\))?)/i);
            if (typeMatch) {
                const colName = typeMatch[1];
                const colType = typeMatch[2];
                // Clean line (remove trailing comma)
                const cleanLine = line.replace(/,$/, '').trim();
                columns[colName] = {
                    type: colType,
                    rawLine: cleanLine
                };
            }
        }
        schema[tableName] = {
            columns,
            createSql
        };
    }
    return schema;
}

/**
 * Normalizes SQL data type definitions for comparison.
 * E.g., int(11) -> int, BOOLEAN -> tinyint(1), JSON -> longtext (in MariaDB)
 * @param {string} typeStr 
 * @returns {string} Normalized type string
 */
function normalizeType(typeStr) {
    let normalized = typeStr.toLowerCase().trim().replace(/\s+/g, '');
    if (normalized.startsWith('int(') || normalized === 'int') {
        return 'int';
    }
    if (normalized === 'boolean') {
        return 'tinyint(1)';
    }
    if (normalized === 'json') {
        return 'longtext';
    }
    return normalized;
}

/**
 * Verifies that the live database schema matches the expected schema in schema.sql.
 * Automatically attempts to create tables, add columns, or alter mismatching types.
 * Prompts user with SQL queries if automatic repair fails.
 * @param {object} db pool instance
 */
async function verifySchema(db) {
    console.log("🔍 Checking database schema synchronization against server/schema.sql...");
    try {
        const schemaPath = path.join(__dirname, '..', 'schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.warn(`⚠️  schema.sql file not found at ${schemaPath}. Skipping schema verification.`);
            return;
        }

        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        const parsedSchema = parseSchemaSql(sqlContent);

        // Fetch current columns from information_schema
        const [rows] = await db.query(`
            SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
        `);

        // Group live DB columns by table (case-insensitive keys)
        const dbSchema = {};
        for (const row of rows) {
            const tableKey = row.TABLE_NAME.toLowerCase();
            const colKey = row.COLUMN_NAME.toLowerCase();
            const type = row.COLUMN_TYPE;
            if (!dbSchema[tableKey]) dbSchema[tableKey] = {};
            dbSchema[tableKey][colKey] = { originalName: row.COLUMN_NAME, type: type };
        }

        let issuesFound = 0;
        let resolvedIssues = 0;

        // Check defined schema against live db
        for (const [tableName, tableInfo] of Object.entries(parsedSchema)) {
            const tableKey = tableName.toLowerCase();
            const expectedCols = tableInfo.columns;

            // 1. Check if table is missing
            if (!dbSchema[tableKey]) {
                issuesFound++;
                console.warn(`⚠️  Table [${tableName}] is missing in XAMPP database.`);
                console.log(`⚙️  [AUTO-REPAIR] Attempting to create table [${tableName}]...`);
                
                try {
                    await db.query(tableInfo.createSql);
                    console.log(`✅ [AUTO-REPAIR] Successfully created table [${tableName}].`);
                    resolvedIssues++;
                } catch (err) {
                    console.error(`❌ [AUTO-REPAIR FAILED] Failed to create table [${tableName}]: ${err.message}`);
                    console.warn(`\n👉 Please copy and paste the following SQL command directly into your XAMPP phpMyAdmin console (http://localhost/phpmyadmin):\n`);
                    console.warn(`========================================= COPY SQL COMMAND =========================================`);
                    console.warn(tableInfo.createSql + ";");
                    console.warn(`====================================================================================================\n`);
                }
                continue;
            }

            const liveCols = dbSchema[tableKey];
            for (const [colName, colInfo] of Object.entries(expectedCols)) {
                const colKey = colName.toLowerCase();
                
                // 2. Check if column is missing
                if (!liveCols[colKey]) {
                    issuesFound++;
                    console.warn(`⚠️  Column [${colName}] is missing in table [${tableName}].`);
                    console.log(`⚙️  [AUTO-REPAIR] Attempting to add column [${colName}] to table [${tableName}]...`);
                    
                    const alterSql = `ALTER TABLE ${tableName} ADD COLUMN ${colInfo.rawLine};`;
                    try {
                        await db.query(alterSql);
                        console.log(`✅ [AUTO-REPAIR] Successfully added column [${colName}] to table [${tableName}].`);
                        resolvedIssues++;
                    } catch (err) {
                        console.error(`❌ [AUTO-REPAIR FAILED] Failed to add column [${colName}] to table [${tableName}]: ${err.message}`);
                        console.warn(`\n👉 Please copy and paste the following SQL command directly into your XAMPP phpMyAdmin console (http://localhost/phpmyadmin):\n`);
                        console.warn(`========================================= COPY SQL COMMAND =========================================`);
                        console.warn(alterSql);
                        console.warn(`====================================================================================================\n`);
                    }
                    continue;
                }

                // 3. Check if column type is mismatched
                const liveColInfo = liveCols[colKey];
                const liveTypeNormalized = normalizeType(liveColInfo.type);
                const expectedTypeNormalized = normalizeType(colInfo.type);

                if (liveTypeNormalized !== expectedTypeNormalized) {
                    issuesFound++;
                    console.warn(`⚠️  Type mismatch in [${tableName}].[${colName}]: expected '${colInfo.type}', found '${liveColInfo.type}' in DB.`);
                    console.log(`⚙️  [AUTO-REPAIR] Attempting to modify column [${colName}] type in table [${tableName}]...`);
                    
                    const modifySql = `ALTER TABLE ${tableName} MODIFY COLUMN ${colInfo.rawLine};`;
                    try {
                        await db.query(modifySql);
                        console.log(`✅ [AUTO-REPAIR] Successfully modified column [${colName}] type in table [${tableName}].`);
                        resolvedIssues++;
                    } catch (err) {
                        console.error(`❌ [AUTO-REPAIR FAILED] Failed to modify column [${colName}] in table [${tableName}]: ${err.message}`);
                        console.warn(`\n👉 Please copy and paste the following SQL command directly into your XAMPP phpMyAdmin console (http://localhost/phpmyadmin):\n`);
                        console.warn(`========================================= COPY SQL COMMAND =========================================`);
                        console.warn(modifySql);
                        console.warn(`====================================================================================================\n`);
                    }
                }
            }
        }

        if (issuesFound === 0) {
            console.log("✅ XAMPP database schema is perfectly in sync with server/schema.sql!");
        } else if (resolvedIssues === issuesFound) {
            console.log(`✅ Database schema auto-repair successful: all ${issuesFound} issues were automatically resolved!`);
        } else {
            console.warn(`⚠️  Schema verification complete: Found ${issuesFound} issues. ${resolvedIssues} were auto-repaired, ${issuesFound - resolvedIssues} require manual action.`);
        }
    } catch (err) {
        console.error("❌ Failed to verify database schema:", err.message);
    }
}

module.exports = { verifySchema, parseSchemaSql, normalizeType };
