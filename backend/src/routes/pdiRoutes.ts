import { Router } from 'express';
import { pdiController } from '../controllers/pdiController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Rotas do PDI
router.post('/', pdiController.savePDI);
router.get('/all', pdiController.getAllPDIs);
router.get('/cycle/:cycleId', pdiController.getPDIsByCycle);
router.get('/:employeeId', pdiController.getPDI);

export default router;