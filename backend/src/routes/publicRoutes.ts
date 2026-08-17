import { Router } from 'express';
import { satisfactionController } from '../controllers/satisfactionController';
import { interviewController } from '../controllers/interviewController';
import { careersController } from '../controllers/careersController';
import { publicSubmitLimiter } from '../middleware/rateLimit';

// Rotas PÚBLICAS (sem autenticação) — links abertos de pesquisa e entrevista.
const router = Router();

router.get('/satisfaction/:id', satisfactionController.getPublicSurvey as any);
router.post(
  '/satisfaction/:id/respond',
  publicSubmitLimiter as any,
  satisfactionController.submitPublicResponse as any,
);

// Entrevista via token único (não-adivinhável) da entrevista específica
router.get('/interviews/:token', interviewController.getPublicInterview as any);
router.post(
  '/interviews/:token/respond',
  publicSubmitLimiter as any,
  interviewController.submitPublicInterview as any,
);

// Portal de vagas: lista aberta e candidatura com o mini currículo do próprio
// candidato. O envio passa pelo limitador, como as demais rotas abertas.
router.get('/openings', careersController.listOpenings as any);
router.get('/openings/:id', careersController.getOpening as any);
router.post('/openings/:id/apply', publicSubmitLimiter as any, careersController.apply as any);

export default router;
