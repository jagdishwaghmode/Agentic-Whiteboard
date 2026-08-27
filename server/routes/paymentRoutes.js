import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { listPlans, getCredits, createOrder, verifyOrder } from '../controllers/paymentController.js';

const router = express.Router();
router.get('/plans', listPlans);
router.use(protect);
router.get('/credits', getCredits);
router.post('/create-order', createOrder);
router.post('/verify', verifyOrder);
export default router;
