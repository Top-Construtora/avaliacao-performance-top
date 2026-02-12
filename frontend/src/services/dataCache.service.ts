// src/services/dataCache.service.ts
// Cache centralizado para evitar chamadas duplicadas às APIs

import { departmentService } from './department.service';
import { userService } from './user.service';
import { teamService } from './team.service';
import type { Department, User, Team } from '../types/supabase';

interface CacheData {
  users: User[] | null;
  teams: Team[] | null;
  departments: Department[] | null;
  teamMembers: { team_id: string; user: any }[] | null;
  timestamp: number;
}

// Cache com TTL de 30 segundos
const CACHE_TTL = 30000;

let cache: CacheData = {
  users: null,
  teams: null,
  departments: null,
  teamMembers: null,
  timestamp: 0,
};

// Promessa em andamento para evitar chamadas duplicadas simultâneas
let loadingPromise: Promise<CacheData> | null = null;

function isCacheValid(): boolean {
  return Date.now() - cache.timestamp < CACHE_TTL &&
         cache.users !== null &&
         cache.teams !== null &&
         cache.departments !== null &&
         cache.teamMembers !== null;
}

async function loadAllData(): Promise<CacheData> {
  // Se cache ainda é válido, retorna imediatamente
  if (isCacheValid()) {
    return cache;
  }

  // Se já está carregando, aguarda a promessa existente
  if (loadingPromise) {
    return loadingPromise;
  }

  // Criar nova promessa de carregamento
  loadingPromise = (async () => {
    try {
      console.log('🔄 Cache: Carregando todos os dados...');

      const [users, teams, departments, teamMembers] = await Promise.all([
        userService.getUsers(),
        teamService.getAll(),
        departmentService.getAll(),
        teamService.getAllMembers(),
      ]);

      cache = {
        users: users || [],
        teams: teams || [],
        departments: departments || [],
        teamMembers: teamMembers || [],
        timestamp: Date.now(),
      };

      console.log('✅ Cache: Dados carregados com sucesso');
      return cache;
    } catch (error) {
      console.error('❌ Cache: Erro ao carregar dados:', error);
      throw error;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

export const dataCacheService = {
  // Carregar todos os dados (com cache)
  async loadAll(): Promise<void> {
    await loadAllData();
  },

  // Obter usuários do cache
  async getUsers(): Promise<User[]> {
    const data = await loadAllData();
    return data.users || [];
  },

  // Obter times do cache
  async getTeams(): Promise<Team[]> {
    const data = await loadAllData();
    return data.teams || [];
  },

  // Obter departamentos do cache
  async getDepartments(): Promise<Department[]> {
    const data = await loadAllData();
    return data.departments || [];
  },

  // Obter membros de times do cache
  async getTeamMembers(): Promise<{ team_id: string; user: any }[]> {
    const data = await loadAllData();
    return data.teamMembers || [];
  },

  // Obter todos os dados de uma vez (mais eficiente)
  async getAll(): Promise<{
    users: User[];
    teams: Team[];
    departments: Department[];
    teamMembers: { team_id: string; user: any }[];
  }> {
    const data = await loadAllData();
    return {
      users: data.users || [],
      teams: data.teams || [],
      departments: data.departments || [],
      teamMembers: data.teamMembers || [],
    };
  },

  // Invalidar cache (após criar/atualizar/deletar)
  invalidate(): void {
    console.log('🗑️ Cache: Invalidado');
    cache = {
      users: null,
      teams: null,
      departments: null,
      teamMembers: null,
      timestamp: 0,
    };
    loadingPromise = null;
  },

  // Forçar recarga
  async reload(): Promise<void> {
    this.invalidate();
    await loadAllData();
  },

  // Verificar se cache é válido
  isValid(): boolean {
    return isCacheValid();
  },
};
