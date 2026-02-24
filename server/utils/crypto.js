const crypto = require('crypto');
require('dotenv').config();

// Enforce AES-256-CBC requirements
const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', 'hex');

/**
 * Hashes a password using SHA256 (Strictly following FR6)
 * @param {string} password - The plain text password
 * @returns {string} - The SHA256 hashed password
 */
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

/**
 * Encrypts sensitive text using AES256
 * @param {string} text - The plain text to encrypt (e.g., contact number)
 * @returns {string} - The initialization vector (IV) and encrypted string joined by a colon
 */
const encryptData = (text) => {
    if (!text) return text;
    // Generate a random 16-byte initialization vector for each encryption
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Store the IV along with the encrypted data to allow decryption
    return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypts AES256 encrypted text
 * @param {string} encryptedText - The encrypted string containing the IV
 * @returns {string} - The decrypted plain text
 */
const decryptData = (encryptedText) => {
    if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
    
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
};

module.exports = { hashPassword, encryptData, decryptData };