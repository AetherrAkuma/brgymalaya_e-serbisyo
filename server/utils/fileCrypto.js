const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';

// STABILITY CHECK: Ensure the key is exactly 32 bytes (64 hex chars)
const rawKey = process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
const ENCRYPTION_KEY = Buffer.from(rawKey, 'hex');

if (ENCRYPTION_KEY.length !== 32) {
    console.error("❌ FATAL: ENCRYPTION_KEY must be a 64-character HEX string (32 bytes). Current length:", ENCRYPTION_KEY.length);
    process.exit(1); 
}

console.log("✅ File Encryption System initialized with a stable 32-byte key.");

const encryptAndSaveFile = (fileBuffer, outputFilename) => {
    const iv = crypto.randomBytes(16); // Unique IV for every file
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Prepend IV (16 bytes) + Encrypted Data
    const encryptedBuffer = Buffer.concat([iv, cipher.update(fileBuffer), cipher.final()]);
    
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
    
    fs.writeFileSync(path.join(uploadsDir, outputFilename), encryptedBuffer);
    return outputFilename;
};

const decryptFileBuffer = (filename) => {
    const filePath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(filePath)) throw new Error('File not found.');
    
    const fileData = fs.readFileSync(filePath);
    
    // Extract the exact 16 bytes for the IV
    const iv = fileData.subarray(0, 16);
    const encryptedData = fileData.subarray(16);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
};

module.exports = { encryptAndSaveFile, decryptFileBuffer };