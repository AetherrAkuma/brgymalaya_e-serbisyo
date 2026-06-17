const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');
require('dotenv').config();
const db = require('./config/db');

async function run() {
    console.log("=== Seeding QR Verification Test ===");
    try {
        const testHash = "verify_test_cryptographic_hash_999";
        const verificationBase = process.env.VERIFICATION_BASE_URL || 'http://localhost:5173/verify';
        const verificationUrl = `${verificationBase}/${testHash}`;

        // 1. Create a dummy resident in database if not exists
        const [existingResident] = await db.query("SELECT resident_id FROM tbl_Residents WHERE email_address = 'test-verifier@malaya.gov.ph'");
        let residentId;
        if (existingResident.length > 0) {
            residentId = existingResident[0].resident_id;
        } else {
            const [res] = await db.query(
                `INSERT INTO tbl_Residents (first_name, last_name, date_of_birth, civil_status, address_street, email_address, contact_number, password_hash, account_status)
                 VALUES ('Maria', 'Dela Cruz', '1995-05-15', 'Single', 'Blk 5 Lot 2 Barangay Malaya', 'test-verifier@malaya.gov.ph', '09171234567', 'dummypasswordhash', 'Active')`
            );
            residentId = res.insertId;
        }

        // 2. Create a dummy document type if not exists
        const [existingDocType] = await db.query("SELECT doc_type_id FROM tbl_DocumentTypes WHERE type_name = 'Test Barangay Clearance'");
        let docTypeId;
        if (existingDocType.length > 0) {
            docTypeId = existingDocType[0].doc_type_id;
        } else {
            // Find a system official
            const [officials] = await db.query("SELECT user_id FROM tbl_BarangayOfficials LIMIT 1");
            const officialId = officials.length > 0 ? officials[0].user_id : null;
            
            const [res] = await db.query(
                `INSERT INTO tbl_DocumentTypes (type_name, description, base_fee, requirements, validity_days, is_available, updated_by)
                 VALUES ('Test Barangay Clearance', 'Verification test document', 50.00, 'Valid ID', 180, 1, ?)`
            , [officialId]);
            docTypeId = res.insertId;
        }

        // 3. Upsert a dummy request linked to this hash with 'Issued' status
        await db.query("DELETE FROM tbl_Requests WHERE qr_code_string = ?", [testHash]);
        const refNo = `REQ-TEST-VERIFY-${Date.now().toString().slice(-4)}`;
        await db.query(
            `INSERT INTO tbl_Requests (resident_id, doc_type_id, reference_no, purpose, request_status, qr_code_string, pickup_date)
             VALUES (?, ?, ?, 'Verification Test Purposes', 'Issued', ?, NOW())`
        , [residentId, docTypeId, refNo, testHash]);

        // 4. Generate the QR code image file at the project root folder
        const qrImgPath = path.join(__dirname, '..', 'test-qr.png');
        await QRCode.toFile(qrImgPath, verificationUrl, {
            width: 300,
            margin: 2
        });

        console.log(`\nSUCCESS! Verification record inserted:`);
        console.log(`- Reference No: ${refNo}`);
        console.log(`- Resident Name: Maria Dela Cruz`);
        console.log(`- Verification Hash: ${testHash}`);
        console.log(`- Target Verification URL: ${verificationUrl}`);
        console.log(`\nQR Code file generated successfully at:`);
        console.log(`-> ${qrImgPath}`);
        console.log(`\nHow to test:`);
        console.log(`1. Open the E-Serbisyo website at http://localhost:5173/verify`);
        console.log(`2. Go to the "Upload Image" tab.`);
        console.log(`3. Select or drag-and-drop the generated "test-qr.png" file from your project root.`);
        console.log(`4. Verify it parses the details successfully and displays the green "DOCUMENT VERIFIED AUTHENTIC" badge!`);

        process.exit(0);
    } catch (error) {
        console.error("Seeding failed with error:", error);
        process.exit(1);
    }
}

run();
