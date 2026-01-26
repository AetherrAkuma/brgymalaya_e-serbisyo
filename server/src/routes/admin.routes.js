import express from 'express';
import { loginAdmin, getDashboardStats, getAllRequests } from '../controllers/admin.controller.js';
import { verifyAdmin } from '../middleware/adminAuth.middleware.js';
import { authorizeRoles } from '../middleware/rbac.middleware.js';

const router = express.Router();

// 1. PUBLIC ROUTES
// 👇 CHANGED: Added '/auth' prefix here so the full URL is /api/admin/auth/login
router.post('/auth/login', loginAdmin);

// 2. PROTECTED ROUTES (Requires Token + Role Check)

// A. DASHBOARD STATS: Becomes /api/admin/stats (Perfect for Frontend)
router.get('/stats', verifyAdmin, getDashboardStats);

// B. REQUEST QUEUE: Becomes /api/admin/requests
router.get('/requests', verifyAdmin, getAllRequests);

// C. RESIDENTS DATABASE: Only Captain, Secretary, and Treasurer
router.get('/residents', 
    verifyAdmin, 
    authorizeRoles('Captain', 'Secretary', 'Treasurer'), 
    (req, res) => res.json({ message: "Secure Resident Data" }) 
);

// D. ANNOUNCEMENTS: Only Captain and Secretary
router.post('/announcements', 
    verifyAdmin, 
    authorizeRoles('Captain', 'Secretary'), 
    (req, res) => res.json({ message: "Announcement Posted" }) 
);

export default router;