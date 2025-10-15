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

// ====================================
// HOOK PARA DEPARTMENTS
// ====================================
export function useSupabaseDepartments() {
  const [departments, setDepartments] = useState<DepartmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Carregar departamentos
  const loadDepartments = useCallback(async () => {
    
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
    try {
      const updated = await usersService.update(id, updates);
      await loadUsers(); // Recarregar lista
      return updated;
    } catch (err) {
      throw err;
    }
  }, [loadUsers]);

  // Desativar usuário
  const deactivateUser = useCallback(async (id: string) => {
    try {
      await usersService.deactivate(id);
      await loadUsers(); // Recarregar lista
    } catch (err) {
      throw err;
    }
  }, [loadUsers]);

  // Ativar usuário
  const activateUser = useCallback(async (id: string) => {
    try {
      await usersService.activate(id);
      await loadUsers(); // Recarregar lista
    } catch (err) {
      throw err;
    }
  }, [loadUsers]);

  // Deletar usuário
  const deleteUser = useCallback(async (id: string) => {
    try {
      await usersService.delete(id);
      await loadUsers(); // Recarregar lista
      // Toast removido - será exibido no componente que chama esta função
    } catch (err) {
      // Não exibir toast aqui para evitar duplicação
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
    deleteUser,
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
        delete: users.deleteUser,
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