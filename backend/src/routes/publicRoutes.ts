import { Router } from 'express';
import { satisfactionController } from '../controllers/satisfactionController';
import { publicSubmitLimiter } from '../middleware/rateLimit';

// Rotas PÚBLICAS (sem autenticação) — link aberto para responder pesquisa.
const router = Router();

router.get('/satisfaction/:id', satisfactionController.getPublicSurvey as any);
router.post(
  '/satisfaction/:id/respond',
  publicSubmitLimiter as any,
  satisfactionController.submitPublicResponse as any,
);

export default router;
