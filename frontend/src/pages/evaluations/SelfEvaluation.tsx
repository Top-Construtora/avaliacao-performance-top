import { useEffect, useMemo, useRef, useState, type ElementType } from 'react';
import { AlertCircle, Award, Brain, Clock, Pen, Shield, Wrench, Zap } from 'lucide-react';
import { formatDateBR } from '../../utils/date';
import { COMPETENCY_SCALE, getRatingOption } from '../../constants/ratingScales';
import { useSelfEvaluationForm, type ToolkitSectionId } from '../../hooks/useSelfEvaluationForm';
import EvaluationFlow from '../../components/evaluation-flow/EvaluationFlow';
import SectionIntroScreen from '../../components/evaluation-flow/screens/SectionIntroScreen';
import RatingScreen from '../../components/evaluation-flow/screens/RatingScreen';
import TextListScreen from '../../components/evaluation-flow/screens/TextListScreen';
import ReviewScreen, {
  type ReviewGroup,
} from '../../components/evaluation-flow/screens/ReviewScreen';
import type { FlowStep } from '../../components/evaluation-flow/types';

const TOOLKIT_META: {
  id: ToolkitSectionId;
  title: string;
  prompt: string;
  icon: ElementType;
}[] = [
  { id: 'conhecimentos', title: 'Conhecimentos', prompt: 'Sei falar sobre:', icon: Brain },
  { id: 'ferramentas', title: 'Ferramentas', prompt: 'Sei usar:', icon: Wrench },
  { id: 'forcasInternas', title: 'Forças Internas', prompt: 'Me sustentam:', icon: Shield },
  { id: 'qualidades', title: 'Qualidades', prompt: 'Tenho para oferecer:', icon: Award },
];

export default function SelfEvaluation() {
  const form = useSelfEvaluationForm();
  const {
    navigate,
    profile,
    currentCycle,
    viewMode,
    currentStep,
    setCurrentStep,
    formData,
    competencyScores,
    competencyCategories,
    isSaving,
    lastSaved,
    addField,
    removeField,
    updateField,
    handleCompetencyScore,
    handleSave,
    isCycleInValidPeriod,
    getCyclePeriodMessage,
    competencyProgress,
    isAdminDemo,
  } = form;

  const [flowIndex, setFlowIndex] = useState(0);
  const initializedRef = useRef(false);
  const readOnly = viewMode === 'view';

  // ------- Monta a sequência de telas -------
  const { steps, competenciesIntroIndex } = useMemo(() => {
    const list: FlowStep[] = [];

    // Intro do toolkit
    list.push({
      id: 'intro-toolkit',
      kind: 'intro',
      group: 'Toolkit',
      render: () => (
        <SectionIntroScreen
          icon={Pen}
          eyebrow="Etapa 1 de 2"
          title="Meu Toolkit Profissional"
          description="Registre o que você domina e o que te fortalece. Um item por linha — capriche, isso apoia seu desenvolvimento."
        />
      ),
    });

    // Telas de texto (uma por seção do toolkit)
    TOOLKIT_META.forEach((meta) => {
      const items = formData[meta.id];
      const complete = items.some((v) => v.trim() !== '');
      list.push({
        id: `toolkit-${meta.id}`,
        kind: 'text',
        group: 'Toolkit',
        isComplete: complete,
        render: () => (
          <TextListScreen
            icon={meta.icon}
            eyebrow="Toolkit"
            title={meta.title}
            prompt={meta.prompt}
            items={items}
            readOnly={readOnly}
            onUpdate={(i, v) => updateField(meta.id, i, v)}
            onAdd={() => addField(meta.id)}
            onRemove={(i) => removeField(meta.id, i)}
          />
        ),
      });
    });

    // Intro de competências
    const introIdx = list.length;
    list.push({
      id: 'intro-competencies',
      kind: 'intro',
      group: 'Competências',
      render: () => (
        <SectionIntroScreen
          icon={Zap}
          eyebrow="Etapa 2 de 2"
          title="Autoavaliação de Competências"
          description="Avalie cada competência com sinceridade. Toque na nota que melhor te representa — avança sozinho."
        />
      ),
    });

    // Uma tela de rating por competência
    competencyCategories.forEach((cat) => {
      cat.items.forEach((item) => {
        const score = competencyScores[item.name] ?? competencyScores[item.id];
        list.push({
          id: `comp-${cat.id}-${item.id}`,
          kind: 'rating',
          group: cat.title,
          isComplete: score !== undefined,
          render: (ctx) => (
            <RatingScreen
              ctx={ctx}
              eyebrow={cat.title}
              title={item.name}
              description={item.description}
              options={COMPETENCY_SCALE}
              value={score}
              readOnly={readOnly}
              onChange={(v) => handleCompetencyScore(item.name, v)}
            />
          ),
        });
      });
    });

    // Revisão final
    list.push({
      id: 'review',
      kind: 'review',
      group: 'Revisão',
      render: (ctx) => {
        const toolkitGroup: ReviewGroup = {
          label: 'Toolkit',
          items: TOOLKIT_META.map((meta, i) => {
            const filled = formData[meta.id].filter((v) => v.trim() !== '');
            return {
              id: meta.id,
              label: meta.title,
              answer: filled.length > 0 ? `${filled.length} item(ns)` : undefined,
              done: filled.length > 0,
              stepIndex: 1 + i, // após a intro do toolkit
            };
          }),
        };
        const compGroups: ReviewGroup[] = competencyCategories.map((cat) => ({
          label: cat.title,
          items: cat.items.map((item) => {
            const score = competencyScores[item.name] ?? competencyScores[item.id];
            const opt = getRatingOption(COMPETENCY_SCALE, score);
            const stepIndex = list.findIndex((s) => s.id === `comp-${cat.id}-${item.id}`);
            return {
              id: `${cat.id}-${item.id}`,
              label: item.name,
              answer: opt?.label,
              done: score !== undefined,
              stepIndex,
            };
          }),
        }));
        return (
          <ReviewScreen
            mode={ctx.mode}
            groups={[toolkitGroup, ...compGroups]}
            onEdit={(i) => ctx.goTo(i)}
          />
        );
      },
    });

    return { steps: list, competenciesIntroIndex: introIdx };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, competencyScores, competencyCategories, readOnly]);

  // Inicializa a posição a partir do currentStep restaurado (uma vez)
  useEffect(() => {
    if (initializedRef.current) return;
    if (competencyCategories.length === 0) return; // aguarda telas
    initializedRef.current = true;
    if (currentStep === 'competencies') {
      setFlowIndex(competenciesIntroIndex);
    }
  }, [competencyCategories.length, currentStep, competenciesIntroIndex]);

  // Sincroniza o currentStep persistido a partir da região atual
  const handleIndexChange = (i: number) => {
    setFlowIndex(i);
    const region = i >= competenciesIntroIndex ? 'competencies' : 'toolkit';
    if (region !== currentStep) setCurrentStep(region);
  };

  // ------- Guard: sem ciclo / fora do período (ignorado no modo demo do admin) -------
  if ((!currentCycle || !isCycleInValidPeriod()) && !isAdminDemo) {
    const periodMessage = getCyclePeriodMessage();
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-lime-deep dark:text-lime" />
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          {!currentCycle ? 'Nenhum ciclo de avaliação ativo' : 'Período de avaliação indisponível'}
        </h3>
        <p className="mb-4 text-muted-foreground">
          {periodMessage?.message || 'Aguarde a abertura de um novo ciclo de avaliação.'}
        </p>
        {currentCycle && (
          <div className="mt-4 rounded-lg bg-secondary p-4">
            <p className="text-sm font-medium text-foreground">
              <strong>Ciclo:</strong> {currentCycle.title}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Período: {formatDateBR(currentCycle.start_date)} -{' '}
              {formatDateBR(currentCycle.end_date)}
            </p>
          </div>
        )}
        {profile?.is_director && (
          <button
            onClick={() => (window.location.href = '/cycle-management')}
            className="mt-4 rounded-lg bg-lime px-4 py-2 text-obsidian transition-colors hover:bg-lime/90"
          >
            Gerenciar Ciclos
          </button>
        )}
      </div>
    );
  }

  // ------- Header compacto (ciclo + prazo + auto-save) -------
  const periodMessage = getCyclePeriodMessage();
  const header = (
    <div className="rounded-xl border border-border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {readOnly ? 'Autoavaliação · leitura' : 'Autoavaliação'}
        </p>
        {isAdminDemo && !currentCycle ? (
          <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[11px] font-medium text-lime-deep dark:text-lime">
            Demonstração
          </span>
        ) : (
          !readOnly &&
          lastSaved && (
            <span className="flex flex-shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              Salvo {lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )
        )}
      </div>
      <p className="mt-0.5 truncate text-xs text-muted-foreground">
        {currentCycle
          ? `${currentCycle.title} · até ${formatDateBR(currentCycle.end_date)}`
          : 'Pré-visualização do fluxo de autoavaliação'}
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
    </div>
  );

  const canSubmit = competencyProgress >= 100;

  return (
    <EvaluationFlow
      steps={steps}
      index={flowIndex}
      onIndexChange={handleIndexChange}
      mode={viewMode}
      onSubmit={handleSave}
      isSubmitting={isSaving}
      submitLabel="Salvar Autoavaliação"
      canSubmit={canSubmit}
      header={header}
      onExit={() => navigate('/')}
    />
  );
}
