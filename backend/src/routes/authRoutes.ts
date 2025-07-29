import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/register', userController.createUserWithAuth);
router.post('/logout', authController.logout);
router.get('/profile', authenticateToken as any, authController.getProfile);

export default router;