import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import {
  ScrollText,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Filter,
} from 'lucide-react';
import Button from '../../components/Button';
import { auditApiService, AuditLogEntry, AuditListFilters } from '../../services/audit.service';
import { sanitizeSheetData } from '../../utils/exportSafety';

const ENTITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '', label: 'Todas as entidades' },
  { value: 'users', label: 'Usuários' },
  { value: 'evaluation_cycles', label: 'Ciclos de avaliação' },
  { value: 'self_evaluations', label: 'Autoavaliações' },
  { value: 'leader_evaluations', label: 'Avaliações do líder' },
  { value: 'consensus_evaluations', label: 'Consenso / Nine Box' },
  { value: 'development_plans', label: 'PDI' },
  { value: 'progression_history', label: 'Progressões salariais' },
  { value: 'job_candidates', label: 'Candidatos' },
  { value: 'satisfaction_surveys', label: 'Pesquisas' },
];

const ACTION_LABELS: Record<string, string> = {
  'user.created': 'Usuário criado',
  'user.updated': 'Usuário alterado',
  'user.deleted': 'Usuário excluído',
  'user.password_reset': 'Senha redefinida',
  'cycle.opened': 'Ciclo aberto',
  'cycle.closed': 'Ciclo encerrado',
  'cycle.auto_closed': 'Ciclo encerrado (automático)',
  'consensus.created': 'Consenso registrado',
  'consensus.deliberations_saved': 'Deliberações salvas',
  'ninebox.promoted': 'Nine Box promovido',
  'pdi.saved': 'PDI salvo',
  'salary.progression': 'Progressão salarial',
  'candidate.hired': 'Candidato contratado',
  'survey.auto_closed': 'Pesquisa encerrada (automático)',
  insert: 'Registro criado (direto)',
  update: 'Registro alterado (direto)',
  delete: 'Registro excluído (direto)',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const AuditLog = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<{
    table_name: string;
    search: string;
    from: string;
    to: string;
  }>({ table_name: '', search: '', from: '', to: '' });

  const buildFilters = useCallback(
    (pageNum: number, limit?: number): AuditListFilters => ({
      page: pageNum,
      limit,
      table_name: filters.table_name || undefined,
      search: filters.search || undefined,
      from: filters.from ? new Date(`${filters.from}T00:00:00`).toISOString() : undefined,
      to: filters.to ? new Date(`${filters.to}T23:59:59`).toISOString() : undefined,
    }),
    [filters],
  );

  const load = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      try {
        const result = await auditApiService.list(buildFilters(pageNum));
        setEntries(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(result.page);
      } catch {
        toast.error('Erro ao carregar a trilha de auditoria');
      } finally {
        setLoading(false);
      }
    },
    [buildFilters],
  );

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => load(1);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Exporta até 1000 registros do filtro atual
      const pages: AuditLogEntry[] = [];
      for (let p = 1; p <= 10; p++) {
        const result = await auditApiService.list(buildFilters(p, 100));
        pages.push(...result.data);
        if (p >= result.totalPages) break;
      }

      const rows = pages.map((e) => ({
        'Data/Hora': formatDateTime(e.created_at),
        Ação: ACTION_LABELS[e.action] || e.action,
        Entidade: e.table_name,
        Registro: e.record_id || '',
        Ator: e.actor_name || e.actor_email || 'sistema',
        'E-mail': e.actor_email || '',
        Antes: e.old_data ? JSON.stringify(e.old_data) : '',
        Depois: e.new_data ? JSON.stringify(e.new_data) : '',
        'Request ID': e.request_id || '',
        IP: e.ip_address || '',
      }));

      const ws = XLSX.utils.json_to_sheet(sanitizeSheetData(rows));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
      XLSX.writeFile(wb, `auditoria_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${rows.length} registros exportados`);
    } catch {
      toast.error('Erro ao exportar');
    } finally {
      setExporting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-border p-4 md:p-8">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-start md:space-y-0">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center flex-wrap">
              <ScrollText className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-lime-deep dark:text-lime mr-2 sm:mr-3 flex-shrink-0" />
              <span className="break-words">Auditoria</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">
              Trilha de ações críticas do sistema · {total} registros no filtro atual
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={exporting || loading || entries.length === 0}
            icon={exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download size={16} />}
          >
            Exportar XLSX
          </Button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
          <select
            value={filters.table_name}
            onChange={(e) => setFilters((f) => ({ ...f, table_name: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
          >
            {ENTITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              placeholder="E-mail do ator..."
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
            />
          </div>

          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            className="px-3 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:ring-2 focus:ring-[#D2FF00]/20 focus:border-[#D2FF00]"
          />

          <Button variant="primary" onClick={handleApplyFilters} icon={<Filter size={16} />}>
            Filtrar
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl md:rounded-2xl shadow-sm dark:shadow-lg border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Carregando...
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">
            Nenhum registro de auditoria para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50 text-left">
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Data/Hora</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Ação</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Entidade</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground">Ator</th>
                  <th className="px-4 py-3 font-semibold text-muted-foreground w-10" />
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => {
                  const expanded = expandedId === entry.id;
                  const hasDetails = !!(entry.old_data || entry.new_data || entry.request_id);
                  return (
                    <>
                      <tr
                        key={entry.id}
                        onClick={() => hasDetails && setExpandedId(expanded ? null : entry.id)}
                        className={`border-b border-border/60 ${
                          hasDetails ? 'cursor-pointer hover:bg-accent/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {formatDateTime(entry.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            {ACTION_LABELS[entry.action] || entry.action}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{entry.table_name}</td>
                        <td className="px-4 py-3">
                          <span className="text-foreground">
                            {entry.actor_name || entry.actor_email || 'sistema'}
                          </span>
                          {entry.actor_name && entry.actor_email && (
                            <span className="block text-xs text-muted-foreground">
                              {entry.actor_email}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {hasDetails &&
                            (expanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            ))}
                        </td>
                      </tr>
                      {expanded && (
                        <tr key={`${entry.id}-details`} className="border-b border-border/60">
                          <td colSpan={5} className="px-4 py-3 bg-secondary/40">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                              {entry.old_data && (
                                <div>
                                  <p className="font-semibold text-muted-foreground mb-1">Antes</p>
                                  <pre className="bg-background border border-border rounded-lg p-3 overflow-x-auto text-foreground">
                                    {JSON.stringify(entry.old_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                              {entry.new_data && (
                                <div>
                                  <p className="font-semibold text-muted-foreground mb-1">Depois</p>
                                  <pre className="bg-background border border-border rounded-lg p-3 overflow-x-auto text-foreground">
                                    {JSON.stringify(entry.new_data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                              {entry.record_id && <span>Registro: {entry.record_id}</span>}
                              {entry.request_id && <span>Request: {entry.request_id}</span>}
                              {entry.ip_address && <span>IP: {entry.ip_address}</span>}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginação */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Página {page} de {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                icon={<ChevronLeft size={14} />}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => load(page + 1)}
                icon={<ChevronRight size={14} />}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AuditLog;
