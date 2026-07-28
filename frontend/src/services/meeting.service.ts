import { api } from '../config/api';

export interface MeetingType {
  id: string;
  name: string;
}

export interface MeetingUserRef {
  id: string;
  name: string;
  position?: string | null;
  reports_to?: string | null;
}

export interface MeetingTopic {
  id: string;
  text: string;
  position: number;
  covered: boolean;
}

export interface MeetingNote {
  id: string;
  author_id: string;
  content: string;
  is_private: boolean;
  created_at: string;
  author?: { id: string; name: string } | null;
}

export interface MeetingTask {
  id: string;
  description: string;
  assignee_id: string | null;
  due_date: string | null;
  done_at: string | null;
  assignee?: { id: string; name: string } | null;
}

export interface Meeting {
  id: string;
  title: string | null;
  scheduled_at: string;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  status: 'scheduled' | 'completed' | 'cancelled';
  recurrence: 'none' | 'weekly' | 'biweekly' | 'monthly';
  organizer_id: string;
  type: MeetingType | null;
  organizer: MeetingUserRef | null;
  participants: Array<{ user_id: string; user: MeetingUserRef | null }>;
  topics?: MeetingTopic[];
  notes?: MeetingNote[];
  tasks?: MeetingTask[];
}

function unwrap(response: any) {
  return response.data || response;
}

export const meetingApiService = {
  async listTypes(): Promise<MeetingType[]> {
    const response = await api.get('/meetings/types');
    return unwrap(response) || [];
  },

  async list(scope: 'upcoming' | 'past'): Promise<Meeting[]> {
    const response = await api.get(`/meetings?scope=${scope}`);
    return unwrap(response) || [];
  },

  async getById(id: string): Promise<Meeting> {
    const response = await api.get(`/meetings/${id}`);
    return unwrap(response);
  },

  async create(data: {
    type_id: string;
    title?: string;
    scheduled_at: string;
    duration_minutes?: number;
    location?: string;
    meeting_url?: string;
    participant_ids: string[];
    recurrence?: string;
    topics?: string[];
  }): Promise<Meeting> {
    const response = await api.post('/meetings', data);
    return unwrap(response);
  },

  async update(id: string, data: Record<string, unknown>): Promise<Meeting> {
    const response = await api.put(`/meetings/${id}`, data);
    return unwrap(response);
  },

  async setStatus(id: string, status: 'completed' | 'cancelled'): Promise<void> {
    await api.patch(`/meetings/${id}/status`, { status });
  },

  async addTopic(id: string, text: string): Promise<MeetingTopic> {
    const response = await api.post(`/meetings/${id}/topics`, { text });
    return unwrap(response);
  },

  async setTopicCovered(id: string, topicId: string, covered: boolean): Promise<void> {
    await api.patch(`/meetings/${id}/topics/${topicId}`, { covered });
  },

  async addNote(id: string, content: string, isPrivate: boolean): Promise<MeetingNote> {
    const response = await api.post(`/meetings/${id}/notes`, {
      content,
      is_private: isPrivate,
    });
    return unwrap(response);
  },

  async deleteNote(id: string, noteId: string): Promise<void> {
    await api.delete(`/meetings/${id}/notes/${noteId}`);
  },

  async addTask(
    id: string,
    data: { description: string; assignee_id?: string; due_date?: string },
  ): Promise<MeetingTask> {
    const response = await api.post(`/meetings/${id}/tasks`, data);
    return unwrap(response);
  },

  async setTaskDone(id: string, taskId: string, done: boolean): Promise<void> {
    await api.patch(`/meetings/${id}/tasks/${taskId}`, { done });
  },
};
