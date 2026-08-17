import { api } from '../config/api';

/**
 * Portal de vagas (público) e banco de currículos (interno).
 *
 * As chamadas de `/public` não exigem login: são a porta pela qual o candidato
 * se cadastra sozinho.
 */
export interface PublicOpening {
  id: string;
  title: string;
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  location: string | null;
  contract_type: string | null;
  positions_count: number;
  status: string;
  created_at: string;
  department?: { id: string; name: string } | null;
}

export interface CandidateApplication {
  name: string;
  email: string;
  phone: string;
  city?: string | null;
  state?: string | null;
  linkedin_url?: string | null;
  summary?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string | null;
  salary_expectation?: number | null;
  availability?: string | null;
  resume_filename?: string | null;
  resume_base64?: string | null;
}

/** Mini currículo como o RH vê no banco. */
export interface CandidateProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  linkedin_url: string | null;
  summary: string | null;
  education: string | null;
  experience: string | null;
  skills: string | null;
  salary_expectation: number | null;
  availability: string | null;
  resume_name: string | null;
  source: string | null;
  created_at: string;
  applications_count?: number;
  applications?: Array<{
    id: string;
    status: string;
    rating: number | null;
    created_at: string;
    opening?: { id: string; title: string; status: string } | null;
  }>;
}

function unwrap(response: any) {
  return response.data || response;
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const careersService = {
  // ===== Público =====
  async listOpenings(): Promise<PublicOpening[]> {
    return unwrap(await api.get('/public/openings')) || [];
  },

  async getOpening(id: string): Promise<PublicOpening> {
    return unwrap(await api.get(`/public/openings/${id}`));
  },

  async apply(openingId: string, data: CandidateApplication): Promise<{ candidate_id: string }> {
    return unwrap(await api.post(`/public/openings/${openingId}/apply`, data));
  },

  // ===== Interno (banco de currículos) =====
  async listCandidates(search?: string): Promise<CandidateProfile[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return unwrap(await api.get(`/recruitment/candidate-bank${query}`)) || [];
  },

  async getCandidate(id: string): Promise<CandidateProfile> {
    return unwrap(await api.get(`/recruitment/candidate-bank/${id}`));
  },

  async resumeUrl(id: string): Promise<{ url: string; file_name: string | null }> {
    return unwrap(await api.get(`/recruitment/candidate-bank/${id}/resume-url`));
  },
};
