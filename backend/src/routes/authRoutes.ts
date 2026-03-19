import { Router } from 'express';
import { register, login, requestOtp, verifyOtp, upgrade } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/otp/request', requestOtp);
router.post('/otp/verify', verifyOtp);
router.post('/upgrade', protect, upgrade);

export default router;
