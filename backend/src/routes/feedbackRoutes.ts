import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Tipos (leitura para todos; gestão só admin/diretoria)
router.get('/types', feedbackController.listTypes);
router.post('/types', authorizeRoles(['admin', 'director']) as any, feedbackController.createType);
router.put(
  '/types/:id',
  authorizeRoles(['admin', 'director']) as any,
  feedbackController.updateType,
);

// Solicitações
router.get('/requests', feedbackController.listRequests);
router.post('/requests', feedbackController.createRequest);
router.patch('/requests/:id/decline', feedbackController.declineRequest);

// Visão administrativa
router.get('/admin', authorizeRoles(['admin', 'director']) as any, feedbackController.adminList);

// Feedbacks
router.get('/summary', feedbackController.summary);
router.get('/', feedbackController.list);
router.post('/', feedbackController.create);
router.patch('/:id/read', feedbackController.markRead);
router.patch('/:id/acknowledge', feedbackController.acknowledge);
router.delete('/:id', feedbackController.remove);

export default router;
