const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ─── Instance 1: Sensitive Files (ID proofs, supporting docs, templates) ───
// Uses memory storage so we get the buffer and encrypt it before saving.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: fileFilter
});

// ─── Instance 2: Announcement Images (Public, NOT encrypted) ───
// Uses diskStorage since announcement images are public content (no sensitive data).
const announcementImageDir = path.join(__dirname, '..', 'uploads', 'announcements');
if (!fs.existsSync(announcementImageDir)) fs.mkdirSync(announcementImageDir, { recursive: true });

const announcementStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, announcementImageDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `announcement_${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    }
});

const announcementFileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG, PNG, and WebP image files are allowed for announcements.'), false);
    }
};

const uploadAnnouncement = multer({
    storage: announcementStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
    fileFilter: announcementFileFilter
});

module.exports = { upload, uploadAnnouncement };