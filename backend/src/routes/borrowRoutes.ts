import { Router } from 'express';
import { borrowBook, returnBook, getBorrowings } from '../controllers/borrowController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, borrowBook);
router.post('/return', protect, returnBook);
router.get('/', protect, getBorrowings);

export default router;
