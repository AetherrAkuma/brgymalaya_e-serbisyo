const multer = require('multer');

// Use memory storage so we get the file buffer directly in RAM.
// We DO NOT want multer to save the file automatically because it would save it unencrypted.
const storage = multer.memoryStorage();

// Limit file size to 5MB and restrict to common image types / PDFs
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

module.exports = upload;