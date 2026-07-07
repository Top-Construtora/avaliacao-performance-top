import { Router } from 'express';
import { userController } from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticateToken as any);

// Gestão de usuários (criar/editar/excluir/redefinir senha) é privilégio de
// diretor — admin passa pelo bypass de authorizeRoles. Leituras permanecem
// disponíveis a qualquer autenticado (usadas em selects/dropdowns por toda a
// aplicação; o mascaramento de cargo sigiloso já é aplicado no service).
const requireManager = authorizeRoles(['director']) as any;

// Leituras (autenticado)
router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.get('/leader/:leaderId/subordinates', userController.getSubordinates);
router.get('/check-email/:email', userController.checkEmailExists);

// Mutações (apenas diretor/admin)
router.post('/', requireManager, userController.createUser);
router.put('/:id', requireManager, userController.updateUser);
router.delete('/:id', requireManager, userController.deleteUser);
router.post('/:id/reset-password', requireManager, userController.resetUserPassword);
router.post('/:id/teams', requireManager, userController.addUserToTeams);
router.put('/:id/teams', requireManager, userController.setUserTeams);

// Rota de migração para corrigir current_track_position_id
router.post('/migrate/fix-track-positions', requireManager, userController.migrateTrackPositions);

export default router;
