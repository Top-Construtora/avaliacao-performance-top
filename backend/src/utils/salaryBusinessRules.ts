import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ProgressionRequirements {
  minTimeMonths?: number;
  performanceScore?: number;
  certifications?: string[];
  projects?: number;
}

export class SalaryBusinessRules {
  constructor(private supabase: SupabaseClient<Database>) {}

  // Validar atribuição de cargo a usuário
  async validateTrackAssignment(
    userId: string,
    trackPositionId: string,
    salaryLevelId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Buscar dados necessários
      const [userResult, positionResult, levelResult] = await Promise.all([
        this.supabase.from('users').select('*').eq('id', userId).single(),
        this.supabase.from('track_positions').select('*, track:career_tracks(*), position:job_positions(*), class:salary_classes(*)').eq('id', trackPositionId).single(),
        this.supabase.from('salary_levels').select('*').eq('id', salaryLevelId).single()
      ]);

      if (userResult.error) errors.push('Usuário não encontrado');
      if (positionResult.error) errors.push('Posição na trilha não encontrada');
      if (levelResult.error) errors.push('Nível salarial não encontrado');

      if (errors.length > 0) {
        return { isValid: false, errors, warnings };
      }

      const user = userResult.data;
      const position = positionResult.data;
      const level = levelResult.data;

      // Regra 1: Verificar se o usuário está ativo
      if (!user.active) {
        errors.push('Usuário inativo não pode ser atribuído a cargos');
      }

      // Regra 2: Verificar se a trilha está ativa
      if (!position.track?.active) {
        errors.push('Trilha de carreira inativa');
      }

      // Regra 3: Verificar compatibilidade de departamento
      if (position.track?.department_id) {
        const userDept = await this.getUserDepartment(userId);
        if (userDept && userDept !== position.track.department_id) {
          warnings.push('Usuário sendo atribuído a trilha de outro departamento');
        }
      }

      // Regra 4: Validar mudança de salário
      if (user.current_salary) {
        const newSalary = this.calculateSalary(position.base_salary, level.percentage);
        const percentChange = ((newSalary - user.current_salary) / user.current_salary) * 100;
        
        if (percentChange > 50) {
          warnings.push(`Aumento salarial de ${percentChange.toFixed(1)}% - requer aprovação especial`);
        }
        
        if (percentChange < -20) {
          errors.push(`Redução salarial de ${Math.abs(percentChange).toFixed(1)}% não permitida`);
        }
      }

      // Regra 5: Verificar requisitos do cargo
      if (position.position?.is_multifunctional && !this.hasMultifunctionalSkills(user)) {
        warnings.push('Cargo requer habilidades multifuncionais');
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erro ao validar atribuição'],
        warnings: []
      };
    }
  }

  // Validar progressão de carreira
  async validateProgression(
    userId: string,
    fromPositionId: string,
    toPositionId: string,
    progressionType: 'horizontal' | 'vertical' | 'merit'
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Buscar regra de progressão
      const { data: rule, error: ruleError } = await this.supabase
        .from('progression_rules')
        .select('*')
        .eq('from_position_id', fromPositionId)
        .eq('to_position_id', toPositionId)
        .eq('progression_type', progressionType)
        .single();

      if (ruleError) {
        errors.push('Regra de progressão não encontrada');
        return { isValid: false, errors, warnings };
      }

      // Validar tempo no cargo
      if (rule.min_time_months) {
        const monthsInPosition = await this.getMonthsInCurrentPosition(userId);
        if (monthsInPosition < rule.min_time_months) {
          errors.push(`Tempo mínimo no cargo: ${rule.min_time_months} meses (atual: ${monthsInPosition})`);
        }
      }

      // Validar performance
      if (rule.performance_requirement) {
        const lastScore = await this.getLastPerformanceScore(userId);
        if (!lastScore || lastScore < rule.performance_requirement) {
          errors.push(`Performance mínima: ${rule.performance_requirement} (atual: ${lastScore || 'N/A'})`);
        }
      }

      // Validar requisitos adicionais
      if (rule.additional_requirements) {
        const additionalValidation = await this.validateAdditionalRequirements(
          userId,
          rule.additional_requirements
        );
        errors.push(...additionalValidation.errors);
        warnings.push(...additionalValidation.warnings);
      }

      // Regras específicas por tipo de progressão
      switch (progressionType) {
        case 'vertical':
          // Verificar se há vagas disponíveis no cargo superior
          const hasVacancy = await this.checkVacancy(toPositionId);
          if (!hasVacancy) {
            warnings.push('Não há vagas disponíveis no cargo superior');
          }
          break;

        case 'horizontal':
          // Verificar se o movimento é realmente horizontal
          const isSameLevel = await this.checkSameLevel(fromPositionId, toPositionId);
          if (!isSameLevel) {
            errors.push('Progressão horizontal deve manter o mesmo nível hierárquico');
          }
          break;

        case 'merit':
          // Verificar critérios especiais de mérito
          const meritCriteria = await this.checkMeritCriteria(userId);
          if (!meritCriteria.met) {
            errors.push(...meritCriteria.missingCriteria);
          }
          break;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erro ao validar progressão'],
        warnings: []
      };
    }
  }

  // Validar mudança de internível
  async validateLevelChange(
    userId: string,
    currentLevelId: string,
    newLevelId: string
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Buscar níveis
      const [currentLevel, newLevel] = await Promise.all([
        this.supabase.from('salary_levels').select('*').eq('id', currentLevelId).single(),
        this.supabase.from('salary_levels').select('*').eq('id', newLevelId).single()
      ]);

      if (currentLevel.error || newLevel.error) {
        errors.push('Níveis salariais inválidos');
        return { isValid: false, errors, warnings };
      }

      // Regra: Progressão deve ser sequencial
      const levelDiff = newLevel.data.order_index - currentLevel.data.order_index;
      
      if (levelDiff > 1) {
        errors.push('Progressão de nível deve ser sequencial');
      }
      
      if (levelDiff < 0) {
        warnings.push('Regressão de nível detectada - requer justificativa');
      }

      // Regra: Tempo mínimo entre mudanças de nível
      const lastLevelChange = await this.getLastLevelChangeDate(userId);
      if (lastLevelChange) {
        const monthsSinceLastChange = this.getMonthsDifference(lastLevelChange, new Date());
        if (monthsSinceLastChange < 12) {
          warnings.push(`Última mudança de nível há ${monthsSinceLastChange} meses`);
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      return {
        isValid: false,
        errors: ['Erro ao validar mudança de nível'],
        warnings: []
      };
    }
  }

  // Validar criação de trilha
  async validateCareerTrack(
    trackData: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Regra: Nome único por departamento
    if (trackData.department_id) {
      const { data: existing } = await this.supabase
        .from('career_tracks')
        .select('id')
        .eq('department_id', trackData.department_id)
        .eq('name', trackData.name)
        .single();

      if (existing) {
        errors.push('Já existe uma trilha com este nome no departamento');
      }
    }

    // Regra: Deve ter pelo menos uma posição
    if (!trackData.positions || trackData.positions.length === 0) {
      warnings.push('Trilha criada sem posições - adicione cargos');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validar estrutura salarial
  async validateSalaryStructure(
    positions: Array<{ class_id: string; base_salary: number }>
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Ordenar por classe
    const sortedPositions = positions.sort((a, b) => {
      // Aqui você precisa ter a ordem das classes
      return 0; // Simplificado
    });

    // Regra: Salários devem ser progressivos por classe
    for (let i = 1; i < sortedPositions.length; i++) {
      if (sortedPositions[i].base_salary <= sortedPositions[i - 1].base_salary) {
        errors.push('Salários devem ser progressivos entre classes');
        break;
      }
    }

    // Regra: Diferença mínima entre classes
    for (let i = 1; i < sortedPositions.length; i++) {
      const diff = sortedPositions[i].base_salary - sortedPositions[i - 1].base_salary;
      const percentDiff = (diff / sortedPositions[i - 1].base_salary) * 100;
      
      if (percentDiff < 10) {
        warnings.push(`Diferença de apenas ${percentDiff.toFixed(1)}% entre classes`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Métodos auxiliares privados
  private calculateSalary(baseSalary: number, levelPercentage: number): number {
    return baseSalary * (1 + levelPercentage / 100);
  }

  private async getUserDepartment(userId: string): Promise<string | null> {
    // Implementar busca do departamento do usuário
    return null;
  }

  private hasMultifunctionalSkills(user: any): boolean {
    // Implementar verificação de habilidades multifuncionais
    return true;
  }

  private async getMonthsInCurrentPosition(userId: string): Promise<number> {
    const { data: user } = await this.supabase
      .from('users')
      .select('position_start_date')
      .eq('id', userId)
      .single();

    if (!user?.position_start_date) return 0;

    return this.getMonthsDifference(new Date(user.position_start_date), new Date());
  }

  private async getLastPerformanceScore(userId: string): Promise<number | null> {
    const { data } = await this.supabase
      .from('evaluations')
      .select('final_score')
      .eq('employee_id', userId)
      .eq('status', 'completed')
      .order('evaluation_date', { ascending: false })
      .limit(1)
      .single();

    return data?.final_score || null;
  }

  private async validateAdditionalRequirements(
    userId: string,
    requirements: any
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Implementar validações específicas baseadas nos requisitos
    if (requirements.certifications) {
      // Verificar certificações
    }

    if (requirements.minimumProjects) {
      // Verificar projetos
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private async checkVacancy(positionId: string): Promise<boolean> {
    // Implementar verificação de vagas
    return true;
  }

  private async checkSameLevel(fromId: string, toId: string): Promise<boolean> {
    // Verificar se as posições estão no mesmo nível hierárquico
    const [from, to] = await Promise.all([
      this.supabase.from('track_positions').select('class_id').eq('id', fromId).single(),
      this.supabase.from('track_positions').select('class_id').eq('id', toId).single()
    ]);

    return from.data?.class_id === to.data?.class_id;
  }

  private async checkMeritCriteria(userId: string): Promise<{ met: boolean; missingCriteria: string[] }> {
    const missingCriteria: string[] = [];
    
    // Implementar critérios de mérito
    // Ex: projetos especiais, reconhecimentos, etc.
    
    return {
      met: missingCriteria.length === 0,
      missingCriteria
    };
  }

  private async getLastLevelChangeDate(userId: string): Promise<Date | null> {
    const { data } = await this.supabase
      .from('progression_history')
      .select('progression_date')
      .eq('user_id', userId)
      .order('progression_date', { ascending: false })
      .limit(1)
      .single();

    return data ? new Date(data.progression_date) : null;
  }

  private getMonthsDifference(date1: Date, date2: Date): number {
    const months = (date2.getFullYear() - date1.getFullYear()) * 12;
    return months + date2.getMonth() - date1.getMonth();
  }
}

// Exportar instância singleton
export const createSalaryBusinessRules = (supabase: SupabaseClient<Database>) => {
  return new SalaryBusinessRules(supabase);
};