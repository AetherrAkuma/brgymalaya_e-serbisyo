import express from 'express';
import { registerResident, loginUser } from '../controllers/auth.controller.js';
import { body } from 'express-validator';

const router = express.Router();

// Validation Rules
const registerValidation = [
    body('email_address').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required')
];

// Routes
router.post('/register', registerValidation, registerResident);
router.post('/login', loginUser);

export default router;