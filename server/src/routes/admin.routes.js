import express from 'express';
import { loginAdmin, getDashboardStats, getAllRequests } from '../controllers/admin.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js'; // <--- Import the new Bouncer

const router = express.Router();

// 1. PUBLIC ROUTES
router.post('/login', loginAdmin);

// 2. PROTECTED ROUTES (Requires Token + Role Check)

// A. DASHBOARD STATS: Everyone can see this
router.get('/stats', verifyAdmin, getDashboardStats);

// B. REQUEST QUEUE: Everyone can see the list (but actions might be restricted later)
router.get('/requests', verifyAdmin, getAllRequests);

// C. RESIDENTS DATABASE: Only Captain, Secretary, and Treasurer
// (Kagawads are blocked from seeing private resident info)
router.get('/residents', 
    verifyAdmin, 
    authorizeRoles('Captain', 'Secretary', 'Treasurer'), 
    (req, res) => res.json({ message: "Secure Resident Data" }) // Placeholder for real controller
);

// D. ANNOUNCEMENTS: Only Captain and Secretary
// (Treasurers and Kagawads are blocked)
router.post('/announcements', 
    verifyAdmin, 
    authorizeRoles('Captain', 'Secretary'), 
    (req, res) => res.json({ message: "Announcement Posted" }) // Placeholder
);

export default router;