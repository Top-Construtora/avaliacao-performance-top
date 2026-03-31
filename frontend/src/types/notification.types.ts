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

export type DisplayCategory = 'success' | 'info' | 'warning' | 'alert' | 'achievement';

export interface Notification {
  id: string;
  type: NotificationType;
  displayCategory: DisplayCategory;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  action_url: string | null;
  actor_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any>;
  read: boolean;
  archived: boolean;
  created_at: string;
  read_at: string | null;
}

export const NOTIFICATION_DISPLAY_MAP: Record<NotificationType, DisplayCategory> = {
  evaluation_cycle_opened:      'info',
  evaluation_cycle_closed:      'info',
  self_evaluation_pending:      'warning',
  self_evaluation_completed:    'success',
  leader_evaluation_completed:  'success',
  consensus_completed:          'success',
  pdi_created:                  'info',
  pdi_updated:                  'info',
  pdi_deadline_approaching:     'warning',
  career_progression_approved:  'achievement',
  career_track_assigned:        'info',
  job_opening_created:          'info',
  candidate_registered:         'info',
  interview_scheduled:          'info',
  candidate_hired:              'achievement',
  interview_90day_scheduled:    'info',
  interview_exit_scheduled:     'alert',
  interview_completed:          'success',
  survey_available:             'info',
  survey_deadline_approaching:  'warning',
  survey_closed:                'info',
  team_member_added:            'info',
  team_member_moved:            'info',
};
