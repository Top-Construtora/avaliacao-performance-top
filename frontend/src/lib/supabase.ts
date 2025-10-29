import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Por favor, configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env.local'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false, // Mudado para false - não persiste a sessão
    detectSessionInUrl: true,
    storage: {
      // Usa sessionStorage em vez de localStorage
      // sessionStorage é limpo quando o navegador fecha
      getItem: (key: string) => {
        return sessionStorage.getItem(key)
      },
      setItem: (key: string, value: string) => {
        sessionStorage.setItem(key, value)
      },
      removeItem: (key: string) => {
        sessionStorage.removeItem(key)
      }
    }
  }
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          position: string
          is_leader: boolean
          is_director: boolean
          phone: string | null
          birth_date: string | null
          join_date: string
          active: boolean
          reports_to: string | null
          profile_image: string | null
          created_at: string
          updated_at: string
          contract_type?: 'CLT' | 'PJ' | 'ESTAGIO'
          current_track_position_id?: string | null
          current_salary_level_id?: string | null
          current_salary?: number | null
          position_start_date?: string | null
          department_id?: string | null
          track_id?: string | null
          position_id?: string | null
          intern_level?: string | null
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      departments: {
        Row: {
          id: string
          name: string
          description: string | null
          responsible_id: string | null
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['departments']['Insert']>
      }
      teams: {
        Row: {
          id: string
          name: string
          department_id: string | null
          responsible_id: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      team_members: {
        Row: {
          team_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>
      }
    }
  }
}