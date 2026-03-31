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
  | 'team_member_moved';

export type NotificationPriority = 'low' | 'medium' | 'high';

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

export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, {
  defaultPriority: NotificationPriority;
  displayCategory: DisplayCategory;
}> = {
  evaluation_cycle_opened:      { defaultPriority: 'high',   displayCategory: 'info' },
  evaluation_cycle_closed:      { defaultPriority: 'medium', displayCategory: 'info' },
  self_evaluation_pending:      { defaultPriority: 'high',   displayCategory: 'warning' },
  self_evaluation_completed:    { defaultPriority: 'medium', displayCategory: 'success' },
  leader_evaluation_completed:  { defaultPriority: 'medium', displayCategory: 'success' },
  consensus_completed:          { defaultPriority: 'medium', displayCategory: 'success' },
  pdi_created:                  { defaultPriority: 'medium', displayCategory: 'info' },
  pdi_updated:                  { defaultPriority: 'low',    displayCategory: 'info' },
  pdi_deadline_approaching:     { defaultPriority: 'high',   displayCategory: 'warning' },
  career_progression_approved:  { defaultPriority: 'high',   displayCategory: 'achievement' },
  career_track_assigned:        { defaultPriority: 'medium', displayCategory: 'info' },
  job_opening_created:          { defaultPriority: 'low',    displayCategory: 'info' },
  candidate_registered:         { defaultPriority: 'low',    displayCategory: 'info' },
  interview_scheduled:          { defaultPriority: 'medium', displayCategory: 'info' },
  candidate_hired:              { defaultPriority: 'medium', displayCategory: 'achievement' },
  interview_90day_scheduled:    { defaultPriority: 'medium', displayCategory: 'info' },
  interview_exit_scheduled:     { defaultPriority: 'medium', displayCategory: 'alert' },
  interview_completed:          { defaultPriority: 'low',    displayCategory: 'success' },
  survey_available:             { defaultPriority: 'medium', displayCategory: 'info' },
  survey_deadline_approaching:  { defaultPriority: 'high',   displayCategory: 'warning' },
  survey_closed:                { defaultPriority: 'low',    displayCategory: 'info' },
  team_member_added:            { defaultPriority: 'low',    displayCategory: 'info' },
  team_member_moved:            { defaultPriority: 'low',    displayCategory: 'info' },
};
