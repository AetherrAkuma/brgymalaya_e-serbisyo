import express from 'express';
import { getDocumentTypes, createRequest, getMyRequests } from '../controllers/request.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';


const router = express.Router();

// Define the endpoint
router.get('/types', getDocumentTypes);

router.post('/create', verifyToken, createRequest);

router.get('/history', verifyToken, getMyRequests);



export default router;