import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js'; // The RAM Uploader
import { createRequest, getMyRequests } from '../controllers/resident.controller.js';

const router = express.Router();

// 1. Submit a Request (with File Upload)
// verifyResident: Ensures only logged-in residents can access
// upload.single('attachment'): Grabs the file named 'attachment' from the form
// createRequest: The function that encrypts the file and saves to DB
router.post('/submit-request', verifyToken, upload.single('attachment'), createRequest);
// 2. Get My Requests (Resident Dashboard)
router.get('/my-requests', verifyToken, getMyRequests);
export default router;