export interface User {
  id: string;
  email: string;
  name: string;
  position: string;
  is_leader: boolean;
  is_director: boolean;
  active: boolean;
  phone?: string | null;
  birth_date?: string | null;
  join_date?: string;
  reports_to?: string | null;
  profile_image?: string | null;
  created_at?: string;
  updated_at?: string;
  position_start_date?: string;
}