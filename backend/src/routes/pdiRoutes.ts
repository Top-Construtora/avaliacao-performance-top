import { Router } from 'express';
import { pdiController } from '../controllers/pdiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Rotas do PDI
router.post('/', pdiController.savePDI);
router.get('/:employeeId', pdiController.getPDI);
router.get('/cycle/:cycleId', pdiController.getPDIsByCycle);

export default router;