import { Router } from 'express';
import { auditController } from '../controllers/auditController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Trilha de auditoria: somente admin e diretoria
router.get('/', authorizeRoles(['admin', 'director']) as any, auditController.list);

export default router;
