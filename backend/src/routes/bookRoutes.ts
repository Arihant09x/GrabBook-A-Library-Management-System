import { Router } from 'express';
import { getBooks, addBook, updateBook, deleteBook } from '../controllers/bookController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = Router();

router.get('/', protect, getBooks);
router.post('/', protect, adminOnly, addBook);
router.put('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

export default router;
