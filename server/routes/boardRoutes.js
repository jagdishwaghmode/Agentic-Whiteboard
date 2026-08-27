import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  createBoard,
  getBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';

const router = express.Router();

router.use(protect);

router.route('/').post(createBoard).get(getBoards);
router.route('/:id').get(getBoardById).put(updateBoard).delete(deleteBoard);

export default router;
