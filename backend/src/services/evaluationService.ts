import { ApiError } from '../middleware/errorHandler';
import type {
  EvaluationCycle,
  SelfEvaluation,
  LeaderEvaluation,
  EvaluationCompetency,
  CycleDashboard,
  NineBoxData,
} from '../types';

export const evaluationService = {
  // ====================================
  // CICLOS DE AVALIAÇÃO
  // ====================================
  
  // Buscar todos os ciclos
  async getEvaluationCycles(supabase: any) {
    try {
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch evaluation cycles');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar ciclo atual
  async getCurrentCycle(supabase: any) {
    try {
      const now = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('evaluation_cycles')
        .select('*')
        .lte('start_date', now)
        .gte('end_date', now)
        .in('status', ['active', 'open'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to fetch current cycle');
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar novo ciclo
  async createCycle(supabase: any, cycleData: any) {
    try {
      // Garantir que as datas sejam salvas no formato correto (YYYY-MM-DD) sem conversão de timezone
      // Se a data vier como string "YYYY-MM-DD", manter esse formato
      const start_date = cycleData.start_date.includes('T')
        ? cycleData.start_date.split('T')[0]
        : cycleData.start_date;

      const end_date = cycleData.end_date.includes('T')
        ? cycleData.end_date.split('T')[0]
        : cycleData.end_date;

      const { data, error } = await supabase
        .from('evaluation_cycles')
        .insert({
          title: cycleData.title,
          description: cycleData.description,
          start_date: start_date,
          end_date: end_date,
          status: cycleData.status || 'draft',
          is_editable: true,
          created_by: cycleData.created_by,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to create cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Atualizar status do ciclo
  async updateCycleStatus(supabase: any, cycleId: string, status: string) {
    try {
      // Se estiver abrindo um ciclo, fechar outros ciclos abertos
      if (status === 'open') {
        await supabase
          .from('evaluation_cycles')
          .update({ status: 'closed' })
          .eq('status', 'open');
      }

      const { data, error } = await supabase
        .from('evaluation_cycles')
        .update({
          status: status,
          is_editable: status !== 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', cycleId)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new ApiError(500, error.message || 'Failed to update cycle');
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // DASHBOARD E RELATÓRIOS
  // ====================================
  
  // Dashboard do ciclo
  async getCycleDashboard(supabase: any, cycleId: string) {
    try {
      console.log('\n=================================================');
      console.log('=== getCycleDashboard CALLED - VERSION 2.0 ===');
      console.log('Cycle ID:', cycleId);
      console.log('=================================================\n');

      // Buscar autoavaliações
      const { data: selfEvals, error: selfError } = await supabase
        .from('self_evaluations')
        .select(`
          *,
          employee:users!employee_id(id, name, email, position)
        `)
        .eq('cycle_id', cycleId);

      console.log('📝 SELF EVALUATIONS:');
      console.log('  - Found:', selfEvals?.length || 0);
      if (selfError) console.error('  - Error:', selfError);
      if (selfEvals?.length > 0) {
        console.log('  - Sample employee_ids:', selfEvals.slice(0, 3).map((e: any) => e.employee_id));
      }

      // Buscar avaliações de líder
      const { data: leaderEvals, error: leaderError } = await supabase
        .from('leader_evaluations')
        .select(`
          *,
          employee:users!employee_id(id, name, email, position),
          evaluator:users!evaluator_id(id, name)
        `)
        .eq('cycle_id', cycleId);

      console.log('\n👔 LEADER EVALUATIONS:');
      console.log('  - Found:', leaderEvals?.length || 0);
      if (leaderError) console.error('  - Error:', leaderError);
      if (leaderEvals?.length > 0) {
        console.log('  - Sample employee_ids:', leaderEvals.slice(0, 3).map((e: any) => e.employee_id));
        console.log('  - Sample data:', JSON.stringify({
          employee_id: leaderEvals[0].employee_id,
          employee_name: leaderEvals[0].employee?.name,
          potential_score: leaderEvals[0].potential_score,
          final_score: leaderEvals[0].final_score
        }, null, 2));
      }

      // Buscar avaliações de consenso
      const { data: consensusEvals, error: consensusError } = await supabase
        .from('consensus_evaluations')
        .select(`
          *,
          employee:users!employee_id(id, name, email, position)
        `)
        .eq('cycle_id', cycleId);

      console.log('\n🤝 CONSENSUS EVALUATIONS:');
      console.log('  - Found:', consensusEvals?.length || 0);
      if (consensusError) console.error('  - Error:', consensusError);
      if (consensusEvals?.length > 0) {
        console.log('  - Sample employee_ids:', consensusEvals.slice(0, 5).map((e: any) => e.employee_id));
        console.log('  - FULL RAW DATA FROM SUPABASE:');
        consensusEvals.forEach((ce: any, index: number) => {
          console.log(`    [${index + 1}] ${JSON.stringify(ce, null, 2)}`);
          console.log(`    Employee: ${ce.employee?.name || 'Unknown'}`);
          console.log(`        - employee_id: ${ce.employee_id}`);
          console.log(`        - consensus_score (from DB): ${ce.consensus_score}`);
          console.log(`        - potential_score (from DB): ${ce.potential_score}`);
          console.log(`        - cycle_id: ${ce.cycle_id}`);
          console.log(`        - typeof consensus_score: ${typeof ce.consensus_score}`);
          console.log(`        - typeof potential_score: ${typeof ce.potential_score}`);
        });
      }

      // Combinar dados para o dashboard
      const employeeMap = new Map<string, CycleDashboard>();

      // Processar autoavaliações
      selfEvals?.forEach((se: any) => {
        const empId = se.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: se.employee?.name || '',
            employee_email: se.employee?.email || '',
            employee_position: se.employee?.position || '',
            self_evaluation_id: se.id,
            self_evaluation_status: se.status,
            self_evaluation_score: se.final_score || null,
            leader_evaluation_id: null,
            leader_evaluation_status: 'pending',
            leader_evaluation_score: null,
            leader_potential_score: null,
            consensus_id: null,
            consensus_status: 'pending',
            consensus_performance_score: null,
            consensus_potential_score: null,
            ninebox_position: null
          });
        } else {
          const emp = employeeMap.get(empId)!;
          emp.self_evaluation_id = se.id;
          emp.self_evaluation_status = se.status;
          emp.self_evaluation_score = se.final_score || null;
        }
      });

      // Processar avaliações de líder
      leaderEvals?.forEach((le: any) => {
        console.log('Leader evaluation data:', {
          employee_id: le.employee_id,
          potential_score: le.potential_score,
          final_score: le.final_score
        });

        const empId = le.employee_id;
        if (!employeeMap.has(empId)) {
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: le.employee?.name || '',
            employee_email: le.employee?.email || '',
            employee_position: le.employee?.position || '',
            self_evaluation_id: null,
            self_evaluation_status: 'pending',
            self_evaluation_score: null,
            leader_evaluation_id: le.id,
            leader_evaluation_status: le.status,
            leader_evaluation_score: le.final_score || null,
            leader_potential_score: le.potential_score || null, // Adicionar nota de potencial do líder
            consensus_id: null,
            consensus_status: 'pending',
            consensus_performance_score: null,
            consensus_potential_score: null,
            ninebox_position: null
          });
        } else {
          const emp = employeeMap.get(empId)!;
          emp.leader_evaluation_id = le.id;
          emp.leader_evaluation_status = le.status;
          emp.leader_evaluation_score = le.final_score || null;
          emp.leader_potential_score = le.potential_score || null; // Adicionar nota de potencial do líder
        }
      });

      // Processar avaliações de consenso
      consensusEvals?.forEach((ce: any) => {
        const empId = ce.employee_id;

        console.log(`\n🔍 Processing consensus for employee: ${ce.employee?.name || empId}`);
        console.log(`   - ce.consensus_score: ${ce.consensus_score} (type: ${typeof ce.consensus_score})`);
        console.log(`   - ce.potential_score: ${ce.potential_score} (type: ${typeof ce.potential_score})`);
        console.log(`   - Employee exists in map: ${employeeMap.has(empId)}`);

        // Se o colaborador NÃO está no mapa, criar entrada para ele
        if (!employeeMap.has(empId)) {
          console.log(`   ➕ Creating new entry in map`);
          employeeMap.set(empId, {
            employee_id: empId,
            employee_name: ce.employee?.name || '',
            employee_email: ce.employee?.email || '',
            employee_position: ce.employee?.position || '',
            self_evaluation_id: null,
            self_evaluation_status: 'pending',
            self_evaluation_score: null,
            leader_evaluation_id: null,
            leader_evaluation_status: 'pending',
            leader_evaluation_score: null,
            leader_potential_score: null,
            consensus_id: ce.id,
            consensus_status: 'completed',
            consensus_performance_score: ce.consensus_score,
            consensus_potential_score: ce.potential_score,
            ninebox_position: ce.nine_box_position
          });
        } else {
          // Se já existe, atualizar os dados de consenso
          console.log(`   ✏️ Updating existing entry`);
          const emp = employeeMap.get(empId)!;
          console.log(`   - Before update: consensus_performance_score = ${emp.consensus_performance_score}, consensus_potential_score = ${emp.consensus_potential_score}`);
          emp.consensus_id = ce.id;
          emp.consensus_status = 'completed';
          emp.consensus_performance_score = ce.consensus_score;
          emp.consensus_potential_score = ce.potential_score;
          emp.ninebox_position = ce.nine_box_position;
          console.log(`   - After update: consensus_performance_score = ${emp.consensus_performance_score}, consensus_potential_score = ${emp.consensus_potential_score}`);
          console.log(`   - Verification: employeeMap.get(${empId}).consensus_performance_score = ${employeeMap.get(empId)?.consensus_performance_score}`);
        }
      });

      const result = Array.from(employeeMap.values());

      console.log('\n📊 PROCESSING RESULTS:');
      console.log('  - Total employees in map:', result.length);
      console.log('  - Employee IDs:', result.map(e => e.employee_id));

      // Garantir que todos os campos estão presentes
      const finalResult = result.map(emp => ({
        ...emp,
        leader_potential_score: emp.leader_potential_score ?? null,
        ninebox_position: emp.ninebox_position ?? null
      }));

      console.log('\n✅ FINAL DASHBOARD DATA:');
      console.log('  - Total employees:', finalResult.length);
      finalResult.forEach((emp, index) => {
        console.log(`  [${index + 1}] ${emp.employee_name}`);
        console.log(`      - employee_id: ${emp.employee_id}`);
        console.log(`      - self_evaluation_status: ${emp.self_evaluation_status}`);
        console.log(`      - leader_evaluation_status: ${emp.leader_evaluation_status}`);
        console.log(`      - consensus_status: ${emp.consensus_status}`);
        console.log(`      - consensus_performance_score: ${emp.consensus_performance_score}`);
        console.log(`      - consensus_potential_score: ${emp.consensus_potential_score}`);
        console.log(`      - Has valid consensus scores: ${emp.consensus_performance_score !== null && emp.consensus_potential_score !== null}`);
      });

      console.log('\n=================================================\n');

      return finalResult;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Dados do Nine Box
  async getNineBoxData(supabase: any, cycleId: string) {
    try {
      const { data, error } = await supabase
        .from('consensus_evaluations')
        .select(`
          *,
          employee:users!employee_id(
            id,
            name,
            position,
            department:departments(name)
          )
        `)
        .eq('cycle_id', cycleId);

      if (error) throw new ApiError(500, error.message);

      return data?.map((item: any) => ({
        employee_id: item.employee_id,
        employee_name: item.employee?.name || '',
        position: item.employee?.position || '',
        department: item.employee?.department?.name || '',
        performance_score: item.consensus_score,
        potential_score: item.potential_score,
        nine_box_position: this.calculateNineBoxPosition(
          item.consensus_score,
          item.potential_score
        )
      })) || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // AUTOAVALIAÇÕES
  // ====================================
  
  // Buscar autoavaliações do funcionário
  async getSelfEvaluations(supabase: any, employeeId: string, cycleId?: string) {
    try {
      let query = supabase
        .from('self_evaluations')
        .select(`
          *,
          evaluation_competencies!self_evaluation_id (*)
        `)
        .eq('employee_id', employeeId);
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new ApiError(500, error.message);
      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar autoavaliação
  async createSelfEvaluation(supabase: any, evaluationData: any) {
    try {
      // Calcular scores por categoria
      const technicalScore = this.calculateCategoryScore(evaluationData.competencies, 'technical');
      const behavioralScore = this.calculateCategoryScore(evaluationData.competencies, 'behavioral');
      const deliveriesScore = this.calculateCategoryScore(evaluationData.competencies, 'deliveries');
      const finalScore = this.calculateFinalScore(evaluationData.competencies);

      // Criar a autoavaliação
      const { data: evaluation, error: evalError } = await supabase
        .from('self_evaluations')
        .insert({
          cycle_id: evaluationData.cycleId,
          employee_id: evaluationData.employeeId,
          status: 'completed',
          technical_score: technicalScore,
          behavioral_score: behavioralScore,
          deliveries_score: deliveriesScore,
          final_score: finalScore,
          knowledge: evaluationData.toolkit?.knowledge || [],
          tools: evaluationData.toolkit?.tools || [],
          strengths_internal: evaluationData.toolkit?.strengths_internal || [],
          qualities: evaluationData.toolkit?.qualities || [],
          evaluation_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (evalError) throw new ApiError(500, evalError.message);

      // Salvar as competências avaliadas
      if (evaluationData.competencies && evaluationData.competencies.length > 0) {
        const competenciesToInsert = evaluationData.competencies.map((comp: any) => ({
          evaluation_id: evaluation.id,
          self_evaluation_id: evaluation.id,
          criterion_name: comp.name,
          criterion_description: comp.description,
          category: comp.category,
          score: comp.score,
          written_response: comp.written_response || '',
          created_at: new Date().toISOString()
        }));

        const { error: compError } = await supabase
          .from('evaluation_competencies')
          .insert(competenciesToInsert);

        if (compError) throw new ApiError(500, compError.message);
      }

      return evaluation;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // AVALIAÇÕES DE LÍDER
  // ====================================
  
  // Buscar avaliações de líder
  async getLeaderEvaluations(supabase: any, employeeId: string, cycleId?: string) {
    try {
      let query = supabase
        .from('leader_evaluations')
        .select(`
          *,
          evaluation_competencies!leader_evaluation_id (*),
          evaluator:users!evaluator_id(id, name)
        `)
        .eq('employee_id', employeeId);
      
      if (cycleId) {
        query = query.eq('cycle_id', cycleId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new ApiError(500, error.message);
      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Criar avaliação de líder
  async createLeaderEvaluation(supabase: any, evaluationData: any) {
    try {
      // Calcular scores
      const technicalScore = this.calculateCategoryScore(evaluationData.competencies, 'technical');
      const behavioralScore = this.calculateCategoryScore(evaluationData.competencies, 'behavioral');
      const deliveriesScore = this.calculateCategoryScore(evaluationData.competencies, 'deliveries');
      const finalScore = this.calculateFinalScore(evaluationData.competencies);

      // Criar a avaliação
      const { data: evaluation, error: evalError } = await supabase
        .from('leader_evaluations')
        .insert({
          cycle_id: evaluationData.cycleId,
          employee_id: evaluationData.employeeId,
          evaluator_id: evaluationData.evaluatorId,
          status: 'completed',
          technical_score: technicalScore,
          behavioral_score: behavioralScore,
          deliveries_score: deliveriesScore,
          final_score: finalScore,
          potential_score: evaluationData.potentialScore,
          evaluation_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (evalError) throw new ApiError(500, evalError.message);

      // Salvar as competências avaliadas
      if (evaluationData.competencies && evaluationData.competencies.length > 0) {
        const competenciesToInsert = evaluationData.competencies.map((comp: any) => ({
          evaluation_id: evaluation.id,
          leader_evaluation_id: evaluation.id,
          criterion_name: comp.name || comp.criterion_name,
          criterion_description: comp.description || comp.criterion_description,
          category: comp.category,
          score: comp.score,
          created_at: new Date().toISOString()
        }));

        const { error: compError } = await supabase
          .from('evaluation_competencies')
          .insert(competenciesToInsert);

        if (compError) throw new ApiError(500, compError.message);
      }

      // Salvar o PDI se fornecido
      if (evaluationData.pdi && evaluationData.pdi.goals && evaluationData.pdi.goals.length > 0) {
        console.log('Tentando salvar PDI com dados:', evaluationData.pdi);
        console.log('ID da avaliação do líder:', evaluation.id);
        
        // Preparar os itens no formato JSONB com todos os campos obrigatórios
        const items = [];
        
        // Extrair os dados estruturados dos arrays de strings
        for (let i = 0; i < evaluationData.pdi.goals.length; i++) {
          const goal = evaluationData.pdi.goals[i];
          const action = evaluationData.pdi.actions[i] || '';
          
          // Extrair prazo e competência do goal
          const prazoMatch = goal.match(/^(Curto|Médio|Longo) Prazo - (.+?):/);
          const competencia = prazoMatch ? prazoMatch[2] : goal.split(':')[0];
          const resultadosEsperados = goal.split(':')[1]?.trim() || '';
          
          // Extrair como desenvolver e calendarização da action
          const actionMatch = action.match(/^(Curto|Médio|Longo) Prazo - (.+?) \(Prazo: (.+?)\)/);
          const comoDesenvolver = actionMatch ? actionMatch[2] : action.split('(')[0]?.trim() || action;
          const calendarizacao = actionMatch ? actionMatch[3] : 'A definir';
          const prazo = prazoMatch ? prazoMatch[1].toLowerCase() : 'curto';
          
          items.push({
            id: `${Date.now()}-${i}`,
            competencia: competencia.trim(),
            calendarizacao: calendarizacao,
            comoDesenvolver: comoDesenvolver,
            resultadosEsperados: resultadosEsperados,
            status: '1', // Status inicial
            observacao: evaluationData.pdi.resources && evaluationData.pdi.resources[i] ? evaluationData.pdi.resources[i] : '',
            prazo: prazo
          });
        }
        
        console.log('Items preparados para JSONB com estrutura completa:', items);
        
        // Verificar se temos pelo menos um item (devido à constraint)
        if (items.length === 0) {
          console.log('Nenhum item estruturado encontrado, PDI não será salvo');
          return evaluation;
        }

        // Primeiro, vamos desativar PDIs anteriores
        await supabase
          .from('development_plans')
          .update({ status: 'completed' })
          .eq('employee_id', evaluationData.employeeId)
          .eq('status', 'active');

        const pdiInsertData = {
          employee_id: evaluationData.employeeId,
          cycle_id: evaluationData.cycleId,
          leader_evaluation_id: evaluation.id,
          consensus_evaluation_id: null, // PDI criado pela avaliação do líder
          goals: evaluationData.pdi.goals?.filter((g: string) => g) || [],
          actions: evaluationData.pdi.actions?.filter((a: string) => a) || [],
          resources: evaluationData.pdi.resources?.filter((r: string) => r) || [],
          timeline: evaluationData.pdi.timeline || 'Anual',
          status: 'active' as const,
          items: items, // Adicionar items no formato JSONB
          periodo: evaluationData.pdi.timeline || 'Anual',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: evaluationData.evaluatorId
        };
        
        console.log('Dados completos para inserir no PDI:', pdiInsertData);
        
        const { data: pdiData, error: pdiError } = await supabase
          .from('development_plans')
          .insert(pdiInsertData)
          .select()
          .single();

        if (pdiError) {
          console.error('Erro ao salvar PDI:', pdiError);
          console.error('Dados enviados:', {
            employee_id: evaluationData.employeeId,
            cycle_id: evaluationData.cycleId,
            leader_evaluation_id: evaluation.id,
            goals: evaluationData.pdi.goals,
            actions: evaluationData.pdi.actions,
            resources: evaluationData.pdi.resources,
            items: items
          });
          // Não vamos falhar a avaliação se o PDI falhar
          // throw new ApiError(500, pdiError.message);
        } else {
          console.log('PDI salvo com sucesso:', pdiData);
        }
      }

      return evaluation;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // BUSCAR TODAS AS AVALIAÇÕES (UNIFICADO)
  // ====================================
  
  async getEmployeeEvaluations(supabase: any, employeeId: string) {
    try {
      // Buscar usando a view unificada
      const { data, error } = await supabase
        .from('v_evaluations_summary')
        .select('*')
        .eq('employee_id', employeeId)
        .order('evaluation_date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        // Se a view não existir, buscar das tabelas separadas
        if (error.code === '42P01') {
          console.warn('View v_evaluations_summary does not exist, fetching from separate tables');
          
          const selfEvals = await this.getSelfEvaluations(supabase, employeeId);
          const leaderEvals = await this.getLeaderEvaluations(supabase, employeeId);
          
          return [
            ...selfEvals.map((e: any) => ({ ...e, evaluation_type: 'self' })),
            ...leaderEvals.map((e: any) => ({ ...e, evaluation_type: 'leader' }))
          ];
        }
        throw new ApiError(500, error.message || 'Failed to fetch evaluations');
      }

      return data || [];
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Verificar avaliação existente
  async checkExistingEvaluation(supabase: any, cycleId: string, employeeId: string, type: 'self' | 'leader') {
    try {
      const table = type === 'self' ? 'self_evaluations' : 'leader_evaluations';
      
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('cycle_id', cycleId)
        .eq('employee_id', employeeId)
        .limit(1);

      if (error) throw new ApiError(500, error.message);
      
      return data && data.length > 0;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // ====================================
  // FUNÇÕES AUXILIARES
  // ====================================
  
  // Calcular score por categoria
  calculateCategoryScore(competencies: EvaluationCompetency[], category: string): number {
    const categoryComps = competencies.filter(c => c.category === category);
    if (categoryComps.length === 0) return 0;
    
    const sum = categoryComps.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / categoryComps.length).toFixed(2));
  },

  // Calcular score final
  calculateFinalScore(competencies: EvaluationCompetency[]): number {
    if (competencies.length === 0) return 0;
    
    const sum = competencies.reduce((acc, comp) => acc + (comp.score || 0), 0);
    return Number((sum / competencies.length).toFixed(2));
  },

  // Calcular posição no Nine Box
  calculateNineBoxPosition(performance: number, potential: number): string {
    const perfLevel = performance <= 2 ? 'low' : performance <= 3 ? 'medium' : 'high';
    const potLevel = potential <= 2 ? 'low' : potential <= 3 ? 'medium' : 'high';

    const positions: { [key: string]: string } = {
      'low-low': 'Questionável',
      'low-medium': 'Novo/Desenvolvimento',
      'low-high': 'Enigma',
      'medium-low': 'Eficaz',
      'medium-medium': 'Mantenedor',
      'medium-high': 'Forte performance',
      'high-low': 'Especialista',
      'high-medium': 'Alto performance',
      'high-high': 'Estrela'
    };

    return positions[`${perfLevel}-${potLevel}`] || 'Não classificado';
  },

  // Calcular posição no Nine Box no formato B1-B9
  calculateNineBoxCode(performance: number, potential: number): string {
    // Performance: 1-2 = baixo (B1, B2, B3), 2.01-3 = médio (B4, B5, B6), 3.01-4 = alto (B7, B8, B9)
    // Potential: 1-2 = baixo (coluna 1), 2.01-3 = médio (coluna 2), 3.01-4 = alto (coluna 3)

    let perfRow: number;
    let potCol: number;

    // Determinar linha (baseado em performance)
    if (performance <= 2) {
      perfRow = 0; // Linha inferior (B1, B2, B3)
    } else if (performance <= 3) {
      perfRow = 1; // Linha do meio (B4, B5, B6)
    } else {
      perfRow = 2; // Linha superior (B7, B8, B9)
    }

    // Determinar coluna (baseado em potencial)
    if (potential <= 2) {
      potCol = 0; // Coluna esquerda
    } else if (potential <= 3) {
      potCol = 1; // Coluna do meio
    } else {
      potCol = 2; // Coluna direita
    }

    // Mapear para B1-B9
    // B1 B2 B3
    // B4 B5 B6
    // B7 B8 B9
    const boxNumber = (perfRow * 3) + potCol + 1;

    return `B${boxNumber}`;
  },

  // ====================================
  // PDI - PLANO DE DESENVOLVIMENTO INDIVIDUAL
  // ====================================
  
  // Salvar PDI (formato antigo)
  async savePDI(supabase: any, pdiData: any) {
    try {
      // Verificar se já existe um PDI ativo para o colaborador
      const { data: existingPDI } = await supabase
        .from('development_plans')
        .select('*')
        .eq('employee_id', pdiData.employeeId)
        .eq('status', 'active')
        .single();

      if (existingPDI) {
        // Se já existe, atualizar o status para 'completed'
        await supabase
          .from('development_plans')
          .update({ status: 'completed' })
          .eq('id', existingPDI.id);
      }

      // Criar novo PDI
      const { data, error } = await supabase
        .from('development_plans')
        .insert({
          employee_id: pdiData.employeeId,
          goals: pdiData.goals,
          actions: pdiData.actions,
          resources: pdiData.resources || [],
          timeline: pdiData.timeline || null,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Salvar PDI com items (novo formato)
  async savePDIWithItems(supabase: any, pdiData: any) {
    try {
      // Processar items para criar goals, actions e resources
      const goals: string[] = [];
      const actions: string[] = [];
      const resources: string[] = [];
      
      pdiData.items.forEach((item: any) => {
        goals.push(`Competência: ${item.competencia || 'N/A'}. Resultados Esperados: ${item.resultadosEsperados || 'N/A'}.`);
        actions.push(`Como desenvolver: ${item.comoDesenvolver || 'N/A'} (Prazo: ${item.calendarizacao || 'N/A'}, Status: ${item.status || 'N/A'}, Observação: ${item.observacao || 'N/A'}).`);
        if (item.observacao) {
          resources.push(item.observacao);
        }
      });

      // Verificar se já existe um PDI ativo para o colaborador
      const { data: existingPDI } = await supabase
        .from('development_plans')
        .select('*')
        .eq('employee_id', pdiData.employeeId)
        .eq('status', 'active')
        .single();

      const pdiPayload = {
        employee_id: pdiData.employeeId,
        goals,
        actions,
        resources,
        timeline: pdiData.periodo || null,
        items: pdiData.items, // Salvar items como JSONB
        status: 'active',
        updated_at: new Date().toISOString()
      };

      if (existingPDI) {
        // Atualizar PDI existente
        const { data, error } = await supabase
          .from('development_plans')
          .update(pdiPayload)
          .eq('id', existingPDI.id)
          .select()
          .single();

        if (error) throw new ApiError(500, error.message);
        return data;
      } else {
        // Criar novo PDI
        const { data, error } = await supabase
          .from('development_plans')
          .insert({
            ...pdiPayload,
            created_at: new Date().toISOString(),
            created_by: pdiData.createdBy
          })
          .select()
          .single();

        if (error) throw new ApiError(500, error.message);
        return data;
      }
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Buscar PDI ativo do colaborador
  async getPDI(supabase: any, employeeId: string) {
    try {
      console.log('Buscando PDI para employeeId:', employeeId);
      
      const { data, error } = await supabase
        .from('development_plans')
        .select(`
          *,
          employee:users!employee_id(id, name, position)
        `)
        .eq('employee_id', employeeId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('Resultado da busca do PDI:', { data, error });

      // Se não encontrou PDI (PGRST116 = no rows returned), retorna null
      if (error && error.code === 'PGRST116') {
        console.log('Nenhum PDI ativo encontrado para o colaborador');
        return null;
      }

      // Se houve outro tipo de erro, lança exceção
      if (error) {
        console.error('Erro ao buscar PDI:', error);
        throw new ApiError(500, error.message);
      }

      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  },

  // Atualizar PDI
  async updatePDI(supabase: any, pdiId: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('development_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', pdiId)
        .select()
        .single();

      if (error) throw new ApiError(500, error.message);
      return data;
    } catch (error: any) {
      console.error('Service error:', error);
      throw error;
    }
  }
};