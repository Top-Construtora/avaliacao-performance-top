import { api } from '../config/api';

// Tipos do sistema de salários
export interface SalaryClass {
  id: string;
  code: string;
  name: string;
  description?: string;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JobPosition {
  id: string;
  name: string;
  code?: string;
  description?: string;
  is_multifunctional: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalaryLevel {
  id: string;
  name: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CareerTrack {
  id: string;
  department_id?: string;
  name: string;
  code?: string;
  description?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  department?: {
    id: string;
    name: string;
  };
}

export interface TrackPosition {
  id: string;
  track_id: string;
  position_id: string;
  class_id: string;
  base_salary: number;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  custom_level_percentages?: Record<string, number>;
  track?: CareerTrack;
  position?: JobPosition;
  class?: SalaryClass;
}

export interface ProgressionRule {
  id: string;
  from_position_id: string;
  to_position_id: string;
  progression_type: 'horizontal' | 'vertical' | 'merit';
  min_time_months?: number;
  performance_requirement?: number;
  additional_requirements?: Record<string, any>;
  active: boolean;
  created_at: string;
  updated_at: string;
  from_position?: TrackPosition;
  to_position?: TrackPosition;
}

export interface ProgressionHistory {
  id: string;
  user_id: string;
  from_track_position_id?: string;
  to_track_position_id: string;
  from_salary_level_id?: string;
  to_salary_level_id: string;
  from_salary?: number;
  to_salary: number;
  progression_type: 'horizontal' | 'vertical' | 'merit';
  progression_date: string;
  reason?: string;
  approved_by?: string;
  created_at: string;
  from_position?: any;
  to_position?: any;
  from_level?: any;
  to_level?: any;
  approver?: any;
}

export interface UserSalaryInfo {
  id: string;
  name: string;
  email: string;
  contract_type: 'CLT' | 'PJ';
  base_salary?: number;
  level_percentage?: number;
  calculated_salary?: number;
  current_salary?: number;
  department_name?: string;
  position_name?: string;
  class_code?: string;
  salary_level?: string;
  track_name?: string;
  track_position_id?: string;
}

class SalaryService {
  // Método auxiliar para processar respostas da API
  private processResponse<T>(response: any): T {
    // Se a resposta tem data.data
    if (response?.data?.data !== undefined) {
      return response.data.data;
    }
    // Se a resposta tem apenas data
    if (response?.data !== undefined) {
      return response.data;
    }
    // Se a resposta é direta
    return response;
  }

  // Método auxiliar para tratamento de erros
  private async handleRequest<T>(request: Promise<any>): Promise<T> {
    try {
      const response = await request;
      return this.processResponse<T>(response);
    } catch (error: any) {
      console.error('Erro na requisição:', error);
      
      // Se for erro de autenticação
      if (error.response?.status === 401) {
        // Redirecionar para login ou renovar token
        window.location.href = '/login';
      }
      
      throw error;
    }
  }

  // ===== CLASSES SALARIAIS =====
  async getClasses(): Promise<SalaryClass[]> {
    return this.handleRequest<SalaryClass[]>(api.get('/salary/classes'));
  }

  async getClassById(id: string): Promise<SalaryClass> {
    return this.handleRequest<SalaryClass>(api.get(`/salary/classes/${id}`));
  }

  async createClass(data: Partial<SalaryClass>): Promise<SalaryClass> {
    return this.handleRequest<SalaryClass>(api.post('/salary/classes', data));
  }

  async updateClass(id: string, data: Partial<SalaryClass>): Promise<SalaryClass> {
    return this.handleRequest<SalaryClass>(api.put(`/salary/classes/${id}`, data));
  }

  async deleteClass(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/classes/${id}`));
  }

  // ===== CARGOS =====
  async getPositions(): Promise<JobPosition[]> {
    return this.handleRequest<JobPosition[]>(api.get('/salary/positions'));
  }

  async getPositionById(id: string): Promise<JobPosition> {
    return this.handleRequest<JobPosition>(api.get(`/salary/positions/${id}`));
  }

  async createPosition(data: Partial<JobPosition>): Promise<JobPosition> {
    return this.handleRequest<JobPosition>(api.post('/salary/positions', data));
  }

  async updatePosition(id: string, data: Partial<JobPosition>): Promise<JobPosition> {
    return this.handleRequest<JobPosition>(api.put(`/salary/positions/${id}`, data));
  }

  async deletePosition(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/positions/${id}`));
  }

  // ===== INTERNÍVEIS =====
  async getLevels(): Promise<SalaryLevel[]> {
    return this.handleRequest<SalaryLevel[]>(api.get('/salary/levels'));
  }

  async getLevelById(id: string): Promise<SalaryLevel> {
    return this.handleRequest<SalaryLevel>(api.get(`/salary/levels/${id}`));
  }

  async createLevel(data: Partial<SalaryLevel>): Promise<SalaryLevel> {
    return this.handleRequest<SalaryLevel>(api.post('/salary/levels', data));
  }

  async updateLevel(id: string, data: Partial<SalaryLevel>): Promise<SalaryLevel> {
    return this.handleRequest<SalaryLevel>(api.put(`/salary/levels/${id}`, data));
  }

  async deleteLevel(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/levels/${id}`));
  }

  // ===== TRILHAS DE CARREIRA =====
  async getTracks(): Promise<CareerTrack[]> {
    try {
      return await this.handleRequest<CareerTrack[]>(api.get('/salary/tracks'));
    } catch (error: any) {
      // Se for 404 ou 500, retornar array vazio
      if (error.response?.status === 404 || error.response?.status === 500) {
        console.warn('Sistema de trilhas pode não estar configurado ainda');
        return [];
      }
      throw error;
    }
  }

  async getTrackById(id: string): Promise<CareerTrack> {
    return this.handleRequest<CareerTrack>(api.get(`/salary/tracks/${id}`));
  }

  async getTracksByDepartment(departmentId: string): Promise<CareerTrack[]> {
    return this.handleRequest<CareerTrack[]>(api.get(`/salary/tracks/department/${departmentId}`));
  }

  async createTrack(data: Partial<CareerTrack>): Promise<CareerTrack> {
    console.log('SalaryService.createTrack - Enviando dados:', data);
    
    try {
      const response = await api.post('/salary/tracks', data);
      console.log('SalaryService.createTrack - Resposta recebida:', response);
      
      return this.processResponse<CareerTrack>(response);
    } catch (error: any) {
      console.error('SalaryService.createTrack - Erro:', error);
      
      // Adicionar mais informações ao erro
      if (error.response) {
        console.error('Detalhes do erro:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      throw error;
    }
  }

  async updateTrack(id: string, data: Partial<CareerTrack>): Promise<CareerTrack> {
    return this.handleRequest<CareerTrack>(api.put(`/salary/tracks/${id}`, data));
  }

  async deleteTrack(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/tracks/${id}`));
  }

  // ===== POSIÇÕES NAS TRILHAS =====
  async getTrackPositions(): Promise<TrackPosition[]> {
    return this.handleRequest<TrackPosition[]>(api.get('/salary/track-positions'));
  }

  async getTrackPositionById(id: string): Promise<TrackPosition> {
    return this.handleRequest<TrackPosition>(api.get(`/salary/track-positions/${id}`));
  }

  async getPositionsByTrack(trackId: string): Promise<TrackPosition[]> {
    return this.handleRequest<TrackPosition[]>(api.get(`/salary/track-positions/track/${trackId}`));
  }

  async createTrackPosition(data: Partial<TrackPosition>): Promise<TrackPosition> {
    return this.handleRequest<TrackPosition>(api.post('/salary/track-positions', data));
  }

  async updateTrackPosition(id: string, data: Partial<TrackPosition>): Promise<TrackPosition> {
    return this.handleRequest<TrackPosition>(api.put(`/salary/track-positions/${id}`, data));
  }

  async deleteTrackPosition(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/track-positions/${id}`));
  }

  // ===== REGRAS DE PROGRESSÃO =====
  async getProgressionRules(): Promise<ProgressionRule[]> {
    return this.handleRequest<ProgressionRule[]>(api.get('/salary/progression-rules'));
  }

  async getProgressionRuleById(id: string): Promise<ProgressionRule> {
    return this.handleRequest<ProgressionRule>(api.get(`/salary/progression-rules/${id}`));
  }

  async getRulesByFromPosition(positionId: string): Promise<ProgressionRule[]> {
    return this.handleRequest<ProgressionRule[]>(api.get(`/salary/progression-rules/from/${positionId}`));
  }

  async createProgressionRule(data: Partial<ProgressionRule>): Promise<ProgressionRule> {
    return this.handleRequest<ProgressionRule>(api.post('/salary/progression-rules', data));
  }

  async updateProgressionRule(id: string, data: Partial<ProgressionRule>): Promise<ProgressionRule> {
    return this.handleRequest<ProgressionRule>(api.put(`/salary/progression-rules/${id}`, data));
  }

  async deleteProgressionRule(id: string): Promise<void> {
    return this.handleRequest<void>(api.delete(`/salary/progression-rules/${id}`));
  }

  // ===== ATRIBUIÇÃO E PROGRESSÃO =====
  async assignUserToTrack(
    userId: string, 
    trackPositionId: string, 
    salaryLevelId: string
  ): Promise<any> {
    return this.handleRequest<any>(
      api.put(`/salary/users/${userId}/assign-track`, {
        track_position_id: trackPositionId,
        salary_level_id: salaryLevelId
      })
    );
  }

  async updateUserSalaryLevel(userId: string, salaryLevelId: string): Promise<any> {
    return this.handleRequest<any>(
      api.put(`/salary/users/${userId}/update-level`, {
        salary_level_id: salaryLevelId
      })
    );
  }

  async getUserSalaryInfo(userId: string): Promise<UserSalaryInfo> {
    return this.handleRequest<UserSalaryInfo>(api.get(`/salary/users/${userId}/salary-info`));
  }

  async getUserPossibleProgressions(userId: string): Promise<any[]> {
    return this.handleRequest<any[]>(api.get(`/salary/users/${userId}/possible-progressions`));
  }

  async progressUser(userId: string, data: {
    toTrackPositionId: string;
    toSalaryLevelId: string;
    progressionType: 'horizontal' | 'vertical' | 'merit';
    reason?: string;
  }): Promise<ProgressionHistory> {
    return this.handleRequest<ProgressionHistory>(
      api.post(`/salary/users/${userId}/progress`, {
        to_track_position_id: data.toTrackPositionId,
        to_salary_level_id: data.toSalaryLevelId,
        progression_type: data.progressionType,
        reason: data.reason
      })
    );
  }

  async getUserProgressionHistory(userId: string): Promise<ProgressionHistory[]> {
    return this.handleRequest<ProgressionHistory[]>(api.get(`/salary/users/${userId}/progression-history`));
  }

  // ===== RELATÓRIOS =====
  async getSalaryOverview(): Promise<any> {
    return this.handleRequest<any>(api.get('/salary/reports/overview'));
  }

  async getSalaryByDepartment(): Promise<any> {
    return this.handleRequest<any>(api.get('/salary/reports/by-department'));
  }

  async getSalaryByPosition(): Promise<any> {
    return this.handleRequest<any>(api.get('/salary/reports/by-position'));
  }

  // ===== CÁLCULO =====
  async calculateSalary(trackPositionId: string, salaryLevelId: string): Promise<{
    baseSalary: number;
    levelPercentage: number;
    calculatedSalary: number;
  }> {
    return this.handleRequest<{
      baseSalary: number;
      levelPercentage: number;
      calculatedSalary: number;
    }>(
      api.post('/salary/calculate', {
        track_position_id: trackPositionId,
        salary_level_id: salaryLevelId
      })
    );
  }

  // ===== EXPORTAÇÃO =====
  async exportTrackToPDF(trackId: string): Promise<void> {
    try {
      // Usar o método downloadFile para obter o blob diretamente
      const blob = await api.downloadFile(`/salary/tracks/${trackId}/export/pdf`);

      // Criar um URL temporário para o blob
      const url = window.URL.createObjectURL(blob);

      // Criar um link temporário e fazer o download
      const link = document.createElement('a');
      link.href = url;
      link.download = `trilha_${trackId}_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      throw error;
    }
  }

  async exportTrackToExcel(trackId: string): Promise<void> {
    try {
      // Usar o método downloadFile para obter o blob diretamente
      const blob = await api.downloadFile(`/salary/tracks/${trackId}/export/excel`);

      // Criar um URL temporário para o blob
      const url = window.URL.createObjectURL(blob);

      // Criar um link temporário e fazer o download
      const link = document.createElement('a');
      link.href = url;
      link.download = `trilha_${trackId}_${Date.now()}.xlsx`;
      document.body.appendChild(link);
      link.click();

      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      throw error;
    }
  }

  // ===== MÉTODOS AUXILIARES =====

  // Verificar se o sistema de salários está configurado
  async checkSystemStatus(): Promise<{
    configured: boolean;
    hasClasses: boolean;
    hasPositions: boolean;
    hasLevels: boolean;
    hasTracks: boolean;
  }> {
    try {
      const [classes, positions, levels, tracks] = await Promise.all([
        this.getClasses().catch(() => []),
        this.getPositions().catch(() => []),
        this.getLevels().catch(() => []),
        this.getTracks().catch(() => [])
      ]);

      return {
        configured: classes.length > 0 || positions.length > 0 || levels.length > 0 || tracks.length > 0,
        hasClasses: classes.length > 0,
        hasPositions: positions.length > 0,
        hasLevels: levels.length > 0,
        hasTracks: tracks.length > 0
      };
    } catch (error) {
      console.error('Erro ao verificar status do sistema:', error);
      return {
        configured: false,
        hasClasses: false,
        hasPositions: false,
        hasLevels: false,
        hasTracks: false
      };
    }
  }
}

export const salaryService = new SalaryService();