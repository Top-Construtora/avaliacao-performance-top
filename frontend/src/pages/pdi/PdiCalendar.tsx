import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  User,
  Target,
} from 'lucide-react';
import { api } from '../../config/api';
import LoadingSpinner from '../../components/LoadingSpinner';

interface PdiItem {
  id: string;
  competencia: string;
  calendarizacao: string;
  comoDesenvolver: string;
  resultadosEsperados: string;
  status: '1' | '2' | '3' | '4' | '5';
  observacao: string;
  prazo: 'curto' | 'medio' | 'longo';
}

interface PdiRecord {
  id: string;
  employee_id: string;
  status: string;
  items: PdiItem[];
  periodo: string;
  timeline: string;
  created_at: string;
  updated_at: string;
  employee?: {
    id: string;
    name: string;
    email: string;
    position: string;
    department_id: string;
  };
}

interface CalendarEvent {
  date: string;
  employeeName: string;
  employeePosition: string;
  competencia: string;
  prazo: 'curto' | 'medio' | 'longo';
  status: string;
  pdiId: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  '1': { label: 'Não Iniciado', color: 'bg-gray-100 dark:bg-yt-elevated text-gray-700 dark:text-gray-300 border-gray-200 dark:border-yt-border', icon: Clock },
  '2': { label: 'Em Andamento', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700', icon: AlertCircle },
  '3': { label: 'Em Progresso', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700', icon: AlertCircle },
  '4': { label: 'Concluído', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700', icon: CheckCircle },
  '5': { label: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700', icon: XCircle },
};

const PRAZO_LABELS: Record<string, { label: string; color: string }> = {
  curto: { label: 'Curto', color: 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300' },
  medio: { label: 'Médio', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
  longo: { label: 'Longo', color: 'bg-stone-100 dark:bg-stone-900/30 text-stone-700 dark:text-stone-300' },
};

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS_PT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const PdiCalendar = () => {
  const [pdis, setPdis] = useState<PdiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadPdis();
  }, []);

  const loadPdis = async () => {
    try {
      setLoading(true);
      const response = await api.get('/pdi/all');
      setPdis(response.data || response || []);
    } catch (error) {
      toast.error('Erro ao carregar PDIs');
    } finally {
      setLoading(false);
    }
  };

  // Extrair eventos do calendário dos items dos PDIs
  const calendarEvents = useMemo(() => {
    const events: CalendarEvent[] = [];

    pdis.forEach(pdi => {
      if (!pdi.items || !Array.isArray(pdi.items)) return;

      pdi.items.forEach(item => {
        if (!item.calendarizacao) return;

        // Tentar parsear a data
        let dateStr = item.calendarizacao;
        // Normalizar formatos comuns: "2025-03-15", "15/03/2025", etc
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            dateStr = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }

        // Verificar se é uma data válida
        const parsed = new Date(dateStr);
        if (isNaN(parsed.getTime())) return;

        const formattedDate = parsed.toISOString().split('T')[0];

        if (statusFilter !== 'all' && item.status !== statusFilter) return;

        events.push({
          date: formattedDate,
          employeeName: pdi.employee?.name || 'Colaborador',
          employeePosition: pdi.employee?.position || '',
          competencia: item.competencia,
          prazo: item.prazo,
          status: item.status,
          pdiId: pdi.id,
        });
      });
    });

    return events;
  }, [pdis, statusFilter]);

  // Gerar dias do mês
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: { date: Date; isCurrentMonth: boolean }[] = [];

    // Dias do mês anterior para preencher a primeira semana
    const startDayOfWeek = firstDay.getDay();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Dias do mês atual
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true });
    }

    // Dias do próximo mês para completar a última semana
    const remainingDays = 7 - (days.length % 7);
    if (remainingDays < 7) {
      for (let i = 1; i <= remainingDays; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
      }
    }

    return days;
  }, [currentDate]);

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(e => e.date === dateStr);
  };

  const selectedDateEvents = selectedDate
    ? calendarEvents.filter(e => e.date === selectedDate)
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    setSelectedDate(null);
  };

  // Stats
  const stats = useMemo(() => {
    const allItems = pdis.flatMap(p => p.items || []);
    return {
      total: allItems.length,
      notStarted: allItems.filter(i => i.status === '1').length,
      inProgress: allItems.filter(i => ['2', '3'].includes(i.status)).length,
      completed: allItems.filter(i => i.status === '4').length,
      overdue: allItems.filter(i => {
        if (!i.calendarizacao || i.status === '4' || i.status === '5') return false;
        let dateStr = i.calendarizacao;
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        const d = new Date(dateStr);
        return !isNaN(d.getTime()) && d < today;
      }).length,
    };
  }, [pdis]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <CalendarIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-primary-900 dark:text-primary-700 mr-2 sm:mr-3 flex-shrink-0" />
              Calendário de PDI
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
              Visualize os prazos dos planos de desenvolvimento
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-gray-300 font-medium">Total Ações</p>
            </div>
            <Target className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.notStarted}</p>
              <p className="text-sm text-gray-200 font-medium">Não Iniciados</p>
            </div>
            <Clock className="absolute -bottom-2 -right-2 h-16 w-16 text-gray-500 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.inProgress}</p>
              <p className="text-sm text-blue-100 font-medium">Em Andamento</p>
            </div>
            <AlertCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-blue-400 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.completed}</p>
              <p className="text-sm text-green-100 font-medium">Concluídos</p>
            </div>
            <CheckCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-green-400 opacity-50" />
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-xl p-4 text-center shadow-lg">
            <div className="relative z-10">
              <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              <p className="text-sm text-red-100 font-medium">Atrasados</p>
            </div>
            <XCircle className="absolute -bottom-2 -right-2 h-16 w-16 text-red-400 opacity-50" />
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
        >
          {/* Navegação do mês */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
              {MONTHS_PT[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Filtro de status */}
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Filtrar:</span>
            {[
              { value: 'all', label: 'Todos' },
              { value: '1', label: 'Não Iniciado' },
              { value: '2', label: 'Em Andamento' },
              { value: '4', label: 'Concluído' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === opt.value
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-yt-elevated text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS_PT.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Grid do calendário */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ date, isCurrentMonth }, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayEvents = getEventsForDate(date);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDate;
              const hasOverdue = dayEvents.some(e => e.status !== '4' && e.status !== '5' && date < today);

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
                  className={`relative min-h-[60px] sm:min-h-[72px] p-1 rounded-lg border transition-all text-left ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                      : isToday
                        ? 'border-primary-300 dark:border-primary-600 bg-primary-50/50 dark:bg-primary-900/10'
                        : isCurrentMonth
                          ? 'border-gray-100 dark:border-yt-border hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          : 'border-transparent bg-gray-50/50 dark:bg-yt-surface/50'
                  }`}
                >
                  <span className={`text-xs font-medium ${
                    isToday
                      ? 'text-primary-700 dark:text-primary-400 font-bold'
                      : isCurrentMonth
                        ? 'text-gray-700 dark:text-gray-300'
                        : 'text-gray-400 dark:text-gray-600'
                  }`}>
                    {date.getDate()}
                  </span>

                  {dayEvents.length > 0 && (
                    <div className="mt-0.5 space-y-0.5">
                      {dayEvents.slice(0, 2).map((event, i) => {
                        const statusInfo = STATUS_CONFIG[event.status] || STATUS_CONFIG['1'];
                        return (
                          <div
                            key={i}
                            className={`text-[9px] sm:text-[10px] px-1 py-0.5 rounded truncate border ${statusInfo.color}`}
                            title={`${event.employeeName}: ${event.competencia}`}
                          >
                            {event.employeeName.split(' ')[0]}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-gray-500 dark:text-gray-400 text-center font-medium">
                          +{dayEvents.length - 2}
                        </div>
                      )}
                    </div>
                  )}

                  {hasOverdue && (
                    <div className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Painel lateral - detalhes do dia selecionado */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-naue-white dark:bg-yt-surface rounded-2xl shadow-sm border border-naue-border-gray dark:border-yt-border p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
            {selectedDate
              ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })
              : 'Selecione uma data'}
          </h3>

          {!selectedDate && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clique em um dia para ver os detalhes das ações de PDI
              </p>
            </div>
          )}

          {selectedDate && selectedDateEvents.length === 0 && (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Nenhuma ação de PDI para esta data
              </p>
            </div>
          )}

          {selectedDate && selectedDateEvents.length > 0 && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {selectedDateEvents.map((event, index) => {
                const statusInfo = STATUS_CONFIG[event.status] || STATUS_CONFIG['1'];
                const StatusIcon = statusInfo.icon;
                const prazoInfo = PRAZO_LABELS[event.prazo] || PRAZO_LABELS.curto;

                return (
                  <div
                    key={index}
                    className="p-3 rounded-xl bg-gray-50 dark:bg-yt-elevated/50 border border-gray-100 dark:border-yt-border"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {event.employeeName}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo.label}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {event.employeePosition}
                    </p>

                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium mb-2">
                      {event.competencia}
                    </p>

                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${prazoInfo.color}`}>
                      Prazo {prazoInfo.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PdiCalendar;
