import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateEditableDiagramController } from '../controllers/diagramController.js';

const router = express.Router();

router.use(protect);

router.post('/generate-editable-diagram', generateEditableDiagramController);

export default router;
