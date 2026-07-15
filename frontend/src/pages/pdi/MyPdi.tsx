import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BookOpen, Calendar, Info, FileText, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../config/api';
import LoadingSpinner from '../../components/LoadingSpinner';

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

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  '1': { label: 'Não Iniciado', color: 'bg-secondary text-muted-foreground' },
  '2': { label: 'Em Andamento', color: 'bg-warning/15 text-warning' },
  '3': { label: 'Em Progresso', color: 'bg-warning/15 text-warning' },
  '4': { label: 'Concluído', color: 'bg-success/15 text-success' },
  '5': { label: 'Cancelado', color: 'bg-destructive/15 text-destructive' },
};

const MyPdi: React.FC = () => {
  const { user, profile } = useAuth();
  const [pdiData, setPdiData] = useState<PdiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPdi = async () => {
      if (!user?.id && !profile?.id) {
        setLoading(false);
        return;
      }

      const userId = user?.id || profile?.id;

      try {
        setLoading(true);
        // Remover /api do endpoint pois o baseURL já inclui /api
        const response = await api.get(`/pdi/${userId}`);

        if (response.data) {
          const pdi = response.data;

          // Transformar items do backend para o formato do frontend
          // O backend retorna um array 'items', precisamos separar por prazo
          const curtosPrazos: ActionItem[] = [];
          const mediosPrazos: ActionItem[] = [];
          const longosPrazos: ActionItem[] = [];

          if (pdi.items && Array.isArray(pdi.items)) {
            pdi.items.forEach((item: any) => {
              if (item.prazo === 'curto') {
                curtosPrazos.push(item);
              } else if (item.prazo === 'medio') {
                mediosPrazos.push(item);
              } else if (item.prazo === 'longo') {
                longosPrazos.push(item);
              }
            });
          }

          setPdiData({
            id: pdi.id,
            colaboradorId: pdi.employee_id || userId,
            colaborador: pdi.employee?.name || profile?.name || user?.name || 'N/A',
            cargo: pdi.employee?.position || profile?.position || 'N/A',
            departamento: pdi.employee?.department || 'N/A',
            periodo: pdi.periodo || pdi.timeline || 'N/A',
            nineBoxQuadrante: pdi.nineBoxQuadrante,
            nineBoxDescricao: pdi.nineBoxDescricao,
            curtosPrazos,
            mediosPrazos,
            longosPrazos,
            dataCriacao: pdi.created_at,
            dataAtualizacao: pdi.updated_at,
          });
        } else {
          toast('Você ainda não possui um PDI cadastrado.', { icon: 'ℹ️' });
        }
      } catch (error: any) {
        console.error('Erro ao carregar PDI:', error);
        if (error.response?.status === 404) {
          toast('Você ainda não possui um PDI cadastrado.', { icon: 'ℹ️' });
        } else {
          toast.error('Erro ao carregar PDI.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPdi();
  }, [user, profile]);

  const renderActionItems = (items: ActionItem[], prazo: string) => {
    if (items.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Nenhum item cadastrado para este prazo.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-md dark:shadow-lg border border-border"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-semibold text-foreground mb-2 break-words">
                  {item.competencia}
                </h4>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_LABELS[item.status]?.color || 'bg-secondary text-muted-foreground'}`}
                  >
                    {STATUS_LABELS[item.status]?.label || 'Desconhecido'}
                  </span>
                  {item.calendarizacao && (
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {item.calendarizacao}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                  <Target className="h-4 w-4 mr-1" />
                  Como Desenvolver
                </label>
                <p className="text-muted-foreground text-sm bg-secondary p-3 rounded-lg">
                  {item.comoDesenvolver}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Resultados Esperados
                </label>
                <p className="text-muted-foreground text-sm bg-secondary p-3 rounded-lg">
                  {item.resultadosEsperados}
                </p>
              </div>

              {item.observacao && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center mb-1">
                    <FileText className="h-4 w-4 mr-1" />
                    Observações
                  </label>
                  <p className="text-muted-foreground text-sm bg-secondary p-3 rounded-lg">
                    {item.observacao}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPdiSection = (
    title: string,
    items: ActionItem[] | undefined,
    sectionKey: 'curto' | 'medio' | 'longo',
    icon: React.ReactNode,
    iconBgClass: string,
  ) => {
    // Garantir que items é sempre um array
    const safeItems = items || [];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border overflow-hidden"
      >
        <div className="p-4 sm:p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center justify-center h-10 w-10 rounded-lg ${iconBgClass} text-obsidian`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground">
                {safeItems.length} {safeItems.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6">{renderActionItems(safeItems, sectionKey)}</div>
      </motion.div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!pdiData) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-4 sm:p-8"
        >
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-lime-deep dark:text-lime mr-3" />
                Meu PDI
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Plano de Desenvolvimento Individual
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-8 sm:p-16 text-center"
        >
          <div className="max-w-md mx-auto">
            <div className="mx-auto flex items-center justify-center h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-secondary mb-6">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-lime-deep dark:text-lime" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
              Nenhum PDI encontrado
            </h3>
            <p className="text-muted-foreground text-sm sm:text-base">
              Você ainda não possui um Plano de Desenvolvimento Individual cadastrado. Entre em
              contato com seu líder ou gestor.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl shadow-sm hover:shadow-md dark:shadow-lg border border-border p-4 sm:p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center">
                <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-lime-deep dark:text-lime mr-3" />
                Meu PDI
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Plano de Desenvolvimento Individual
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Info className="inline h-4 w-4 mr-1" />
              Colaborador
            </label>
            <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm break-words">
              {pdiData.colaborador || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Target className="inline h-4 w-4 mr-1" />
              Cargo
            </label>
            <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm break-words">
              {pdiData.cargo || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Período
            </label>
            <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm break-words">
              {pdiData.periodo || 'N/A'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              <Info className="inline h-4 w-4 mr-1" />
              Última Atualização
            </label>
            <div className="px-4 py-3 bg-secondary rounded-xl text-foreground font-medium text-sm break-words">
              {pdiData.dataAtualizacao
                ? new Date(pdiData.dataAtualizacao).toLocaleDateString('pt-BR')
                : 'N/A'}
            </div>
          </div>
        </div>

        {pdiData.nineBoxQuadrante && (
          <div className="mt-4 p-4 bg-lime/10 rounded-xl border border-lime/30">
            <h3 className="text-sm font-semibold text-lime-deep dark:text-lime mb-1">
              Nine Box: {pdiData.nineBoxQuadrante}
            </h3>
            {pdiData.nineBoxDescricao && (
              <p className="text-sm text-muted-foreground">{pdiData.nineBoxDescricao}</p>
            )}
          </div>
        )}
      </motion.div>

      {/* PDI Sections */}
      <div className="space-y-4 sm:space-y-6">
        {renderPdiSection(
          'Curto Prazo',
          pdiData.curtosPrazos,
          'curto',
          <Target className="h-5 w-5" />,
          'bg-lime',
        )}

        {renderPdiSection(
          'Médio Prazo',
          pdiData.mediosPrazos,
          'medio',
          <TrendingUp className="h-5 w-5" />,
          'bg-lime',
        )}

        {renderPdiSection(
          'Longo Prazo',
          pdiData.longosPrazos,
          'longo',
          <BookOpen className="h-5 w-5" />,
          'bg-lime',
        )}
      </div>
    </div>
  );
};

export default MyPdi;
