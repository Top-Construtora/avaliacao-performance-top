import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import {
  departmentsService,
  usersService,
  teamsService,
  supabaseHelpers,
} from '../services/supabase.service';
import type {
  Department,
  User,
  Team,
  DepartmentWithDetails,
  UserWithDetails,
  TeamWithDetails,
} from '../types/supabase';

// Feature flag para usar Supabase ou mock data
const USE_SUPABASE = import.meta.env.VITE_USE_SUPABASE_DATA === 'true';

// ====================================
// HOOK PARA DEPARTMENTS
// ====================================
export function useSupabaseDepartments() {
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar departamentos
  const loadDepartments = useCallback(async () => {
    if (!USE_SUPABASE) return;
    
    try {
      setLoading(true);
      const data = await departmentsService.getAll();
      setDepartments(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast('Erro ao carregar departamentos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar departamento
  const createDepartment = useCallback(async (department: Omit<Department, 'id' | 'created_at' | 'updated_at'>) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - departamento não será salvo');
      return;
    }

    try {
      const newDept = await departmentsService.create(department);
      await loadDepartments(); // Recarregar lista
      toast.success('Departamento criado com sucesso!');
      return newDept;
    } catch (err) {
      toast.error('Erro ao criar departamento');
      throw err;
    }
  }, [loadDepartments]);

  // Atualizar departamento
  const updateDepartment = useCallback(async (id: string, updates: Partial<Department>) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - alterações não serão salvas');
      return;
    }

    try {
      const updated = await departmentsService.update(id, updates);
      await loadDepartments(); // Recarregar lista
      toast.success('Departamento atualizado com sucesso!');
      return updated;
    } catch (err) {
      toast.error('Erro ao atualizar departamento');
      throw err;
    }
  }, [loadDepartments]);

  // Deletar departamento
  const deleteDepartment = useCallback(async (id: string) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - departamento não será removido');
      return;
    }

    try {
      await departmentsService.delete(id);
      await loadDepartments(); // Recarregar lista
      toast.success('Departamento removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover departamento');
      throw err;
    }
  }, [loadDepartments]);

  // Carregar ao montar
  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  return {
    departments,
    loading,
    error,
    reload: loadDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}

// ====================================
// HOOK PARA USERS
// ====================================
export function useSupabaseUsers() {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar usuários
  const loadUsers = useCallback(async () => {
    if (!USE_SUPABASE) return;
    
    try {
      setLoading(true);
      const data = await usersService.getAll();
      setUsers(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  // Atualizar usuário
  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - alterações não serão salvas');
      return;
    }

    try {
      const updated = await usersService.update(id, updates);
      await loadUsers(); // Recarregar lista
      toast.success('Usuário atualizado com sucesso!');
      return updated;
    } catch (err) {
      toast.error('Erro ao atualizar usuário');
      throw err;
    }
  }, [loadUsers]);

  // Desativar usuário
  const deactivateUser = useCallback(async (id: string) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - usuário não será desativado');
      return;
    }

    try {
      await usersService.deactivate(id);
      await loadUsers(); // Recarregar lista
      toast.success('Usuário desativado com sucesso!');
    } catch (err) {
      toast.error('Erro ao desativar usuário');
      throw err;
    }
  }, [loadUsers]);

  // Ativar usuário
  const activateUser = useCallback(async (id: string) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - usuário não será ativado');
      return;
    }

    try {
      await usersService.activate(id);
      await loadUsers(); // Recarregar lista
      toast.success('Usuário ativado com sucesso!');
    } catch (err) {
      toast.error('Erro ao ativar usuário');
      throw err;
    }
  }, [loadUsers]);

  // Carregar ao montar
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    reload: loadUsers,
    updateUser,
    deactivateUser,
    activateUser,
  };
}

// ====================================
// HOOK PARA TEAMS
// ====================================
export function useSupabaseTeams() {
  const [teams, setTeams] = useState<TeamWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar times
  const loadTeams = useCallback(async () => {
    if (!USE_SUPABASE) return;
    
    try {
      setLoading(true);
      const data = await teamsService.getAll();
      setTeams(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      toast('Erro ao carregar times');
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar time
  const createTeam = useCallback(async (team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - time não será salvo');
      return;
    }

    try {
      const newTeam = await teamsService.create(team);
      await loadTeams(); // Recarregar lista
      toast.success('Time criado com sucesso!');
      return newTeam;
    } catch (err) {
      toast.error('Erro ao criar time');
      throw err;
    }
  }, [loadTeams]);

  // Atualizar time
  const updateTeam = useCallback(async (id: string, updates: Partial<Team>) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - alterações não serão salvas');
      return;
    }

    try {
      const updated = await teamsService.update(id, updates);
      await loadTeams(); // Recarregar lista
      toast.success('Time atualizado com sucesso!');
      return updated;
    } catch (err) {
      toast.error('Erro ao atualizar time');
      throw err;
    }
  }, [loadTeams]);

  // Deletar time
  const deleteTeam = useCallback(async (id: string) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - time não será removido');
      return;
    }

    try {
      await teamsService.delete(id);
      await loadTeams(); // Recarregar lista
      toast.success('Time removido com sucesso!');
    } catch (err) {
      toast.error('Erro ao remover time');
      throw err;
    }
  }, [loadTeams]);

  // Gerenciar membros
  const updateTeamMembers = useCallback(async (teamId: string, userIds: string[]) => {
    if (!USE_SUPABASE) {
      toast('Usando mock data - membros não serão atualizados');
      return;
    }

    try {
      await teamsService.replaceMembers(teamId, userIds);
      await loadTeams(); // Recarregar lista
      toast.success('Membros do time atualizados!');
    } catch (err) {
      toast.error('Erro ao atualizar membros do time');
      throw err;
    }
  }, [loadTeams]);

  // Carregar ao montar
  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  return {
    teams,
    loading,
    error,
    reload: loadTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    updateTeamMembers,
  };
}

// ====================================
// HOOK COMBINADO PARA FACILITAR USO
// ====================================
export function useSupabaseData() {
  const departments = useSupabaseDepartments();
  const users = useSupabaseUsers();
  const teams = useSupabaseTeams();

  const loading = departments.loading || users.loading || teams.loading;
  const error = departments.error || users.error || teams.error;

  return {
    departments: departments.departments,
    users: users.users,
    teams: teams.teams,
    loading,
    error,
    actions: {
      departments: {
        create: departments.createDepartment,
        update: departments.updateDepartment,
        delete: departments.deleteDepartment,
        reload: departments.reload,
      },
      users: {
        update: users.updateUser,
        deactivate: users.deactivateUser,
        activate: users.activateUser,
        reload: users.reload,
      },
      teams: {
        create: teams.createTeam,
        update: teams.updateTeam,
        delete: teams.deleteTeam,
        updateMembers: teams.updateTeamMembers,
        reload: teams.reload,
      },
    },
    helpers: supabaseHelpers,
  };
}

// ====================================
// HOOK PARA MIGRAÇÃO PROGRESSIVA
// ====================================
export function useMigrationMode() {
  return {
    isSupabaseEnabled: USE_SUPABASE,
    mode: USE_SUPABASE ? 'supabase' : 'mock',
  };
}