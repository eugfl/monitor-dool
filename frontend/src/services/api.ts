import axios from 'axios';
import type { Edicao, Materia, StatsOrgao } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor global de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('🌐 API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      detail: error.response?.data?.detail || error.message
    });
    return Promise.reject(error);
  }
);

export const EdicaoService = {
  getEdicoes: async (limit = 10, offset = 0) => {
    const response = await api.get<Edicao[]>('/edicoes/', {
      params: { limit, offset },
    });
    return response.data;
  },
  getEdicaoByDate: async (date: string) => {
    const response = await api.get<Edicao>(`/edicoes/data/${date}`);
    return response.data;
  },
};

export const MateriaService = {
  getMaterias: async (params: {
    q?: string;
    orgao?: string;
    tipo?: string;
    data_inicio?: string;
    data_fim?: string;
    edicao_id?: number;
    limit?: number;
    offset?: number;
  }) => {
    const hasFilters = params.q || params.orgao || params.tipo || params.data_inicio || params.data_fim;
    const endpoint = hasFilters ? '/materias/search/' : '/materias/';
    
    const queryParams: any = { ...params };
    if (queryParams.tipo) {
      queryParams.tipo_documental = queryParams.tipo;
      delete queryParams.tipo;
    }

    const response = await api.get<Materia[]>(endpoint, { params: queryParams });
    return response.data;
  },
  getMateria: async (id: number) => {
    const response = await api.get<Materia>(`/materias/${id}`);
    return response.data;
  },
  getStatsOrgaos: async (limit = 20) => {
    const response = await api.get<StatsOrgao[]>('/materias/estatisticas/orgaos', {
      params: { limit },
    });
    return response.data;
  },
  getStatsTipos: async () => {
    const response = await api.get<StatsOrgao[]>('/materias/estatisticas/tipos');
    return response.data;
  },
  triggerColeta: async (data_inicio: string, data_fim?: string) => {
    const params = data_fim ? { data_fim } : {};
    const response = await api.post<{ message: string; status: string }>(`/tasks/coleta/${data_inicio}`, null, { params });
    return response.data;
  },
};

export default api;
