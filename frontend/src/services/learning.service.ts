import { api } from '../config/api';

export interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  workload_hours: number | null;
  cover_url: string | null;
  active: boolean;
  contents_count?: number;
  classes_count?: number;
}

export interface CourseContent {
  id: string;
  section: string | null;
  title: string;
  type: 'video' | 'link' | 'file';
  url: string;
  mandatory: boolean;
  position: number;
  done?: boolean;
}

export interface CourseClass {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  allow_late_completion: boolean;
  self_enrollment: boolean;
  survey_id?: string | null;
  active: boolean;
  enrollments_count?: number;
  course?: Course | null;
}

export interface LearningTrack {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  courses?: Array<{ position: number; course: Course | null }>;
  enrollments_count?: number;
}

export interface MyTrack {
  id: string;
  track: { id: string; name: string; description: string | null } | null;
  completed_at: string | null;
  progress: number;
  courses: Array<Course & { status: 'completed' | 'current' | 'locked' }>;
}

export interface Enrollment {
  id: string;
  class_id: string;
  user_id: string;
  mandatory: boolean;
  progress: number;
  completed_at: string | null;
  created_at: string;
  class?: CourseClass | null;
  contents?: CourseContent[];
  user?: { id: string; name: string; position?: string | null } | null;
}

export interface ExternalCourse {
  id: string;
  user_id: string;
  name: string;
  institution: string | null;
  workload_hours: number | null;
  completed_at: string | null;
  certificate_url: string | null;
  status: 'pending' | 'approved' | 'rejected';
  review_note: string | null;
  created_at: string;
  user?: { id: string; name: string; position?: string | null } | null;
}

function unwrap(response: any) {
  return response.data || response;
}

export const learningApiService = {
  // Aluno
  async myEnrollments(): Promise<Enrollment[]> {
    return unwrap(await api.get('/learning/my-enrollments')) || [];
  },
  async enrollmentDetail(id: string): Promise<Enrollment> {
    return unwrap(await api.get(`/learning/enrollments/${id}`));
  },
  async setContentDone(
    enrollmentId: string,
    contentId: string,
    done: boolean,
  ): Promise<{ progress: number; completed: boolean }> {
    return unwrap(
      await api.patch(`/learning/enrollments/${enrollmentId}/contents/${contentId}`, { done }),
    );
  },
  async catalog(): Promise<CourseClass[]> {
    return unwrap(await api.get('/learning/catalog')) || [];
  },
  async selfEnroll(classId: string): Promise<void> {
    await api.post(`/learning/catalog/${classId}/enroll`, {});
  },

  // Cursos externos
  async myExternalCourses(): Promise<ExternalCourse[]> {
    return unwrap(await api.get('/learning/external')) || [];
  },
  async submitExternalCourse(data: {
    name: string;
    institution?: string;
    workload_hours?: number;
    completed_at?: string;
    certificate_url?: string;
  }): Promise<ExternalCourse> {
    return unwrap(await api.post('/learning/external', data));
  },
  async pendingExternalCourses(): Promise<ExternalCourse[]> {
    return unwrap(await api.get('/learning/external/pending')) || [];
  },
  async reviewExternalCourse(id: string, status: 'approved' | 'rejected', note?: string) {
    await api.patch(`/learning/external/${id}/review`, { status, note });
  },

  // Gestão
  async listCourses(all = false): Promise<Course[]> {
    return unwrap(await api.get(`/learning/courses${all ? '?all=true' : ''}`)) || [];
  },
  async createCourse(data: Partial<Course>): Promise<Course> {
    return unwrap(await api.post('/learning/courses', data));
  },
  async updateCourse(id: string, data: Partial<Course>): Promise<Course> {
    return unwrap(await api.put(`/learning/courses/${id}`, data));
  },
  async courseDetail(
    id: string,
  ): Promise<Course & { contents: CourseContent[]; classes: CourseClass[] }> {
    return unwrap(await api.get(`/learning/courses/${id}`));
  },
  async addContent(courseId: string, data: Partial<CourseContent>): Promise<CourseContent> {
    return unwrap(await api.post(`/learning/courses/${courseId}/contents`, data));
  },
  async deleteContent(courseId: string, contentId: string): Promise<void> {
    await api.delete(`/learning/courses/${courseId}/contents/${contentId}`);
  },
  async createClass(courseId: string, data: Partial<CourseClass>): Promise<CourseClass> {
    return unwrap(await api.post(`/learning/courses/${courseId}/classes`, data));
  },
  async updateClass(classId: string, data: Partial<CourseClass>): Promise<CourseClass> {
    return unwrap(await api.put(`/learning/classes/${classId}`, data));
  },
  async enroll(
    classId: string,
    userIds: string[],
    mandatory: boolean,
  ): Promise<{ enrolled: number }> {
    return unwrap(
      await api.post(`/learning/classes/${classId}/enroll`, {
        user_ids: userIds,
        mandatory,
      }),
    );
  },
  async classOverview(classId: string): Promise<Enrollment[]> {
    return unwrap(await api.get(`/learning/classes/${classId}/overview`)) || [];
  },

  // Trilhas
  async myTracks(): Promise<MyTrack[]> {
    return unwrap(await api.get('/learning/my-tracks')) || [];
  },
  async listTracks(all = false): Promise<LearningTrack[]> {
    return unwrap(await api.get(`/learning/tracks${all ? '?all=true' : ''}`)) || [];
  },
  async createTrack(data: { name: string; description?: string }): Promise<LearningTrack> {
    return unwrap(await api.post('/learning/tracks', data));
  },
  async setTrackCourses(trackId: string, courseIds: string[]): Promise<void> {
    await api.put(`/learning/tracks/${trackId}/courses`, { course_ids: courseIds });
  },
  async enrollInTrack(trackId: string, userIds: string[]): Promise<{ enrolled: number }> {
    return unwrap(await api.post(`/learning/tracks/${trackId}/enroll`, { user_ids: userIds }));
  },

  // Upload (Storage)
  async uploadFile(file: File): Promise<{ url: string | null; path: string }> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return unwrap(
      await api.post('/learning/upload', {
        filename: file.name,
        content_type: file.type || 'application/octet-stream',
        content_base64: base64,
      }),
    );
  },
};
