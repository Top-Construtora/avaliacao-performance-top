import { Router } from 'express';
import { teamController } from '../controllers/teamController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken as any);

// Listar times - todos podem ver
router.get('/', teamController.getTeams as any);

// Buscar todos os membros de todos os times (batch) - todos podem ver
router.get('/members/all', teamController.getAllTeamMembers as any);

// Buscar time por ID - todos podem ver
router.get('/:id', teamController.getTeamById as any);

// Buscar membros de um time - todos podem ver
router.get('/:id/members', teamController.getTeamMembers as any);

// Criar time - apenas diretores e líderes
router.post('/', authorizeRoles(['director', 'leader']) as any, teamController.createTeam as any);

// Atualizar time - apenas diretores e líderes
router.put('/:id', authorizeRoles(['director', 'leader']) as any, teamController.updateTeam as any);

// Deletar time - apenas diretores
router.delete('/:id', authorizeRoles(['director']) as any, teamController.deleteTeam as any);

// Adicionar membro ao time - apenas diretores e líderes
router.post('/:id/members', authorizeRoles(['director', 'leader']) as any, teamController.addTeamMember as any);

// Remover membro do time - apenas diretores e líderes
router.delete('/:id/members/:userId', authorizeRoles(['director', 'leader']) as any, teamController.removeTeamMember as any);

// Substituir todos os membros do time - apenas diretores e líderes
router.put('/:id/members', authorizeRoles(['director', 'leader']) as any, teamController.replaceTeamMembers as any);

// Buscar times de um usuário - todos podem ver
router.get('/user/:userId', teamController.getUserTeams as any);

export default router;
