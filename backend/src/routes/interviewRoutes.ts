import { Router } from 'express';
import { interviewController } from '../controllers/interviewController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Listar entrevistas - diretores e líderes
router.get('/', authorizeRoles(['director', 'leader']) as any, interviewController.getInterviews as any);

// Estatísticas - diretores
router.get('/stats', authorizeRoles(['director']) as any, interviewController.getInterviewStats as any);

// Buscar entrevista por ID - diretores e líderes
router.get('/:id', authorizeRoles(['director', 'leader']) as any, interviewController.getInterviewById as any);

// Criar entrevista - diretores e líderes
router.post('/', authorizeRoles(['director', 'leader']) as any, interviewController.createInterview as any);

// Atualizar entrevista - diretores e líderes
router.put('/:id', authorizeRoles(['director', 'leader']) as any, interviewController.updateInterview as any);

// Salvar respostas de 90 dias
router.post('/:id/ninety-days-answers', authorizeRoles(['director', 'leader']) as any, interviewController.saveNinetyDaysAnswers as any);

// Salvar respostas de desligamento
router.post('/:id/exit-answers', authorizeRoles(['director', 'leader']) as any, interviewController.saveExitAnswers as any);

// Deletar entrevista - apenas diretores
router.delete('/:id', authorizeRoles(['director']) as any, interviewController.deleteInterview as any);

export default router;
