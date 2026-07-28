import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../lib/logger';

const auditLogger = logger.child({ module: 'audit' });

export interface AuditChanges {
  /** Estado anterior (apenas os campos relevantes — evitar despejar a linha inteira com dados sensíveis desnecessários). */
  old?: Record<string, unknown> | null;
  /** Estado novo. */
  new?: Record<string, unknown> | null;
}

/**
 * Trilha de auditoria (fase 2 do roadmap). Convenção de `action`:
 * "<entidade>.<verbo>" em snake_case — ex.: user.role_changed, cycle.opened,
 * salary.progression, consensus.created, ninebox.promoted, pdi.saved.
 *
 * Toda gravação é fire-and-forget: auditoria nunca falha a operação principal.
 */
export const auditService = {
  /** Audita uma ação disparada por um request autenticado. */
  log(
    req: AuthRequest,
    action: string,
    tableName: string,
    recordId: string | null,
    changes?: AuditChanges,
  ): void {
    void this.write({
      user_id: req.user?.id ?? null,
      actor_email: req.user?.email ?? null,
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: changes?.old ?? null,
      new_data: changes?.new ?? null,
      request_id: (req as any).id ?? null,
      ip_address: req.ip ?? null,
      user_agent: (req.headers?.['user-agent'] as string) ?? null,
    });
  },

  /** Audita uma ação de sistema (jobs, encerramentos automáticos). */
  logSystem(
    action: string,
    tableName: string,
    recordId: string | null,
    changes?: AuditChanges,
  ): void {
    void this.write({
      user_id: null,
      actor_email: 'system',
      action,
      table_name: tableName,
      record_id: recordId,
      old_data: changes?.old ?? null,
      new_data: changes?.new ?? null,
      request_id: null,
      ip_address: null,
      user_agent: 'jobs',
    });
  },

  async write(row: Record<string, unknown>): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({ ...row, created_at: new Date().toISOString() } as any);
      if (error) {
        auditLogger.warn({ err: error.message, action: row.action }, 'Falha ao gravar auditoria');
      }
    } catch (error: any) {
      auditLogger.warn({ err: error?.message, action: row.action }, 'Falha ao gravar auditoria');
    }
  },

  /** Consulta paginada com filtros (admin/director). */
  async list(options: {
    page?: number;
    limit?: number;
    action?: string;
    tableName?: string;
    userId?: string;
    search?: string;
    from?: string;
    to?: string;
  }) {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 25, 100);
    const rangeFrom = (page - 1) * limit;
    const rangeTo = rangeFrom + limit - 1;

    // Sem join embutido: a FK de user_id não é garantida no schema legado.
    let query = supabaseAdmin.from('audit_logs').select('*', { count: 'exact' });

    if (options.action) query = query.ilike('action', `%${options.action}%`);
    if (options.tableName) query = query.eq('table_name', options.tableName);
    if (options.userId) query = query.eq('user_id', options.userId);
    if (options.search) query = query.ilike('actor_email', `%${options.search}%`);
    if (options.from) query = query.gte('created_at', options.from);
    if (options.to) query = query.lte('created_at', options.to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(rangeFrom, rangeTo);

    if (error) {
      throw new Error(`Erro ao consultar auditoria: ${error.message}`);
    }

    // Resolve nomes dos atores em lote
    const rows = data || [];
    const actorIds = Array.from(new Set(rows.map((r: any) => r.user_id).filter(Boolean)));
    const actorNames = new Map<string, string>();
    if (actorIds.length > 0) {
      const { data: actors } = await supabaseAdmin
        .from('users')
        .select('id, name')
        .in('id', actorIds);
      (actors || []).forEach((a: any) => actorNames.set(a.id, a.name));
    }

    const enriched = rows.map((r: any) => ({
      ...r,
      actor_name: r.user_id ? actorNames.get(r.user_id) || null : null,
    }));

    const total = count || 0;
    return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /** Expurgo: remove registros além da retenção (24 meses). Usado pelo job mensal. */
  async purgeOldEntries(retentionMonths = 24): Promise<void> {
    const threshold = new Date();
    threshold.setMonth(threshold.getMonth() - retentionMonths);

    const { error } = await supabaseAdmin
      .from('audit_logs')
      .delete()
      .lt('created_at', threshold.toISOString());

    if (error) {
      auditLogger.error({ err: error.message }, 'Falha no expurgo da auditoria');
    } else {
      auditLogger.info({ retentionMonths }, 'Expurgo da auditoria concluído');
    }
  },
};
