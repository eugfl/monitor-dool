import axios from 'axios';
import type { Edicao, Materia, StatsOrgao } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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
    edicao_id?: number;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get<Materia[]>('/materias/', { params });
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
};

export default api;
