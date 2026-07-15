import { useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { AlertCircle, BookOpen, Rocket, Star, Target, TrendingUp } from 'lucide-react';
import { COMPETENCY_SCALE, POTENTIAL_SCALE, getRatingOption } from '../../constants/ratingScales';
import {
  useLeaderEvaluationForm,
  getQuadrantColor,
  type Prazo,
} from '../../hooks/useLeaderEvaluationForm';
import LoadingSpinner from '../../components/LoadingSpinner';
import EvaluationFlow from '../../components/evaluation-flow/EvaluationFlow';
import SectionIntroScreen from '../../components/evaluation-flow/screens/SectionIntroScreen';
import RatingScreen from '../../components/evaluation-flow/screens/RatingScreen';
import EmployeePickerScreen from '../../components/evaluation-flow/screens/EmployeePickerScreen';
import PdiPrazoScreen from '../../components/evaluation-flow/screens/PdiPrazoScreen';
import ReviewScreen, {
  type ReviewGroup,
} from '../../components/evaluation-flow/screens/ReviewScreen';
import type { FlowStep } from '../../components/evaluation-flow/types';

const PDI_META: {
  prazo: Prazo;
  key: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos';
  title: string;
  subtitle: string;
  description: string;
  icon: ElementType;
}[] = [
  {
    prazo: 'curto',
    key: 'curtosPrazos',
    title: 'Curto Prazo',
    subtitle: '3 meses',
    description: 'Ações imediatas e de rápido impacto.',
    icon: BookOpen,
  },
  {
    prazo: 'medio',
    key: 'mediosPrazos',
    title: 'Médio Prazo',
    subtitle: '3-6 meses',
    description: 'Desenvolvimento contínuo e estruturado.',
    icon: Target,
  },
  {
    prazo: 'longo',
    key: 'longosPrazos',
    title: 'Longo Prazo',
    subtitle: '6-12 meses',
    description: 'Visão estratégica e crescimento sustentável.',
    icon: Rocket,
  },
];

export default function LeaderEvaluation() {
  const form = useLeaderEvaluationForm();
  const {
    navigate,
    profile,
    currentCycle,
    subordinates,
    selectedEmployeeId,
    setSelectedEmployeeId,
    currentStep,
    setCurrentStep,
    loading,
    isLoadingEmployee,
    isSaving,
    viewMode,
    sections,
    potentialItems,
    pdiData,
    employeeNineBox,
    selectedEmployee,
    setSectionScore,
    handlePotentialScoreChange,
    addPdiItem,
    removePdiItem,
    updateActionItem,
    canProceedToStep2,
    canProceedToStep3,
    handleSubmit,
    isCycleInValidPeriod,
    getCyclePeriodMessage,
    isAdminDemo,
  } = form;

  const [flowIndex, setFlowIndex] = useState(0);
  const initializedRef = useRef(false);
  const readOnly = viewMode === 'view';

  const totalPdiItems =
    pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;

  // ------- Sequência de telas -------
  const { steps, potIntroIdx, pdiIntroIdx } = useMemo(() => {
    const list: FlowStep[] = [];

    // 0 — Seleção de colaborador
    list.push({
      id: 'picker',
      kind: 'picker',
      group: 'Colaborador',
      isComplete: !!selectedEmployeeId,
      blockAdvanceUntilComplete: true,
      render: () => (
        <EmployeePickerScreen
          subordinates={subordinates}
          selectedId={selectedEmployeeId}
          onSelect={setSelectedEmployeeId}
          loading={loading}
        />
      ),
    });

    // Sem colaborador → só o picker
    if (!selectedEmployeeId) {
      return { steps: list, competIntroIdx: 1, potIntroIdx: 1, pdiIntroIdx: 1 };
    }

    // Competências
    const cIdx = list.length;
    list.push({
      id: 'intro-comp',
      kind: 'intro',
      group: 'Competências',
      render: () => (
        <SectionIntroScreen
          icon={Star}
          eyebrow="Etapa 1 de 3"
          title="Competências"
          description="Avalie cada competência do colaborador. Toque na nota — avança sozinho."
        />
      ),
    });
    sections.forEach((sec) => {
      sec.items.forEach((item) => {
        list.push({
          id: `comp-${sec.id}-${item.id}`,
          kind: 'rating',
          group: sec.title,
          isComplete: item.score !== undefined,
          render: (ctx) => (
            <RatingScreen
              ctx={ctx}
              eyebrow={`${sec.title} · peso ${sec.weight}%`}
              title={item.name}
              description={item.description}
              options={COMPETENCY_SCALE}
              value={item.score}
              readOnly={readOnly}
              onChange={(v) => setSectionScore(sec.id, item.id, v)}
            />
          ),
        });
      });
    });

    // Potencial
    const pIdx = list.length;
    list.push({
      id: 'intro-pot',
      kind: 'intro',
      group: 'Potencial',
      render: () => (
        <SectionIntroScreen
          icon={TrendingUp}
          eyebrow="Etapa 2 de 3"
          title="Potencial"
          description="Avalie o potencial de crescimento do colaborador."
        />
      ),
    });
    potentialItems.forEach((item) => {
      list.push({
        id: `pot-${item.id}`,
        kind: 'rating',
        group: 'Potencial',
        isComplete: item.score !== undefined,
        render: (ctx) => (
          <RatingScreen
            ctx={ctx}
            eyebrow="Potencial"
            title={item.name}
            description={item.description}
            options={POTENTIAL_SCALE}
            value={item.score}
            readOnly={readOnly}
            onChange={(v) => handlePotentialScoreChange(item.id, v)}
          />
        ),
      });
    });

    // PDI
    const dIdx = list.length;
    list.push({
      id: 'intro-pdi',
      kind: 'intro',
      group: 'PDI',
      render: () => (
        <SectionIntroScreen
          icon={Rocket}
          eyebrow="Etapa 3 de 3"
          title="Plano de Desenvolvimento"
          description="Defina ações de curto, médio e longo prazo. Ao menos um item é necessário."
        />
      ),
    });
    PDI_META.forEach((meta) => {
      list.push({
        id: `pdi-${meta.prazo}`,
        kind: 'form',
        group: 'PDI',
        isComplete: pdiData[meta.key].length > 0,
        render: () => (
          <PdiPrazoScreen
            prazo={meta.prazo}
            icon={meta.icon}
            title={meta.title}
            subtitle={meta.subtitle}
            description={meta.description}
            items={pdiData[meta.key]}
            readOnly={readOnly}
            onAdd={addPdiItem}
            onRemove={(id) => removePdiItem(id, meta.prazo)}
            onUpdate={(id, field, value) => updateActionItem(meta.key, id, field, value)}
          />
        ),
      });
    });

    // Revisão
    list.push({
      id: 'review',
      kind: 'review',
      group: 'Revisão',
      render: (ctx) => {
        const compGroups: ReviewGroup[] = sections.map((sec) => ({
          label: sec.title,
          items: sec.items.map((item) => {
            const opt = getRatingOption(COMPETENCY_SCALE, item.score);
            return {
              id: `${sec.id}-${item.id}`,
              label: item.name,
              answer: opt?.label,
              done: item.score !== undefined,
              stepIndex: list.findIndex((s) => s.id === `comp-${sec.id}-${item.id}`),
            };
          }),
        }));
        const potGroup: ReviewGroup = {
          label: 'Potencial',
          items: potentialItems.map((item) => {
            const opt = getRatingOption(POTENTIAL_SCALE, item.score);
            return {
              id: `pot-${item.id}`,
              label: item.name,
              answer: opt?.label,
              done: item.score !== undefined,
              stepIndex: list.findIndex((s) => s.id === `pot-${item.id}`),
            };
          }),
        };
        const pdiGroup: ReviewGroup = {
          label: 'PDI',
          items: PDI_META.map((meta) => ({
            id: `pdi-${meta.prazo}`,
            label: meta.title,
            answer:
              pdiData[meta.key].length > 0 ? `${pdiData[meta.key].length} item(ns)` : undefined,
            done: pdiData[meta.key].length > 0,
            stepIndex: list.findIndex((s) => s.id === `pdi-${meta.prazo}`),
          })),
        };
        return (
          <ReviewScreen
            mode={ctx.mode}
            groups={[...compGroups, potGroup, pdiGroup]}
            onEdit={(i) => ctx.goTo(i)}
          />
        );
      },
    });

    return { steps: list, competIntroIdx: cIdx, potIntroIdx: pIdx, pdiIntroIdx: dIdx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEmployeeId, subordinates, loading, sections, potentialItems, pdiData, readOnly]);

  // Inicializa a posição a partir do currentStep restaurado (uma vez, após seleção)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!selectedEmployeeId || sections.length === 0) return;
    initializedRef.current = true;
    if (currentStep === 2) setFlowIndex(potIntroIdx);
    else if (currentStep === 3) setFlowIndex(pdiIntroIdx);
  }, [selectedEmployeeId, sections.length, currentStep, potIntroIdx, pdiIntroIdx]);

  // Ao trocar de colaborador, permitir nova inicialização
  useEffect(() => {
    initializedRef.current = false;
    setFlowIndex(0);
  }, [selectedEmployeeId]);

  const handleIndexChange = (i: number) => {
    setFlowIndex(i);
    const region = i >= pdiIntroIdx ? 3 : i >= potIntroIdx ? 2 : 1;
    if (region !== currentStep) setCurrentStep(region);
  };

  // ------- Guards -------
  if (loading) return <LoadingSpinner minHeight="min-h-[60vh]" />;

  if ((!currentCycle || !isCycleInValidPeriod()) && !isAdminDemo) {
    const periodMessage = getCyclePeriodMessage();
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-lime-deep dark:text-lime" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="mb-4 text-muted-foreground">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {profile?.is_director && (
          <button
            onClick={() => (window.location.href = '/cycle-management')}
            className="rounded-lg bg-lime px-4 py-2 text-obsidian transition-colors hover:bg-lime/90"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

  // ------- Header compacto -------
  const periodMessage = getCyclePeriodMessage();
  const header = (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {selectedEmployee ? selectedEmployee.name : 'Avaliação do Líder'}
        </p>
        {employeeNineBox?.nine_box_position && (
          <span
            className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${getQuadrantColor(
              employeeNineBox.nine_box_position,
            )}`}
          >
            {employeeNineBox.nine_box_position}
          </span>
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {selectedEmployee?.position ? `${selectedEmployee.position} · ` : ''}
        {currentCycle?.title ?? 'Pré-visualização (demonstração)'}
      </p>
      {periodMessage && (
        <p
          className={`mt-1 text-xs font-medium ${
            periodMessage.type === 'error' ? 'text-destructive' : 'text-warning'
          }`}
        >
          {periodMessage.message}
        </p>
      )}
      {isLoadingEmployee && (
        <p className="mt-1 text-xs text-muted-foreground">Carregando dados do colaborador…</p>
      )}
    </div>
  );

  const canSubmit = canProceedToStep2() && canProceedToStep3() && totalPdiItems > 0;

  return (
    <EvaluationFlow
      steps={steps}
      index={flowIndex}
      onIndexChange={handleIndexChange}
      mode={viewMode}
      onSubmit={handleSubmit}
      isSubmitting={isSaving}
      submitLabel="Enviar Avaliação"
      canSubmit={canSubmit}
      header={header}
      onExit={() => navigate('/')}
    />
  );
}
