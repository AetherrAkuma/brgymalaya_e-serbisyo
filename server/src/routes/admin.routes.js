import express from 'express';
import { loginAdmin } from '../controllers/admin.controller.js';

const router = express.Router();

// Public Admin Route (The Login Door)
router.post('/login', loginAdmin);

export default router;