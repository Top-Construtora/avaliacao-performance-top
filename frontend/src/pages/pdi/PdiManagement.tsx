import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Users, BookOpen, Info, Save } from 'lucide-react';
import Button from '../../components/Button';
import PotentialAndPDI from '../../components/PotentialAndPDI';
import type { ActionExtra } from '../../components/PotentialAndPDI';
import { api } from '../../config/api';
import { useEvaluation } from '../../hooks/useEvaluation';
import { useAuth } from '../../context/AuthContext';

// Define ActionItem and PdiData interfaces here to ensure consistency
interface ActionItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
}

interface PdiData {
  id?: string;
  colaboradorId: string;
  colaborador: string;
  cargo: string;
  departamento: string;
  periodo: string;
  nineBoxQuadrante?: string;
  nineBoxDescricao?: string;
  curtosPrazos: ActionItem[];
  mediosPrazos: ActionItem[];
  longosPrazos: ActionItem[];
  dataCriacao?: string;
  dataAtualizacao?: string;
}

const PdiManagement: React.FC = () => {
  const { employees, loadPDI, savePDI } = useEvaluation();
  const { profile } = useAuth();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [pdiData, setPdiData] = useState<PdiData>({
    colaboradorId: '',
    colaborador: '',
    cargo: '',
    departamento: '',
    periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
    curtosPrazos: [],
    mediosPrazos: [],
    longosPrazos: [],
  });
  const [loadingPDI, setLoadingPDI] = useState<boolean>(false);
  const [isSavingPDI, setIsSavingPDI] = useState<boolean>(false);
  /**
   * Retrato dos itens no último carregamento/salvamento. Como os itens agora são
   * editados direto na lista (sem etapa de confirmação), é isto que diz se há
   * algo escrito e ainda não gravado — e é o que a barra de salvar anuncia.
   */
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');

  /**
   * Prazo e curso de cada ação. Vivem em pdi_actions, não no JSONB, e por isso
   * são gravados por PATCH — mas depois do "Salvar PDI", nunca antes: a ação só
   * existe na tabela depois que o plano é salvo. O id do item é gerado aqui no
   * frontend e preservado pelo backend, então dá para preencher prazo e curso
   * num item recém-criado e gravar tudo de uma vez.
   */
  const [actionExtras, setActionExtras] = useState<Record<string, ActionExtra>>({});
  const [savedExtras, setSavedExtras] = useState<string>('{}');
  const [courseOptions, setCourseOptions] = useState<Array<{ id: string; title: string }>>([]);

  const snapshotOf = (data: PdiData) =>
    JSON.stringify([data.curtosPrazos, data.mediosPrazos, data.longosPrazos]);

  const hasUnsavedChanges =
    !!selectedEmployeeId &&
    (snapshotOf(pdiData) !== savedSnapshot || JSON.stringify(actionExtras) !== savedExtras);

  const handleActionExtraChange = (id: string, field: keyof ActionExtra, value: string | null) => {
    setActionExtras((prev) => ({
      ...prev,
      [id]: {
        due_date: null,
        course_id: null,
        course_url: null,
        course_url_title: null,
        ...prev[id],
        [field]: value,
      },
    }));
  };

  // Cursos do catálogo para o seletor (rota leve, liberada para líderes)
  useEffect(() => {
    api
      .get('/learning/course-options')
      .then((response: any) => setCourseOptions(response.data || response || []))
      .catch(() => undefined);
  }, []);

  const loadActionExtras = useCallback(async (planId: string) => {
    try {
      const response: any = await api.get(`/pdi/${planId}/actions`);
      const acoes = (response.data || response)?.actions || [];
      const mapa: Record<string, ActionExtra> = {};
      acoes.forEach((a: any) => {
        mapa[a.id] = {
          due_date: a.due_date ?? null,
          course_id: a.course_id ?? null,
          course_url: a.course_url ?? null,
          course_url_title: a.course_url_title ?? null,
        };
      });
      setActionExtras(mapa);
      setSavedExtras(JSON.stringify(mapa));
    } catch {
      setActionExtras({});
      setSavedExtras('{}');
    }
  }, []);

  // Filtrar employees baseado nas permissões do usuário
  const filteredEmployees = React.useMemo(() => {
    if (!profile) return [];

    // Admin e Diretores podem ver todos
    if (profile.is_admin || profile.is_director) {
      return employees;
    }

    // Líderes só podem ver seus subordinados
    if (profile.is_leader) {
      return employees.filter((emp) => emp.reports_to === profile.id);
    }

    // Outros usuários não veem ninguém
    return [];
  }, [employees, profile]);

  // Load PDI when selectedEmployeeId changes
  useEffect(() => {
    const fetchPdi = async () => {
      if (selectedEmployeeId) {
        setLoadingPDI(true);
        const employeeProfile = filteredEmployees.find((emp) => emp.id === selectedEmployeeId);

        // Reset PDI data before loading new one
        const initialPdiData = {
          colaboradorId: selectedEmployeeId,
          colaborador: employeeProfile?.name || '',
          cargo: employeeProfile?.position || '',
          departamento:
            employeeProfile?.departments?.map((dep) => dep.name).join(', ') || 'Não definido',
          periodo: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
          curtosPrazos: [],
          mediosPrazos: [],
          longosPrazos: [],
          dataCriacao: new Date().toISOString(),
          dataAtualizacao: new Date().toISOString(),
        };
        setPdiData(initialPdiData);

        try {
          const loadedPdi = await loadPDI(selectedEmployeeId);

          if (loadedPdi) {
            // Mesclar os dados carregados com as informações do colaborador
            const mergedPdiData = {
              ...loadedPdi,
              colaborador: employeeProfile?.name || loadedPdi.colaborador,
              cargo: employeeProfile?.position || loadedPdi.cargo,
              departamento:
                employeeProfile?.departments?.map((dep) => dep.name).join(', ') ||
                loadedPdi.departamento ||
                'Não definido',
            };
            setPdiData(mergedPdiData);
            setSavedSnapshot(snapshotOf(mergedPdiData));
            if (mergedPdiData.id) loadActionExtras(mergedPdiData.id);
            toast.success('PDI carregado com sucesso!');
          } else {
            // Se não houver PDI, mantenha os dados iniciais e informe ao usuário
            setPdiData(initialPdiData);
            setSavedSnapshot(snapshotOf(initialPdiData));
            setActionExtras({});
            setSavedExtras('{}');
            toast('Nenhum PDI encontrado para este colaborador. Crie um novo!');
          }
        } catch (error) {
          console.error('Erro ao carregar PDI:', error);
          setPdiData(initialPdiData);
          setSavedSnapshot(snapshotOf(initialPdiData));
          toast.error('Erro ao carregar PDI. Você pode criar um novo.');
        } finally {
          setLoadingPDI(false);
        }
      }
    };
    fetchPdi();
  }, [selectedEmployeeId, filteredEmployees, loadPDI, loadActionExtras]);

  const handleSavePDI = useCallback(async () => {
    if (!pdiData.colaboradorId) {
      toast.error('Selecione um colaborador para salvar o PDI.');
      return;
    }

    const todosItens = [
      ...pdiData.curtosPrazos.map((item) => ({ ...item, prazo: 'curto' as const })),
      ...pdiData.mediosPrazos.map((item) => ({ ...item, prazo: 'medio' as const })),
      ...pdiData.longosPrazos.map((item) => ({ ...item, prazo: 'longo' as const })),
    ];

    // Item em branco = clicou em adicionar e desistiu. Descartar em silêncio é
    // melhor que barrar o salvamento inteiro por causa dele.
    const preenchidos = todosItens.filter((item) =>
      [item.competencia, item.comoDesenvolver, item.resultadosEsperados, item.observacao].some(
        (campo) => (campo || '').trim() !== '',
      ),
    );

    if (preenchidos.length === 0) {
      toast.error(
        'Adicione pelo menos um item ao Plano de Desenvolvimento Individual (PDI) antes de salvar.',
      );
      return;
    }

    // O backend exige os três campos em todo item — avisar qual está faltando é
    // mais útil que devolver "estrutura inválida".
    const incompleto = preenchidos.find(
      (item) =>
        !item.competencia.trim() ||
        !item.comoDesenvolver.trim() ||
        !item.resultadosEsperados.trim(),
    );
    if (incompleto) {
      toast.error(
        `Complete o item "${incompleto.competencia || 'sem competência'}": competência, como desenvolver e resultados esperados são obrigatórios.`,
      );
      return;
    }

    const allPdiActionItems = preenchidos.map((item) => ({
      ...item,
      calendarizacao: item.calendarizacao?.trim() || 'A definir',
    }));

    // Criar arrays para o formato antigo (compatibilidade)
    const pdiGoals = allPdiActionItems.map(
      (item) =>
        `Competência: ${item.competencia || 'N/A'}. Resultados Esperados: ${item.resultadosEsperados || 'N/A'}.`,
    );

    const pdiActions = allPdiActionItems.map(
      (item) =>
        `Como desenvolver: ${item.comoDesenvolver || 'N/A'} (Prazo: ${item.calendarizacao || 'N/A'}, Status: ${item.status || 'N/A'}, Observação: ${item.observacao || 'N/A'}).`,
    );

    const pdiToSave = {
      employeeId: pdiData.colaboradorId,
      goals: pdiGoals,
      actions: pdiActions,
      resources: [],
      timeline: pdiData.periodo,
      items: allPdiActionItems, // Adicionar o campo items com os dados completos
    };

    setIsSavingPDI(true);
    try {
      await savePDI(pdiToSave);
      toast.success('PDI salvo/atualizado com sucesso!');

      // Recarregar o PDI após salvar para garantir sincronização
      const reloadedPdi = await loadPDI(pdiData.colaboradorId);
      if (reloadedPdi) {
        const mergedPdiData = {
          ...reloadedPdi,
          colaborador: pdiData.colaborador,
          cargo: pdiData.cargo,
          departamento: pdiData.departamento,
        };
        setPdiData(mergedPdiData);
        setSavedSnapshot(snapshotOf(mergedPdiData));

        // Prazo e curso só podem ser gravados agora: antes do save a ação ainda
        // não existe na tabela. O id do item veio do frontend e foi preservado,
        // então o PATCH acha a ação recém-criada.
        const planId = mergedPdiData.id;
        if (planId) {
          const anteriores: Record<string, ActionExtra> = JSON.parse(savedExtras);
          const alterados = Object.entries(actionExtras).filter(
            ([id, extra]) => JSON.stringify(anteriores[id]) !== JSON.stringify(extra),
          );

          const falhas = await Promise.all(
            alterados.map(([id, extra]) =>
              api.patch(`/pdi/${planId}/actions/${id}`, extra).then(
                () => null,
                (erro: any) => erro?.message || 'erro ao salvar prazo/curso',
              ),
            ),
          );
          const erro = falhas.find(Boolean);
          if (erro) toast.error(String(erro));

          await loadActionExtras(planId);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar PDI:', error);
      toast.error('Erro ao salvar PDI.');
    } finally {
      setIsSavingPDI(false);
    }
    // actionExtras/savedExtras precisam estar aqui: sem eles o callback fica com
    // uma cópia antiga e o salvamento ignoraria o prazo/curso recém-digitado.
  }, [pdiData, savePDI, loadPDI, actionExtras, savedExtras, loadActionExtras]);

  const handlePdiSubmit = async () => {
    // For PDI Management page, "submit" is effectively "save"
    await handleSavePDI();
  };

  const selectedEmployee = filteredEmployees.find((emp) => emp.id === selectedEmployeeId);

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-lime-deep dark:text-lime mr-3" />
                Gerenciar PDI
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Visualize e edite Planos de Desenvolvimento Individual
              </p>
            </div>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-foreground font-medium mb-2">
              <Users className="inline h-4 w-4 mr-1" />
              Selecione o Colaborador
            </label>
            <div className="relative">
              <select
                className="w-full pl-10 pr-10 rounded-xl border border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 focus:bg-background transition-colors py-2.5 px-3 appearance-none cursor-pointer"
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={loadingPDI}
              >
                <option value="">Escolha um colaborador...</option>
                {filteredEmployees
                  .filter((employee) => !employee.is_admin && !employee.is_director)
                  .map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} - {employee.position}
                    </option>
                  ))}
              </select>
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="h-5 w-5 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </div>
          {selectedEmployee && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-2">
                  <BookOpen className="inline h-4 w-4 mr-1" />
                  PDI Período
                </label>
                <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm">
                  {pdiData.periodo || 'Não definido'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground font-medium mb-2">
                  <Info className="inline h-4 w-4 mr-1" />
                  Última Atualização
                </label>
                <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm">
                  {pdiData.dataAtualizacao
                    ? new Date(pdiData.dataAtualizacao).toLocaleDateString('pt-BR')
                    : 'N/A'}
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* PDI Content */}
      {selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {loadingPDI ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime"></div>
            </div>
          ) : (
            <>
              <PotentialAndPDI
                currentStep={3} // Force step 3 to show PDI section
                potentialItems={[]} // Not used here
                setPotentialItems={() => {}} // Not used here
                pdiData={pdiData}
                setPdiData={setPdiData}
                handlePreviousStep={() => {}} // Not used here
                handleNextStep={() => {}} // Not used here
                handleSave={handleSavePDI} // Use the local save handler
                handleSubmit={handlePdiSubmit} // Use the local submit handler (which calls save)
                isSaving={isSavingPDI}
                loading={loadingPDI}
                canProceedToStep3={() => true}
                selectedEmployee={selectedEmployee}
                hideActionButtons={true} // Ocultar botões de Salvar Rascunho e Enviar Avaliação
                actionExtras={actionExtras}
                onActionExtraChange={handleActionExtraChange}
                courseOptions={courseOptions}
              />
            </>
          )}
        </motion.div>
      )}

      {/* Barra de salvamento: fica colada no rodapé enquanto houver algo escrito
          e não gravado. Com a edição direta na lista, não existe mais um "salvar
          item" — este é o único ponto onde o plano é gravado, e ele precisa
          dizer sozinho se ainda falta fazer isso. */}
      {selectedEmployeeId && !loadingPDI && (
        <div className="sticky bottom-0 z-10 -mx-4 sm:mx-0 px-4 sm:px-6 py-3 bg-card/95 backdrop-blur border-t sm:border sm:rounded-2xl border-border shadow-lg flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            {hasUnsavedChanges ? (
              <span className="flex items-center gap-2 text-foreground font-medium">
                <span className="h-2 w-2 rounded-full bg-[#D2FF00]" />
                Alterações ainda não salvas
              </span>
            ) : (
              'Tudo salvo'
            )}
          </span>
          <Button
            variant={hasUnsavedChanges ? 'primary' : 'outline'}
            onClick={handleSavePDI}
            icon={<Save size={18} />}
            size="lg"
            disabled={isSavingPDI || loadingPDI || !hasUnsavedChanges}
          >
            {isSavingPDI ? 'Salvando...' : 'Salvar PDI'}
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!selectedEmployeeId && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-secondary mb-6">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-lime-deep dark:text-lime" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Selecione um colaborador
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Escolha um colaborador no menu acima para visualizar ou editar o PDI.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default PdiManagement;
