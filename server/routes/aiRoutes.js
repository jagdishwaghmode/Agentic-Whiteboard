import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { generateAIDiagram, modifyAIDiagram, generateDiagramWithKroki } from '../controllers/aiController.js';
import { generateEditableDiagramController } from '../controllers/diagramController.js';
import { generateProfessionalDiagram } from '../controllers/professionalDiagramController.js';

const router = express.Router();

router.use(protect);

router.post('/generate', generateAIDiagram);
router.post('/generate-diagram', generateDiagramWithKroki);
router.post('/generate-editable-diagram', generateEditableDiagramController);
router.post('/generate-professional-diagram', generateProfessionalDiagram);
router.post('/modify', modifyAIDiagram);

export default router;
