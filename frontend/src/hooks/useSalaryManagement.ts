import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { salaryService } from '../services/salary.service';
import { userService } from '../services/user.service';
import { useAuth } from '../context/AuthContext';

interface SalaryCalculationResult {
  baseSalary: number;
  levelPercentage: number;
  calculatedSalary: number;
  difference?: number;
}

interface ProgressionValidation {
  isEligible: boolean;
  reasons: string[];
  missingRequirements: {
    timeInPosition?: number;
    performanceScore?: number;
    additionalRequirements?: string[];
  };
}

export const useSalaryManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Cálculo de salário com validações
  const calculateSalaryWithValidation = useCallback(async (
    trackPositionId: string,
    salaryLevelId: string,
    currentSalary?: number
  ): Promise<SalaryCalculationResult | null> => {
    try {
      const result = await salaryService.calculateSalary(trackPositionId, salaryLevelId);
      
      // Adicionar diferença se houver salário atual
      if (currentSalary) {
        return {
          ...result,
          difference: result.calculatedSalary - currentSalary
        };
      }
      
      return result;
    } catch (error) {
      console.error('Erro ao calcular salário:', error);
      toast.error('Erro ao calcular salário');
      return null;
    }
  }, []);

  // Validar elegibilidade para progressão
  const validateProgression = useCallback(async (
    userId: string,
    targetPositionId: string,
    progressionType: 'horizontal' | 'vertical' | 'merit'
  ): Promise<ProgressionValidation> => {
    try {
      // Buscar dados do usuário e regras
      const [userInfo, possibleProgressions] = await Promise.all([
        salaryService.getUserSalaryInfo(userId),
        salaryService.getUserPossibleProgressions(userId)
      ]);

      // Encontrar a progressão específica
      const progression = possibleProgressions.find(
        p => p.to_position_id === targetPositionId && p.progression_type === progressionType
      );

      if (!progression) {
        return {
          isEligible: false,
          reasons: ['Progressão não disponível'],
          missingRequirements: {}
        };
      }

      const reasons: string[] = [];
      const missingRequirements: any = {};

      // Validar tempo no cargo
      if (progression.min_time_months) {
        // Buscar a data de início no cargo do usuário
        const userData = await userService.getUserById(userId);
        const monthsInPosition = calculateMonthsInPosition(userData?.position_start_date);
        if (monthsInPosition < progression.min_time_months) {
          reasons.push(`Tempo mínimo no cargo: ${progression.min_time_months} meses (atual: ${monthsInPosition})`);
          missingRequirements.timeInPosition = progression.min_time_months - monthsInPosition;
        }
      }

      // Validar performance
      if (progression.performance_requirement) {
        // Aqui você pode integrar com o sistema de avaliação
        const lastPerformance = 8.5; // Exemplo - buscar da última avaliação
        if (lastPerformance < progression.performance_requirement) {
          reasons.push(`Nota mínima de desempenho: ${progression.performance_requirement} (atual: ${lastPerformance})`);
          missingRequirements.performanceScore = progression.performance_requirement;
        }
      }

      // Validar requisitos adicionais
      if (progression.additional_requirements) {
        const additionalReqs = validateAdditionalRequirements(progression.additional_requirements);
        if (additionalReqs.length > 0) {
          reasons.push(...additionalReqs);
          missingRequirements.additionalRequirements = additionalReqs;
        }
      }

      return {
        isEligible: reasons.length === 0,
        reasons,
        missingRequirements
      };
    } catch (error) {
      console.error('Erro ao validar progressão:', error);
      return {
        isEligible: false,
        reasons: ['Erro ao validar elegibilidade'],
        missingRequirements: {}
      };
    }
  }, []);

  // Processar progressão com todas as validações
  const processProgression = useCallback(async (
    userId: string,
    toTrackPositionId: string,
    toSalaryLevelId: string,
    progressionType: 'horizontal' | 'vertical' | 'merit',
    reason?: string
  ) => {
    setLoading(true);
    try {
      // Validar primeiro
      const validation = await validateProgression(userId, toTrackPositionId, progressionType);
      
      if (!validation.isEligible) {
        toast.error('Progressão não permitida: ' + validation.reasons.join(', '));
        return false;
      }

      // Processar progressão
      await salaryService.progressUser(userId, {
        toTrackPositionId,
        toSalaryLevelId,
        progressionType,
        reason: reason || `Progressão ${progressionType} aprovada`
      });

      toast.success('Progressão realizada com sucesso!');
      return true;
    } catch (error) {
      toast.error('Erro ao processar progressão');
      return false;
    } finally {
      setLoading(false);
    }
  }, [validateProgression]);

  // Importação em massa de salários
  const importSalariesFromExcel = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const data = await parseExcelFile(file);
      let successCount = 0;
      let errorCount = 0;

      for (const row of data) {
        try {
          // Validar dados da linha
          if (!row.email || !row.cargo || !row.classe || !row.nivel) {
            errorCount++;
            continue;
          }

          // Buscar IDs necessários
          const user = await findUserByEmail(row.email);
          const position = await findPositionByName(row.cargo);
          const salaryClass = await findClassByCode(row.classe);
          const level = await findLevelByName(row.nivel);

          if (!user || !position || !salaryClass || !level) {
            errorCount++;
            continue;
          }

          // Criar posição na trilha se necessário
          const trackPosition = await findOrCreateTrackPosition(
            row.trilha_id,
            position.id,
            salaryClass.id,
            row.salario_base
          );

          // Atribuir ao usuário
          await salaryService.assignUserToTrack(
            user.id,
            trackPosition.id,
            level.id
          );

          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      toast.success(`Importação concluída: ${successCount} sucessos, ${errorCount} erros`);
      return { successCount, errorCount };
    } catch (error) {
      toast.error('Erro ao importar arquivo');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Análise de equidade salarial
  const analyzeSalaryEquity = useCallback(async (
    departmentId?: string,
    positionId?: string
  ) => {
    try {
      const data = departmentId 
        ? await salaryService.getSalaryByDepartment()
        : await salaryService.getSalaryByPosition();

      // Calcular métricas de equidade
      const equityMetrics = calculateEquityMetrics(data);
      
      return {
        data,
        metrics: equityMetrics,
        recommendations: generateEquityRecommendations(equityMetrics)
      };
    } catch (error) {
      console.error('Erro ao analisar equidade:', error);
      return null;
    }
  }, []);

  // Simulador de impacto orçamentário
  const simulateBudgetImpact = useCallback(async (
    changes: Array<{
      userId: string;
      newSalary: number;
      currentSalary: number;
    }>
  ) => {
    const totalCurrentCost = changes.reduce((sum, c) => sum + c.currentSalary, 0);
    const totalNewCost = changes.reduce((sum, c) => sum + c.newSalary, 0);
    const totalIncrease = totalNewCost - totalCurrentCost;
    const percentageIncrease = (totalIncrease / totalCurrentCost) * 100;

    // Calcular encargos (exemplo simplificado)
    const employerCosts = {
      inss: totalIncrease * 0.20, // 20% INSS patronal
      fgts: totalIncrease * 0.08, // 8% FGTS
      ferias: totalIncrease / 12, // 1/12 para férias
      decimoTerceiro: totalIncrease / 12, // 1/12 para 13º
      total: totalIncrease * 1.45 // Fator aproximado de 45% de encargos
    };

    return {
      directCost: totalIncrease,
      totalCost: employerCosts.total,
      percentageIncrease,
      monthlyImpact: employerCosts.total / 12,
      yearlyImpact: employerCosts.total,
      breakdown: employerCosts,
      affectedEmployees: changes.length
    };
  }, []);

  return {
    loading,
    calculateSalaryWithValidation,
    validateProgression,
    processProgression,
    importSalariesFromExcel,
    analyzeSalaryEquity,
    simulateBudgetImpact
  };
};

// Funções auxiliares
function calculateMonthsInPosition(startDate?: string): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + 
                 (now.getMonth() - start.getMonth());
  return Math.max(0, months);
}

function validateAdditionalRequirements(requirements: any): string[] {
  const missing: string[] = [];
  
  if (requirements.certifications) {
    // Validar certificações necessárias
    missing.push('Certificações necessárias: ' + requirements.certifications.join(', '));
  }
  
  if (requirements.minimumProjects) {
    // Validar projetos mínimos
    missing.push(`Mínimo de ${requirements.minimumProjects} projetos concluídos`);
  }
  
  return missing;
}

async function parseExcelFile(file: File): Promise<any[]> {
  // Implementar parser de Excel
  return [];
}

async function findUserByEmail(email: string): Promise<any> {
  // Implementar busca de usuário
  return null;
}

async function findPositionByName(name: string): Promise<any> {
  // Implementar busca de cargo
  return null;
}

async function findClassByCode(code: string): Promise<any> {
  // Implementar busca de classe
  return null;
}

async function findLevelByName(name: string): Promise<any> {
  // Implementar busca de nível
  return null;
}

async function findOrCreateTrackPosition(
  trackId: string,
  positionId: string,
  classId: string,
  baseSalary: number
): Promise<any> {
  // Implementar busca ou criação de posição na trilha
  return null;
}

function calculateEquityMetrics(data: any[]): any {
  // Implementar cálculo de métricas de equidade
  return {
    departmentGap: 0,
    seniorityGap: 0
  };
}

function generateEquityRecommendations(metrics: any): string[] {
  // Gerar recomendações baseadas nas métricas
  return [];
}