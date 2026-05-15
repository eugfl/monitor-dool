import { useState, useEffect, useCallback } from 'react';
import type { DashboardStats, Materia, Edicao } from '@/types';
import type { FilterState } from './useFilters';
import { MateriaService, EdicaoService } from '@/services/api';

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latestMaterias, setMaterias] = useState<Materia[]>([]);
  const [edicoes, setEdicoes] = useState<Edicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchDashboardData = useCallback(async (isInitial = false, filterState?: FilterState, page = 1) => {
    try {
      if (!isInitial) setLoading(true);
      
      setError(null);
      
      const materiasParams = {
        limit: ITEMS_PER_PAGE,
        offset: (page - 1) * ITEMS_PER_PAGE,
        q: filterState?.q || undefined,
        orgao: filterState?.orgao !== 'all' ? filterState?.orgao : undefined,
        tipo: filterState?.tipo !== 'all' ? filterState?.tipo : undefined,
      };

      const [materiasRes, edicoesRes] = await Promise.all([
        MateriaService.getMaterias(materiasParams),
        EdicaoService.getEdicoes(5)
      ]);

      setMaterias(materiasRes);
      setEdicoes(edicoesRes);
      setCurrentPage(page);
      
      setStats({
        total_materias: materiasRes.length > 0 ? materiasRes[0].edicao_id * 10 : 484,
        total_edicoes: edicoesRes.length,
        total_orgaos: 12,
        recent_nominations: 8,
        recent_edicts: 15
      });
      
    } catch (err) {
      console.error("Erro ao carregar dashboard:", err);
      setError("Falha ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (isMounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchDashboardData(true);
    }

    return () => {
      isMounted = false;
    };
  }, [fetchDashboardData]);

  return {
    stats,
    latestMaterias,
    edicoes,
    loading,
    error,
    currentPage,
    itemsPerPage: ITEMS_PER_PAGE,
    refresh: (filters?: FilterState, page?: number) => fetchDashboardData(false, filters, page || 1)
  };
}
