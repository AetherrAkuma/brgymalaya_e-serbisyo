import express from 'express';
import { getDocumentTypes } from '../controllers/request.controller.js';

const router = express.Router();

// Define the endpoint
router.get('/types', getDocumentTypes);

export default router;