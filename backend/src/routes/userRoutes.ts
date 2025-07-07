import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticateToken as any);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.get('/leader/:leaderId/subordinates', userController.getSubordinates);

export default router;