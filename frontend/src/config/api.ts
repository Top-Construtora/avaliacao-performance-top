const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('access_token');
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP error! status: ${response.status}` 
        }));
        
        const error: any = new Error(errorData.message || errorData.error || 'API request failed');
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }
      
      const data = await response.json();
      
      // Se a resposta tem sucesso mas está estruturada diferente
      if (data.success === false) {
        const error: any = new Error(data.error || data.message || 'Request failed');
        error.response = {
          status: response.status,
          data: data
        };
        throw error;
      }
      
      return data;
    } catch (error: any) {
      // Se for erro de rede/conexão
      if (!error.response) {
        error.request = true;
      }
      throw error;
    }
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};