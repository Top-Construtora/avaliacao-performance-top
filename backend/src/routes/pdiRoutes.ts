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

// Ações normalizadas (fase 5C)
router.get('/actions/mine', pdiController.getMyActions);
router.get('/:planId/actions', pdiController.getPlanActions); // ownership validado no controller
router.patch('/:planId/actions/:actionId', pdiController.updateAction);

// Evidências e anexos: quem escreve/anexa é validado no controller — o dono do
// plano relata o que fez, e por isso estas rotas não passam por requireManager.
router.patch('/:planId/actions/:actionId/evidencias', pdiController.updateEvidencias);
router.post('/:planId/actions/:actionId/attachments', pdiController.addAttachment);
router.get('/attachments/:attachmentId/url', pdiController.getAttachmentUrl);
router.delete('/attachments/:attachmentId', pdiController.removeAttachment);

router.get('/:employeeId', pdiController.getPDI); // ownership validado no controller

export default router;
