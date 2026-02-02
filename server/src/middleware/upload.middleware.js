import multer from 'multer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// 1. Setup the Vault Folder (Using Absolute Path)
const uploadDir = path.resolve('uploads'); // <--- FIX: Absolute path
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// 2. Encryption Setup (AES-256)
const ALGORITHM = 'aes-256-ctr';
const SECRET_KEY = crypto.createHash('sha256').update(String(process.env.FILE_ENCRYPTION_KEY)).digest('base64').substr(0, 32);

// 3. Configure Multer
const storage = multer.memoryStorage();

// 4. File Filter
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
    limits: { fileSize: 5 * 1024 * 1024 }, 
    fileFilter: fileFilter
});

// 5. HELPER: Encrypt & Save
export const saveEncryptedFile = (buffer, originalName, referenceNo, customPath) => {
    // Use the absolute uploadDir if customPath is not provided
    const targetDir = customPath ? path.resolve(customPath) : uploadDir;

    if (!fs.existsSync(targetDir)){
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const extension = path.extname(originalName);
    const secureName = `${referenceNo}_${originalName}${extension}.enc`; 
    const filepath = path.join(targetDir, secureName);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
    const encrypted = Buffer.concat([iv, cipher.update(buffer), cipher.final()]);

    fs.writeFileSync(filepath, encrypted);

    return secureName;
};

// 6. HELPER: Decrypt & Read
export const getDecryptedFile = (filename) => {
    // Use the absolute path to find the file
    const filepath = path.join(uploadDir, filename);
    
    if (!fs.existsSync(filepath)) {
        console.error(`Decrypt Error: File not found at ${filepath}`);
        return null;
    }

    try {
        const encryptedBuffer = fs.readFileSync(filepath);
        const iv = encryptedBuffer.slice(0, 16);
        const data = encryptedBuffer.slice(16);
        const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
        const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
        return decrypted;
    } catch (err) {
        console.error("Decryption failed:", err);
        throw err;
    }
};