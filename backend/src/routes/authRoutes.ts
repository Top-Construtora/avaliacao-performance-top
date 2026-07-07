import { Router } from 'express';
import { authController } from '../controllers/authController';
import { userController } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { authLimiter } from '../middleware/rateLimit';

const router = Router();

router.post('/login', authLimiter as any, authController.login);
// Criação de usuários é uma ação administrativa: exige autenticação + papel
// de diretor (admin passa pelo bypass em authorizeRoles). NUNCA público.
router.post(
  '/register',
  authenticateToken as any,
  authorizeRoles(['director']) as any,
  userController.createUserWithAuth,
);
router.post('/logout', authController.logout);
router.get('/profile', authenticateToken as any, authController.getProfile);
router.post('/complete-first-login', authenticateToken as any, authController.completeFirstLogin);

export default router;
