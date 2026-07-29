import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Send,
  AlertCircle,
  CheckCircle,
  Star,
  Award,
  BookOpen,
  Target,
  Rocket,
  Calendar,
  Lightbulb,
  MessageSquare,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Button from './Button';
import { useEvaluation } from '../hooks/useEvaluation';
import type { NineBoxData } from '../types/evaluation.types';
import type { UserWithDetails } from '../types/supabase';
import { toast } from 'react-hot-toast';

interface PotentialItem {
  id: string;
  name: string;
  description: string;
  score?: number;
}

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

/**
 * Campos que vivem só na tabela pdi_actions (o JSONB não os conhece): prazo
 * real e o curso indicado. Chegam por props para que a gravação continue sendo
 * uma só — o "Salvar PDI" do pai grava o plano e estes campos juntos.
 */
export interface ActionExtra {
  due_date: string | null;
  course_id: string | null;
  course_url: string | null;
  course_url_title: string | null;
}

interface PotentialAndPDIProps {
  currentStep: number;
  potentialItems: PotentialItem[];
  setPotentialItems: React.Dispatch<React.SetStateAction<PotentialItem[]>>;
  pdiData: PdiData;
  setPdiData: React.Dispatch<React.SetStateAction<PdiData>>;
  handlePreviousStep: () => void;
  handleNextStep: () => void;
  handleSubmit: () => Promise<void>;
  isSaving: boolean;
  loading: boolean;
  canProceedToStep3: () => boolean;
  selectedEmployee: UserWithDetails | undefined;
  hideActionButtons?: boolean;
  readOnly?: boolean;
  /** Sem estes três, o card não mostra prazo nem curso (ex.: fluxo da avaliação). */
  actionExtras?: Record<string, ActionExtra>;
  onActionExtraChange?: (id: string, field: keyof ActionExtra, value: string | null) => void;
  courseOptions?: Array<{ id: string; title: string }>;
}

const PotentialAndPDI: React.FC<PotentialAndPDIProps> = ({
  currentStep,
  potentialItems,
  setPotentialItems,
  pdiData,
  setPdiData,
  handlePreviousStep,
  handleNextStep,
  handleSubmit,
  isSaving,
  loading,
  canProceedToStep3,
  selectedEmployee,
  hideActionButtons = false,
  readOnly = false,
  actionExtras,
  onActionExtraChange,
  courseOptions = [],
}) => {
  const { getNineBoxByEmployeeId } = useEvaluation();
  const employeeNineBox: NineBoxData | undefined = selectedEmployee
    ? getNineBoxByEmployeeId(selectedEmployee.id)
    : undefined;

  const [expandedPdiSections, setExpandedPdiSections] = useState({
    curto: true,
    medio: false,
    longo: false,
  });

  /**
   * Itens com o editor de curso aberto. Nem toda ação de PDI é um curso —
   * mentoria, projeto e leitura também são ações — então os campos ficam atrás
   * de um link em vez de ocupar quatro linhas vazias em toda ação.
   */
  const [cursoEditando, setCursoEditando] = useState<Record<string, boolean>>({});

  // Calcular total de itens do PDI
  const totalPdiItems =
    pdiData.curtosPrazos.length + pdiData.mediosPrazos.length + pdiData.longosPrazos.length;

  const calculatePotentialScores = () => {
    const scores = potentialItems
      .filter((item) => item.score !== undefined)
      .map((item) => item.score || 0);
    if (scores.length === 0) return { results: 0, agility: 0, relationships: 0, final: 0 };

    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    return {
      results: potentialItems[0]?.score || 0,
      agility: potentialItems[1]?.score || 0,
      relationships: ((potentialItems[2]?.score || 0) + (potentialItems[3]?.score || 0)) / 2,
      final: average,
    };
  };

  const handlePotentialScoreChange = (itemId: string, score: number) => {
    setPotentialItems((prev: PotentialItem[]) =>
      prev.map((item) => (item.id === itemId ? { ...item, score } : item)),
    );
  };

  /**
   * Uma seção aberta por vez: abrir Médio fecha Curto. Os itens são altos, e com
   * duas ou três seções abertas a página vira uma rolagem sem fim em que se
   * perde de vista qual prazo está sendo editado.
   */
  const togglePdiSection = (sectionKey: 'curto' | 'medio' | 'longo') => {
    setExpandedPdiSections((prev) => ({
      curto: sectionKey === 'curto' ? !prev.curto : false,
      medio: sectionKey === 'medio' ? !prev.medio : false,
      longo: sectionKey === 'longo' ? !prev.longo : false,
    }));
  };

  const removePdiItem = (idToRemove: string, prazo: 'curto' | 'medio' | 'longo') => {
    setPdiData((prev: PdiData) => {
      if (prazo === 'curto') {
        return {
          ...prev,
          curtosPrazos: prev.curtosPrazos.filter((item) => item.id !== idToRemove),
        };
      } else if (prazo === 'medio') {
        return {
          ...prev,
          mediosPrazos: prev.mediosPrazos.filter((item) => item.id !== idToRemove),
        };
      } else if (prazo === 'longo') {
        return {
          ...prev,
          longosPrazos: prev.longosPrazos.filter((item) => item.id !== idToRemove),
        };
      }
      return prev;
    });
    toast.success('Item de PDI removido.');
  };

  const updateActionItem = (
    category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos',
    id: string,
    field: keyof ActionItem,
    value: any,
  ) => {
    setPdiData((prev: PdiData) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  };

  /**
   * Cria o item já na lista, vazio, para ser preenchido no lugar.
   *
   * Antes havia um formulário à parte que só entrava no plano ao clicar em
   * "Adicionar Item" — quem terminava de escrever e não queria mais itens não
   * clicava, e perdia tudo. Sem etapa de confirmação, não há o que perder: o
   * que está na tela é o que será salvo.
   */
  const addEmptyPdiItem = (prazo: 'curto' | 'medio' | 'longo') => {
    const prazoMap = {
      curto: 'curtosPrazos',
      medio: 'mediosPrazos',
      longo: 'longosPrazos',
    } as const;
    const key = prazoMap[prazo];

    const novoItem: ActionItem = {
      id: `${prazo}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      competencia: '',
      calendarizacao: '',
      comoDesenvolver: '',
      resultadosEsperados: '',
      status: '1',
      observacao: '',
    };

    setPdiData((prev: PdiData) => ({ ...prev, [key]: [...prev[key], novoItem] }));
    setExpandedPdiSections({
      curto: prazo === 'curto',
      medio: prazo === 'medio',
      longo: prazo === 'longo',
    });
  };

  const potentialRatingLabels: Record<number, { label: string; color: string; darkColor: string }> =
    {
      1: { label: 'Não atende o esperado', color: 'bg-destructive', darkColor: '' },
      2: { label: 'Em desenvolvimento', color: 'bg-warning', darkColor: '' },
      3: { label: 'Atende ao esperado', color: 'bg-success/80', darkColor: '' },
      4: { label: 'Supera', color: 'bg-success', darkColor: '' },
    };

  const getRatingInfo = (score: number | undefined) => {
    if (!score || !potentialRatingLabels[score]) {
      return { label: 'N/A', color: 'bg-muted-foreground', darkColor: '' };
    }
    return potentialRatingLabels[score];
  };

  const statusOptions = [
    {
      value: '1',
      label: 'Não iniciado',
      color: 'bg-secondary text-muted-foreground font-medium border-border',
    },
    { value: '2', label: 'Iniciado', color: 'bg-success/10 text-success border-success/30' },
    { value: '3', label: 'Em andamento', color: 'bg-warning/10 text-warning border-warning/30' },
    { value: '4', label: 'Quase concluído', color: 'bg-warning/10 text-warning border-warning/30' },
    { value: '5', label: 'Concluído', color: 'bg-success/10 text-success border-success/30' },
  ];

  const categories = [
    {
      key: 'curtosPrazos' as const,
      title: 'Curto Prazo',
      subtitle: '3 meses',
      icon: BookOpen,
      gradient: '',
      darkGradient: '',
      bgColor: 'bg-secondary',
      darkBgColor: '',
      borderColor: 'border-border',
      darkBorderColor: '',
      iconBg: 'bg-lime',
      description: 'Ações imediatas e de rápido impacto',
    },
    {
      key: 'mediosPrazos' as const,
      title: 'Médio Prazo',
      subtitle: '3-6 meses',
      icon: Target,
      gradient: '',
      darkGradient: '',
      bgColor: 'bg-secondary',
      darkBgColor: '',
      borderColor: 'border-border',
      darkBorderColor: '',
      iconBg: 'bg-lime',
      description: 'Desenvolvimento contínuo e estruturado',
    },
    {
      key: 'longosPrazos' as const,
      title: 'Longo Prazo',
      subtitle: '6-12 meses',
      icon: Rocket,
      gradient: '',
      darkGradient: '',
      bgColor: 'bg-secondary',
      darkBgColor: '',
      borderColor: 'border-border',
      darkBorderColor: '',
      iconBg: 'bg-lime',
      description: 'Visão estratégica e crescimento sustentável',
    },
  ];

  const renderActionItems = (category: 'curtosPrazos' | 'mediosPrazos' | 'longosPrazos') => {
    const categoryData = categories.find((cat) => cat.key === category)!;
    const items = pdiData[category] || [];

    const categoryToPrazoMap: { [key: string]: 'curto' | 'medio' | 'longo' } = {
      curtosPrazos: 'curto',
      mediosPrazos: 'medio',
      longosPrazos: 'longo',
    };
    const prazo = categoryToPrazoMap[category];

    const isExpanded = expandedPdiSections[prazo];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border overflow-hidden"
      >
        <button
          onClick={() => togglePdiSection(prazo)}
          className={`w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6 ${categoryData.bgColor} ${categoryData.darkBgColor} border-b ${categoryData.borderColor} ${categoryData.darkBorderColor} hover:opacity-90 transition-all duration-200`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div
                className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${categoryData.iconBg} shadow-md`}
              >
                <categoryData.icon className="h-5 w-5 sm:h-6 sm:w-6 text-obsidian" />
              </div>
              <div className="text-left">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                  {categoryData.title}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">
                  {categoryData.subtitle} • {categoryData.description}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                  {categoryData.subtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="text-right">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                  {items.length}
                </p>
                <p className="text-xs text-muted-foreground">itens</p>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="p-4 sm:p-6 lg:p-8"
            >
              <div className="space-y-4 sm:space-y-6">
                {items.length === 0 ? (
                  !readOnly && (
                    <div className="text-center py-8 sm:py-12">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                        Nenhum item de desenvolvimento adicionado
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => addEmptyPdiItem(prazo)}
                        icon={<Plus size={16} />}
                        size="sm"
                      >
                        Adicionar Primeiro Item
                      </Button>
                    </div>
                  )
                ) : (
                  <>
                    {items.map((item, itemIndex) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: itemIndex * 0.1 }}
                        className="bg-secondary rounded-lg sm:rounded-xl p-4 sm:p-5 border border-border"
                      >
                        {/* Header do Item */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-lg ${categoryData.iconBg} flex items-center justify-center text-obsidian text-sm font-bold shadow-sm`}
                            >
                              {itemIndex + 1}
                            </div>
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${statusOptions.find((s) => s.value === item.status)?.color}`}
                            >
                              {statusOptions.find((s) => s.value === item.status)?.label}
                            </span>
                          </div>
                          {!readOnly && (
                            <button
                              onClick={() => removePdiItem(item.id, prazo)}
                              className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                            >
                              <X size={16} className="sm:hidden" />
                              <X size={20} className="hidden sm:block" />
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          {/* Competência: uma linha só — é um título curto
                              ("Comunicação"), não um parágrafo. Como textarea de
                              duas linhas dava a impressão de exigir mais texto do
                              que precisa. */}
                          <div>
                            <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                              <Award className="h-4 w-4 mr-2 text-lime-deep dark:text-lime" />
                              Competência a desenvolver
                            </label>
                            <input
                              type="text"
                              className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                              placeholder="Ex.: Comunicação, Liderança, Gestão de projetos"
                              value={item.competencia}
                              onChange={(e) =>
                                !readOnly &&
                                updateActionItem(category, item.id, 'competencia', e.target.value)
                              }
                              disabled={readOnly}
                              readOnly={readOnly}
                            />
                          </div>

                          {/* Os dois textos longos lado a lado: "como" e "para
                              quê" são a mesma decisão vista de dois ângulos, e
                              empilhados faziam o card virar uma coluna sem fim. */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                                <Lightbulb className="h-4 w-4 mr-2 text-lime-deep dark:text-lime" />
                                Como desenvolver
                              </label>
                              <textarea
                                className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm disabled:opacity-75 disabled:cursor-not-allowed resize-none"
                                rows={3}
                                placeholder="Que ações, práticas ou estudos levam a essa competência?"
                                value={item.comoDesenvolver}
                                onChange={(e) =>
                                  !readOnly &&
                                  updateActionItem(
                                    category,
                                    item.id,
                                    'comoDesenvolver',
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                readOnly={readOnly}
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                                <Target className="h-4 w-4 mr-2 text-lime-deep dark:text-lime" />
                                Resultados esperados
                              </label>
                              <textarea
                                className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm disabled:opacity-75 disabled:cursor-not-allowed resize-none"
                                rows={3}
                                placeholder="O que muda no dia a dia quando essa competência estiver desenvolvida?"
                                value={item.resultadosEsperados}
                                onChange={(e) =>
                                  !readOnly &&
                                  updateActionItem(
                                    category,
                                    item.id,
                                    'resultadosEsperados',
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                readOnly={readOnly}
                              />
                            </div>
                          </div>

                          {/* Material de apoio: fica logo abaixo do "como
                              desenvolver" porque é a mesma pergunta respondida de
                              forma concreta — o link do vídeo, livro ou curso que
                              materializa o que foi descrito acima.

                              Quando o material é um curso do catálogo, concluí-lo
                              marca a ação como concluída sozinha. */}
                          {onActionExtraChange &&
                            !readOnly &&
                            (() => {
                              const extra = actionExtras?.[item.id];
                              const temMaterial = !!(extra?.course_id || extra?.course_url);
                              const editando = cursoEditando[item.id] || temMaterial;
                              const nomeMaterial = extra?.course_id
                                ? courseOptions.find((c) => c.id === extra.course_id)?.title
                                : extra?.course_url_title || extra?.course_url;

                              const limparMaterial = () => {
                                onActionExtraChange(item.id, 'course_id', null);
                                onActionExtraChange(item.id, 'course_url', null);
                                onActionExtraChange(item.id, 'course_url_title', null);
                                setCursoEditando((prev) => ({ ...prev, [item.id]: false }));
                              };

                              return (
                                <div>
                                  {!editando ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        icon={<BookOpen size={16} />}
                                        onClick={() =>
                                          setCursoEditando((prev) => ({ ...prev, [item.id]: true }))
                                        }
                                      >
                                        Indicar material de apoio
                                      </Button>
                                      <span className="text-xs text-muted-foreground">
                                        curso, vídeo, livro, artigo...
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="space-y-3 bg-background/60 rounded-xl p-3 border border-border">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                                          <BookOpen className="h-4 w-4 text-lime-deep dark:text-lime" />
                                          Material de apoio
                                          {nomeMaterial ? `: ${nomeMaterial}` : ''}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={limparMaterial}
                                          className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                          remover
                                        </button>
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                                          Link do material
                                        </label>
                                        <input
                                          type="url"
                                          placeholder="https://... (vídeo, artigo, página do livro)"
                                          className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm"
                                          value={extra?.course_url || ''}
                                          onChange={(e) =>
                                            onActionExtraChange(
                                              item.id,
                                              'course_url',
                                              e.target.value || null,
                                            )
                                          }
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                                          Nome do material
                                        </label>
                                        <input
                                          type="text"
                                          placeholder="Ex.: livro Comunicação não-violenta"
                                          className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm"
                                          value={extra?.course_url_title || ''}
                                          onChange={(e) =>
                                            onActionExtraChange(
                                              item.id,
                                              'course_url_title',
                                              e.target.value || null,
                                            )
                                          }
                                        />
                                      </div>

                                      {courseOptions.length > 0 && (
                                        <div>
                                          <label className="block text-xs font-medium text-muted-foreground mb-1">
                                            Ou um curso já cadastrado no Aprendizado
                                          </label>
                                          <select
                                            className="w-full rounded-xl border border-border bg-secondary text-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm"
                                            value={extra?.course_id || ''}
                                            onChange={(e) =>
                                              onActionExtraChange(
                                                item.id,
                                                'course_id',
                                                e.target.value || null,
                                              )
                                            }
                                          >
                                            <option value="">Nenhum</option>
                                            {courseOptions.map((c) => (
                                              <option key={c.id} value={c.id}>
                                                {c.title}
                                              </option>
                                            ))}
                                          </select>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Só nesse caso a ação é concluída sozinha quando o
                                            colaborador termina o curso.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}

                          {/* Acompanhamento: quando, como está e o que anotar.
                              Separado do conteúdo da ação (o que desenvolver e
                              como) porque muda em outro momento — o conteúdo se
                              escreve uma vez, isto se revisita. */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border">
                            {/* Calendarização */}
                            <div>
                              <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                                Quando (mês/ano)
                              </label>
                              <input
                                type="month"
                                className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                value={item.calendarizacao}
                                onChange={(e) =>
                                  !readOnly &&
                                  updateActionItem(
                                    category,
                                    item.id,
                                    'calendarizacao',
                                    e.target.value,
                                  )
                                }
                                disabled={readOnly}
                                readOnly={readOnly}
                              />
                            </div>

                            {/* Status */}
                            <div>
                              <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                                <CheckCircle className="h-4 w-4 mr-2 text-lime-deep dark:text-lime" />
                                Status
                              </label>
                              <select
                                className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                                value={item.status}
                                onChange={(e) =>
                                  !readOnly &&
                                  updateActionItem(
                                    category,
                                    item.id,
                                    'status',
                                    e.target.value as any,
                                  )
                                }
                                disabled={readOnly}
                              >
                                {statusOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Observação */}
                            <div className="sm:col-span-2 lg:col-span-2">
                              <label className="block text-xs font-semibold text-foreground/70 mb-1.5 flex items-center">
                                <MessageSquare className="h-4 w-4 mr-2 text-muted-foreground" />
                                Observação
                              </label>
                              <textarea
                                className="w-full rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-[#D2FF00] focus:ring-2 focus:ring-[#D2FF00]/20 transition-colors py-2 px-3 text-sm disabled:opacity-75 disabled:cursor-not-allowed resize-none"
                                rows={2}
                                placeholder="Observações adicionais..."
                                value={item.observacao}
                                onChange={(e) =>
                                  !readOnly &&
                                  updateActionItem(category, item.id, 'observacao', e.target.value)
                                }
                                disabled={readOnly}
                                readOnly={readOnly}
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {/* Botão Adicionar Novo Item - Only show in edit mode */}
                    {!readOnly && (
                      <div className="flex justify-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => addEmptyPdiItem(prazo)}
                          icon={<Plus size={16} />}
                          className="border-2 border-dashed hover:border-solid"
                          size="sm"
                        >
                          Adicionar Novo Item
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      {currentStep === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-4"
        >
          {/* Avaliação de Potencial */}
          <div className="space-y-4 sm:space-y-6">
            {potentialItems.map((item, index) => {
              const iconMap: { [key: string]: React.ElementType } = {
                pot1: Rocket,
                pot2: BookOpen,
                pot3: Award,
                pot4: Target,
              };
              const IconComponent = iconMap[item.id] || Target;

              const colorMap: { [key: string]: any } = {
                pot1: {
                  gradient: '',
                  darkGradient: '',
                  bgColor: 'bg-secondary',
                  darkBgColor: '',
                  borderColor: 'border-border',
                  darkBorderColor: '',
                },
                pot2: {
                  gradient: '',
                  darkGradient: '',
                  bgColor: 'bg-secondary',
                  darkBgColor: '',
                  borderColor: 'border-border',
                  darkBorderColor: '',
                },
                pot3: {
                  gradient: '',
                  darkGradient: '',
                  bgColor: 'bg-secondary',
                  darkBgColor: '',
                  borderColor: 'border-border',
                  darkBorderColor: '',
                },
                pot4: {
                  gradient: '',
                  darkGradient: '',
                  bgColor: 'bg-secondary',
                  darkBgColor: '',
                  borderColor: 'border-border',
                  darkBorderColor: '',
                },
              };

              const colors = colorMap[item.id] || colorMap['pot1'];

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="bg-card rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-border overflow-hidden"
                >
                  <div
                    className={`p-4 sm:p-6 ${colors.bgColor} ${colors.darkBgColor} border-b ${colors.borderColor} ${colors.darkBorderColor}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4">
                      <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-lime shadow-md dark:shadow-lg flex-shrink-0 self-start">
                        <IconComponent className="h-5 w-5 sm:h-6 sm:w-6 text-obsidian" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold text-foreground break-words">
                            {index + 1}. {item.name}
                          </h3>
                          {item.score && (
                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getRatingInfo(item.score).color} ${getRatingInfo(item.score).darkColor} text-white self-start sm:self-auto`}
                            >
                              {getRatingInfo(item.score).label}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground mt-2">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    {readOnly && item.score ? (
                      // Visualização estática - apenas mostra a nota
                      <div className="bg-secondary border-2 border-border rounded-xl p-6">
                        <div className="text-center">
                          <div
                            className={`text-5xl font-bold mb-2 ${getRatingInfo(item.score).color.replace('bg-', 'text-')}`}
                          >
                            {item.score}
                          </div>
                          <div className="text-sm font-medium text-muted-foreground">
                            {getRatingInfo(item.score).label}
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Modo de edição - botões clicáveis
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                        {[1, 2, 3, 4].map((rating) => {
                          const ratingInfo =
                            potentialRatingLabels[rating as keyof typeof potentialRatingLabels];
                          return (
                            <button
                              key={rating}
                              onClick={() => handlePotentialScoreChange(item.id, rating)}
                              className={`py-3 sm:py-4 px-2 sm:px-4 rounded-xl border-2 transition-all duration-200 ${
                                item.score === rating
                                  ? `${ratingInfo.color} ${ratingInfo.darkColor} text-white border-transparent shadow-lg transform scale-105`
                                  : 'border-border hover:border-lime hover:bg-accent bg-card text-muted-foreground'
                              }`}
                            >
                              <div className="text-center">
                                <div className="text-xl sm:text-2xl font-bold mb-1">{rating}</div>
                                <div className="text-xs">{ratingInfo.label}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Resumo do Score de Potencial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-xl sm:rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 sm:p-6 lg:p-8"
          >
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6 flex items-center">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-lime-deep dark:text-lime" />
              Análise de Potencial
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Média Geral</h4>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {calculatePotentialScores().final}
                </p>
                <div className="w-full bg-secondary rounded-full h-2 mt-3">
                  <div
                    className="bg-lime h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(calculatePotentialScores().final / 4) * 100}%` }}
                  />
                </div>
              </div>

              <div className="bg-card p-4 sm:p-6 rounded-lg sm:rounded-xl border border-border">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  Critérios Avaliados
                </h4>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  {potentialItems.filter((c) => c.score).length}/{potentialItems.length}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {potentialItems.filter((c) => c.score).length === potentialItems.length
                    ? 'Avaliação completa'
                    : 'Em andamento'}
                </p>
              </div>

              <div className="bg-lime text-obsidian p-4 sm:p-6 rounded-lg sm:rounded-xl sm:col-span-2 lg:col-span-1">
                <h4 className="text-sm font-medium text-obsidian/70 mb-2">Classificação</h4>
                <p className="text-xl sm:text-2xl font-bold break-words">
                  {calculatePotentialScores().final >= 3.5
                    ? 'Alto Potencial'
                    : calculatePotentialScores().final >= 2.5
                      ? 'Potencial Médio'
                      : calculatePotentialScores().final >= 1.5
                        ? 'Potencial em Desenvolvimento'
                        : 'Necessita Desenvolvimento'}
                </p>
                <p className="text-xs text-obsidian/70 mt-2">Baseado na média das avaliações</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
          >
            <div className="flex items-center space-x-2 text-sm">
              {potentialItems.some((item) => item.score === undefined) ? (
                <>
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0" />
                  <span className="text-muted-foreground">
                    Complete todas as avaliações de potencial para prosseguir
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                  <span className="text-success font-medium">
                    Avaliação de potencial completa! Prossiga para o PDI.
                  </span>
                </>
              )}
            </div>

            {!hideActionButtons && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  icon={<ArrowLeft size={18} />}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleNextStep}
                  icon={<ArrowRight size={18} />}
                  size="lg"
                  disabled={!canProceedToStep3()}
                  className="w-full sm:w-auto"
                >
                  Próxima Etapa
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-6"
        >
          {categories.map((category, index) => (
            <motion.div
              key={category.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              {renderActionItems(category.key)}
            </motion.div>
          ))}
        </motion.div>
      )}

      {currentStep === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0"
        >
          <div className="flex items-center space-x-2 text-sm">
            {pdiData.curtosPrazos.length === 0 &&
            pdiData.mediosPrazos.length === 0 &&
            pdiData.longosPrazos.length === 0 ? (
              <>
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-warning flex-shrink-0" />
                <span className="text-muted-foreground">
                  Adicione pelo menos um item de desenvolvimento para continuar
                </span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-success flex-shrink-0" />
                <span className="text-success font-medium">
                  PDI definido! Total de{' '}
                  {pdiData.curtosPrazos.length +
                    pdiData.mediosPrazos.length +
                    pdiData.longosPrazos.length}{' '}
                  itens adicionados.
                </span>
              </>
            )}
          </div>

          <div className="space-y-4">
            {totalPdiItems === 0 && (
              <div className="flex items-center justify-center space-x-2 text-warning text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Adicione pelo menos um item ao PDI para enviar a avaliação</span>
              </div>
            )}
            {!hideActionButtons && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousStep}
                  icon={<ArrowLeft size={18} />}
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Voltar
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  icon={<Send size={18} />}
                  size="lg"
                  disabled={totalPdiItems === 0 || isSaving || loading}
                  className="w-full sm:w-auto"
                  title={
                    totalPdiItems === 0 ? 'Adicione pelo menos um item ao PDI' : 'Enviar avaliação'
                  }
                >
                  {isSaving ? 'Enviando...' : 'Enviar Avaliação'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </>
  );
};

export default PotentialAndPDI;
