const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');

/**
 * Encrypts a raw file buffer and saves it to the disk
 * @param {Buffer} fileBuffer - The raw file data from multer
 * @param {string} outputFilename - The name to save the file as
 * @returns {string} - The saved filename
 */
const encryptAndSaveFile = (fileBuffer, outputFilename) => {
    // Generate a 16-byte initialization vector (IV) for the file
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    // Concat the IV and the encrypted file buffer together
    const encryptedBuffer = Buffer.concat([iv, cipher.update(fileBuffer), cipher.final()]);
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }
    
    // Save to disk
    const filePath = path.join(uploadsDir, outputFilename);
    fs.writeFileSync(filePath, encryptedBuffer);
    return outputFilename;
};

/**
 * Reads an encrypted file from disk and decrypts it back to a readable buffer
 * @param {string} filename - The name of the encrypted file
 * @returns {Buffer} - The decrypted file buffer
 */
const decryptFileBuffer = (filename) => {
    const filePath = path.join(__dirname, '../uploads', filename);
    if (!fs.existsSync(filePath)) {
        throw new Error('File not found on server.');
    }
    
    // Read the encrypted file
    const fileData = fs.readFileSync(filePath);
    
    // Extract the 16-byte IV from the beginning of the file
    const iv = fileData.subarray(0, 16);
    const encryptedBuffer = fileData.subarray(16);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    const decryptedBuffer = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    
    return decryptedBuffer;
};

module.exports = { encryptAndSaveFile, decryptFileBuffer };