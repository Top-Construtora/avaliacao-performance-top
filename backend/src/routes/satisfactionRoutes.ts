import { Router } from 'express';
import { satisfactionController } from '../controllers/satisfactionController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

// Listar pesquisas - todos autenticados
router.get('/', satisfactionController.getSurveys as any);

// Buscar pesquisa por ID - todos autenticados
router.get('/:id', satisfactionController.getSurveyById as any);

// Resultados - apenas diretores
router.get('/:id/results', authorizeRoles(['director']) as any, satisfactionController.getSurveyResults as any);

// Verificar se já respondeu - todos autenticados
router.get('/:id/check', satisfactionController.checkUserResponse as any);

// Criar pesquisa - apenas diretores
router.post('/', authorizeRoles(['director']) as any, satisfactionController.createSurvey as any);

// Atualizar pesquisa - apenas diretores
router.put('/:id', authorizeRoles(['director']) as any, satisfactionController.updateSurvey as any);

// Responder pesquisa - todos autenticados
router.post('/:id/respond', satisfactionController.submitResponse as any);

// Deletar pesquisa - apenas diretores
router.delete('/:id', authorizeRoles(['director']) as any, satisfactionController.deleteSurvey as any);

export default router;
