import { Router } from 'express';
import { pdiController } from '../controllers/pdiController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Visões agregadas (todos os PDIs / por ciclo) são de gestão: diretor/líder.
const requireManager = authorizeRoles(['director', 'leader']) as any;

// Rotas do PDI
router.post('/', pdiController.savePDI); // ownership validado no controller
router.get('/all', requireManager, pdiController.getAllPDIs);
router.get('/cycle/:cycleId', requireManager, pdiController.getPDIsByCycle);
router.get('/:employeeId', pdiController.getPDI); // ownership validado no controller

export default router;
