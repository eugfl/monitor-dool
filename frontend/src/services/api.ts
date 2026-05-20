import axios from 'axios';
import type {
  CollectionStatus,
  DashboardStats,
  Edicao,
  FilterOptionsResponse,
  Materia,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

interface MateriasRequestParams {
  q?: string;
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  edicao_id?: number;
  limit?: number;
  offset?: number;
}

interface MateriasApiParams extends Omit<MateriasRequestParams, 'tipo'> {
  tipo_documental?: string;
}

interface ApiErrorPayload {
  detail?: string;
  message?: string;
}

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

export function getApiErrorMessage(error: unknown, fallback = 'Não foi possível completar a solicitação.') {
  if (!axios.isAxiosError<ApiErrorPayload>(error)) {
    return fallback;
  }

  if (error.code === 'ECONNABORTED') {
    return 'A consulta demorou mais que o esperado. Tente novamente em alguns instantes.';
  }

  if (!error.response) {
    return 'Não foi possível conectar à API. Verifique se o backend está online.';
  }

  const apiMessage = error.response.data?.detail || error.response.data?.message;
  if (apiMessage) {
    return apiMessage;
  }

  if (error.response.status === 404) {
    return 'O recurso solicitado não foi encontrado.';
  }

  if (error.response.status >= 500) {
    return 'O servidor encontrou um problema ao processar a solicitação.';
  }

  return fallback;
}

export function isApiNotFound(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}

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
  getMaterias: async (params: MateriasRequestParams) => {
    const hasFilters = params.q || params.tipo || params.data_inicio || params.data_fim;
    const endpoint = hasFilters ? '/materias/search/' : '/materias/';
    
    const { tipo, ...rest } = params;
    const queryParams: MateriasApiParams = tipo
      ? { ...rest, tipo_documental: tipo }
      : rest;

    const response = await api.get<Materia[]>(endpoint, { params: queryParams });
    return response.data;
  },
  getMateria: async (id: number) => {
    const response = await api.get<Materia>(`/materias/${id}`);
    return response.data;
  },
  getMateriaPdfUrl: (id: number) => `${API_BASE_URL.replace(/\/$/, '')}/materias/${id}/pdf`,
  getFilterOptions: async () => {
    const response = await api.get<FilterOptionsResponse>('/materias/filtros');
    return response.data;
  },
  getDashboardSummary: async () => {
    const response = await api.get<DashboardStats>('/materias/estatisticas/resumo');
    return response.data;
  },
  triggerColeta: async (data_inicio: string, data_fim?: string) => {
    const params = data_fim ? { data_fim } : {};
    const response = await api.post<CollectionStatus>(`/tasks/coleta/${data_inicio}`, null, { params });
    return response.data;
  },
  getColetaStatus: async (jobId: string) => {
    const response = await api.get<CollectionStatus>(`/tasks/coleta/status/${jobId}`);
    return response.data;
  },
};

export default api;
