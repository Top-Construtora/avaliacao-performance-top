import { Router } from 'express';
import { competencyController } from '../controllers/competencyController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Listar competências organizacionais - todos podem ver
router.get('/organizational', competencyController.getOrganizationalCompetencies as any);

// Buscar competência por ID - todos podem ver
router.get('/organizational/:id', competencyController.getOrganizationalCompetencyById as any);

// Criar competência - apenas diretores
router.post('/organizational', authorizeRoles(['director']) as any, competencyController.createOrganizationalCompetency as any);

// Atualizar competência - apenas diretores
router.put('/organizational/:id', authorizeRoles(['director']) as any, competencyController.updateOrganizationalCompetency as any);

// Deletar competência - apenas diretores
router.delete('/organizational/:id', authorizeRoles(['director']) as any, competencyController.deleteOrganizationalCompetency as any);

export default router;
