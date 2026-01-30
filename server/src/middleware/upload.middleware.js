import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 1. Setup the Vault Folder
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. Encryption Setup (AES-256)
// We hash the .env key to ensure it is exactly 32 bytes
const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = crypto.createHash('sha256').update(String(process.env.FILE_ENCRYPTION_KEY)).digest('base64').substr(0, 32);

// 3. Configure Multer to use RAM (Hold file briefly)
const storage = multer.memoryStorage();

// 4. File Filter (Reject EXEs, allow Images/PDFs)
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Only Images and PDFs are allowed!'));
    }
};

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB Limit
    fileFilter: fileFilter
});

// 5. HELPER: Encrypt & Save (Now supports Custom Paths)
export const saveEncryptedFile = (buffer, originalName, referenceNo, customPath = './uploads') => {
    // 1. Ensure the custom path exists
    // If the Admin set a path that doesn't exist, we try to create it.
    if (!fs.existsSync(customPath)){
        try {
            fs.mkdirSync(customPath, { recursive: true });
        } catch (err) {
            console.error("Custom Path Error:", err);
            // Fallback to default if custom path fails (e.g., permission error)
            customPath = './uploads'; 
            if (!fs.existsSync(customPath)) fs.mkdirSync(customPath);
        }
    }

    // 2. Generate the Secure Filename
    // Naming Strategy: REQ-123456_filename.png.enc
    const extension = path.extname(originalName);
    const secureName = `${referenceNo}_${originalName}${extension}.enc`; 
    const filepath = path.join(customPath, secureName);

    // 3. Create IV & Encrypt
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    // 4. Save to the specific folder
    fs.writeFileSync(filepath, encrypted);

    return secureName;
};

// 6. HELPER: Decrypt & Read (Call this in "View" Route)
export const getDecryptedFile = (filename) => {
    const filepath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filepath)) return null;

    // Read Encrypted File
    const encryptedBuffer = fs.readFileSync(filepath);

    // Split IV and Data
    const iv = encryptedBuffer.slice(0, 16);
    const data = encryptedBuffer.slice(16);

    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return decrypted;
};