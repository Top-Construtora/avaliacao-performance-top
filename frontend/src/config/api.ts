// Em desenvolvimento, usar path relativo para aproveitar o proxy do Vite
// Em produção, usar a URL completa da API
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (window.location.hostname.includes('vercel.app')
    ? 'https://avaliacao-performance-naue.onrender.com/api'
    : '/api');

// Removido log de debug com informações sensíveis

export const api = {
  baseURL: API_BASE_URL,
  
  async request(endpoint: string, options: RequestInit = {}) {
    const token = sessionStorage.getItem('access_token');
    
    // Headers padrão limpos
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Adiciona token se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Não adiciona headers customizados que possam causar problemas
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Importante para CORS
      mode: 'cors', // Explicitamente define modo CORS
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
      if (!response.ok) {
        let errorData: any = { message: `HTTP error! status: ${response.status}` };

        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
            const text = await response.text();
            if (text && text.trim() !== '') {
              errorData = JSON.parse(text);
            }
          } else {
            const text = await response.text();
            if (text) {
              errorData = { message: text };
            }
          }
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', parseError);
        }

        const error: any = new Error(errorData.message || errorData.error || 'API request failed');
        error.response = {
          status: response.status,
          data: errorData
        };
        throw error;
      }
      
      // Verifica se a resposta é JSON
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        // Ler o texto primeiro para verificar se está vazio
        const text = await response.text();

        // Se a resposta estiver vazia, retornar objeto de sucesso padrão
        if (!text || text.trim() === '') {
          console.warn('⚠️ API retornou resposta JSON vazia');
          return { success: true };
        }

        // Tentar fazer parse do JSON
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse de JSON:', text);
          const error: any = new Error('Resposta inválida do servidor');
          error.response = {
            status: response.status,
            data: { error: 'Invalid JSON response' }
          };
          throw error;
        }

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
      } else {
        // Se não for JSON, retorna como texto
        return await response.text();
      }
    } catch (error: any) {
      // Se for erro de rede/conexão
      if (!error.response) {
        error.request = true;
      }
      
      // Log de debug em desenvolvimento
      if (import.meta.env.DEV) {
        console.error('API Request Error:', {
          endpoint,
          method: options.method || 'GET',
          error: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
      }
      
      throw error;
    }
  },

  get(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, { 
      method: 'GET',
      headers: customHeaders 
    });
  },

  post(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  put(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  patch(endpoint: string, data: any, customHeaders?: HeadersInit) {
    return this.request(endpoint, {
      method: 'PATCH', 
      body: JSON.stringify(data),
      headers: customHeaders
    });
  },

  delete(endpoint: string, customHeaders?: HeadersInit) {
    return this.request(endpoint, { 
      method: 'DELETE',
      headers: customHeaders
    });
  },
};