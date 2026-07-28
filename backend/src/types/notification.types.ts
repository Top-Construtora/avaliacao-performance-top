export type NotificationType =
  | 'evaluation_cycle_opened'
  | 'evaluation_cycle_closed'
  | 'self_evaluation_pending'
  | 'self_evaluation_completed'
  | 'leader_evaluation_completed'
  | 'consensus_completed'
  | 'pdi_created'
  | 'pdi_updated'
  | 'pdi_deadline_approaching'
  | 'career_progression_approved'
  | 'career_track_assigned'
  | 'job_opening_created'
  | 'candidate_registered'
  | 'interview_scheduled'
  | 'candidate_hired'
  | 'interview_90day_scheduled'
  | 'interview_exit_scheduled'
  | 'interview_completed'
  | 'survey_available'
  | 'survey_deadline_approaching'
  | 'survey_closed'
  | 'team_member_added'
  | 'team_member_moved'
  | 'feedback_received'
  | 'feedback_request_received'
  | 'feedback_acknowledged'
  | 'meeting_scheduled'
  | 'meeting_cancelled';

export type NotificationPriority = 'low' | 'medium' | 'high';

/**
 * Categorias de preferência de e-mail (tabela notification_preferences).
 * Ausência de linha na tabela = e-mail habilitado para a categoria.
 */
export type NotificationCategory =
  | 'avaliacoes'
  | 'pdi'
  | 'pesquisas'
  | 'entrevistas'
  | 'carreira'
  | 'recrutamento'
  | 'equipe'
  | 'feedbacks'
  | 'reunioes';

export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategory, string> = {
  avaliacoes: 'Avaliações de desempenho',
  pdi: 'PDI',
  pesquisas: 'Pesquisas',
  entrevistas: 'Entrevistas',
  carreira: 'Carreira e salários',
  recrutamento: 'Recrutamento',
  equipe: 'Times e equipe',
  feedbacks: 'Feedbacks',
  reunioes: 'Reuniões',
};

export type AntiSpamStrategy = 'always' | 'aggregate' | 'cooldown';

export type DisplayCategory = 'success' | 'info' | 'warning' | 'alert' | 'achievement';

export type RecipientTarget =
  | { type: 'user'; user_id: string }
  | { type: 'role'; role: 'admin' | 'director' | 'leader' }
  | { type: 'team'; team_id: string }
  | { type: 'department'; department_id: string }
  | { type: 'all' };

export interface SendNotificationInput {
  type: NotificationType;
  title: string;
  message: string;
  targets: RecipientTarget[];
  actor_id?: string;
  priority?: NotificationPriority;
  action_url?: string;
  entity_type?: string;
  entity_id?: string;
  group_key?: string;
  anti_spam?: AntiSpamStrategy;
  cooldown_minutes?: number;
  metadata?: Record<string, any>;
}

export const NOTIFICATION_TYPE_CONFIG: Record<
  NotificationType,
  {
    defaultPriority: NotificationPriority;
    displayCategory: DisplayCategory;
    category: NotificationCategory;
    /** Se true, o send() também dispara e-mail (respeitando a preferência do usuário). */
    email: boolean;
  }
> = {
  evaluation_cycle_opened: {
    defaultPriority: 'high',
    displayCategory: 'info',
    category: 'avaliacoes',
    email: true,
  },
  evaluation_cycle_closed: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'avaliacoes',
    email: false,
  },
  self_evaluation_pending: {
    defaultPriority: 'high',
    displayCategory: 'warning',
    category: 'avaliacoes',
    email: true,
  },
  self_evaluation_completed: {
    defaultPriority: 'medium',
    displayCategory: 'success',
    category: 'avaliacoes',
    email: false,
  },
  leader_evaluation_completed: {
    defaultPriority: 'medium',
    displayCategory: 'success',
    category: 'avaliacoes',
    email: false,
  },
  consensus_completed: {
    defaultPriority: 'medium',
    displayCategory: 'success',
    category: 'avaliacoes',
    email: false,
  },
  pdi_created: { defaultPriority: 'medium', displayCategory: 'info', category: 'pdi', email: true },
  pdi_updated: { defaultPriority: 'low', displayCategory: 'info', category: 'pdi', email: false },
  pdi_deadline_approaching: {
    defaultPriority: 'high',
    displayCategory: 'warning',
    category: 'pdi',
    email: true,
  },
  career_progression_approved: {
    defaultPriority: 'high',
    displayCategory: 'achievement',
    category: 'carreira',
    email: true,
  },
  career_track_assigned: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'carreira',
    email: true,
  },
  job_opening_created: {
    defaultPriority: 'low',
    displayCategory: 'info',
    category: 'recrutamento',
    email: false,
  },
  candidate_registered: {
    defaultPriority: 'low',
    displayCategory: 'info',
    category: 'recrutamento',
    email: false,
  },
  interview_scheduled: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'recrutamento',
    email: true,
  },
  candidate_hired: {
    defaultPriority: 'medium',
    displayCategory: 'achievement',
    category: 'recrutamento',
    email: false,
  },
  interview_90day_scheduled: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'entrevistas',
    email: true,
  },
  interview_exit_scheduled: {
    defaultPriority: 'medium',
    displayCategory: 'alert',
    category: 'entrevistas',
    email: true,
  },
  interview_completed: {
    defaultPriority: 'low',
    displayCategory: 'success',
    category: 'entrevistas',
    email: false,
  },
  survey_available: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'pesquisas',
    email: true,
  },
  survey_deadline_approaching: {
    defaultPriority: 'high',
    displayCategory: 'warning',
    category: 'pesquisas',
    email: true,
  },
  survey_closed: {
    defaultPriority: 'low',
    displayCategory: 'info',
    category: 'pesquisas',
    email: false,
  },
  team_member_added: {
    defaultPriority: 'low',
    displayCategory: 'info',
    category: 'equipe',
    email: false,
  },
  team_member_moved: {
    defaultPriority: 'low',
    displayCategory: 'info',
    category: 'equipe',
    email: false,
  },
  feedback_received: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'feedbacks',
    email: true,
  },
  feedback_request_received: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'feedbacks',
    email: true,
  },
  feedback_acknowledged: {
    defaultPriority: 'low',
    displayCategory: 'success',
    category: 'feedbacks',
    email: false,
  },
  meeting_scheduled: {
    defaultPriority: 'medium',
    displayCategory: 'info',
    category: 'reunioes',
    email: true,
  },
  meeting_cancelled: {
    defaultPriority: 'medium',
    displayCategory: 'alert',
    category: 'reunioes',
    email: true,
  },
};
